export const OFFLINE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const KEY = "inteliagent.offline-session.v1";
export class OfflineSession {
  store: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<any>;
    remove: (key: string) => Promise<any>;
  };
  now: () => number;
  windowMs: number;
  constructor({ store, now = Date.now, windowMs = OFFLINE_WINDOW_MS }) {
    this.store = store;
    this.now = now;
    this.windowMs = windowMs;
  }
  pending: Promise<any> = Promise.resolve();
  enqueue(operation: () => Promise<any>) {
    const next = this.pending.then(operation);
    this.pending = next.catch(() => {});
    return next;
  }
  save(profile) {
    return this.enqueue(async () => {
      const {
        token,
        refreshToken,
        senha,
        securityPassword,
        codigoEmail,
        ...safe
      } = profile;
      const now = this.now();
      await this.store.set(
        KEY,
        JSON.stringify({
          profile: safe,
          validatedAt: now,
          lastSeenAt: now,
          expiresAt: now + this.windowMs,
        }),
      );
    });
  }
  async updatePermissions(identity, permissions) {
    return this.enqueue(async () => {
      const raw = await this.store.get(KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (
        session.profile?.id !== identity.id ||
        session.profile?.idCede !== identity.idCede
      )
        return;
      session.profile.permissions = permissions;
      await this.store.set(KEY, JSON.stringify(session));
    });
  }
  async updateProfile(identity, fields) {
    return this.enqueue(async () => {
      const raw = await this.store.get(KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (
        session.profile?.id !== identity.id ||
        session.profile?.idCede !== identity.idCede
      )
        return;
      session.profile = {
        ...session.profile,
        ...fields,
        id: identity.id,
        idCede: identity.idCede,
      };
      await this.store.set(KEY, JSON.stringify(session));
    });
  }
  restore() {
    return this.enqueue(async () => {
      const raw = await this.store.get(KEY);
      if (!raw) return null;
      let session;
      try {
        session = JSON.parse(raw);
      } catch {
        await this.store.remove(KEY);
        return null;
      }
      const now = this.now();
      if (
        !session.profile?.id ||
        !session.profile?.idCede ||
        !Number.isFinite(session.expiresAt) ||
        session.expiresAt <= now ||
        now + 300000 < session.lastSeenAt
      ) {
        await this.store.remove(KEY);
        return null;
      }
      session.lastSeenAt = Math.max(now, session.lastSeenAt);
      await this.store.set(KEY, JSON.stringify(session));
      return session.profile;
    });
  }
  clear() {
    return this.enqueue(() => this.store.remove(KEY));
  }
}

// Expiry is a local scheduling hint; only the server validates JWT signatures and permissions.
export function tokenExpiresAt(token) {
  try {
    const input = token
      .replace(/^Bearer /, "")
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let buffer = 0,
      bits = 0;
    const bytes: number[] = [];
    for (const char of input) {
      const n = alphabet.indexOf(char);
      if (n < 0) continue;
      buffer = (buffer << 6) | n;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 255);
      }
    }
    const payload = JSON.parse(
      decodeURIComponent(
        bytes.map((byte) => "%" + byte.toString(16).padStart(2, "0")).join(""),
      ),
    );
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}
