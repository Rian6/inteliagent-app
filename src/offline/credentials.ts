import { tokenExpiresAt } from './session.ts';
export const ACCESS_KEY = 'inteliagent.token';
export const REFRESH_KEY = 'inteliagent.refresh-token';
type Store = { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<any>; remove: (key: string) => Promise<any> };

/** Durable credentials with one renewal at a time and guards against late responses after logout/account changes. */
export class Credentials {
  store: Store;
  renew: (token: string) => Promise<Record<string, any>>;
  onRenew: (profile: Record<string, any>) => Promise<any>;
  now: () => number;
  epoch = 0;
  pending: Promise<string | null> | null = null;
  writes: Promise<any> = Promise.resolve();
  constructor({ store, renew, onRenew = async () => {}, now = Date.now }: { store: Store; renew: (token: string) => Promise<Record<string, any>>; onRenew?: (profile: Record<string, any>) => Promise<any>; now?: () => number }) {
    this.store=store; this.renew=renew; this.onRenew=onRenew; this.now=now;
  }
  serial<T>(work: () => Promise<T>): Promise<T> {
    const result=this.writes.then(work);
    this.writes=result.catch(() => {});
    return result;
  }
  get() { return this.store.get(ACCESS_KEY); }
  async save(token: string, refresh?: string) {
    this.epoch++;
    return this.serial(async () => {
      await this.store.set(ACCESS_KEY,token.replace(/^Bearer /,''));
      if (refresh) await this.store.set(REFRESH_KEY,refresh);
      else await this.store.remove(REFRESH_KEY);
    });
  }
  async clear() {
    this.epoch++;
    return this.serial(async () => { await this.store.remove(ACCESS_KEY); await this.store.remove(REFRESH_KEY); });
  }
  invalidate(rejected?: string | null) {
    return this.serial(async () => {
      if (rejected && await this.get()===rejected) await this.store.remove(ACCESS_KEY);
    });
  }
  async valid({ force=false, rejected }: { force?: boolean; rejected?: string } = {}): Promise<string | null> {
    const token=await this.get();
    if ((!force || (rejected && rejected!==token)) && tokenExpiresAt(token || '')>this.now()+30000) return token;
    const refresh=await this.store.get(REFRESH_KEY);
    if (!refresh) return tokenExpiresAt(token || '')>this.now()+5000 ? token : null;
    if (this.pending) return this.pending;
    const epoch=this.epoch;
    this.pending=(async () => {
      try {
        const profile=await this.renew(refresh);
        if (!profile.token || tokenExpiresAt(profile.token)<=this.now()) throw new Error('Resposta de renovação inválida.');
        return await this.serial(async () => {
          if (epoch!==this.epoch) return null;
          await this.store.set(ACCESS_KEY,profile.token);
          if (profile.refreshToken) await this.store.set(REFRESH_KEY,profile.refreshToken);
          await this.onRenew(profile);
          return profile.token;
        });
      } catch (error) {
        if ((error.status || error.response?.status)===401) {
          await this.serial(async () => {
            if (epoch!==this.epoch) return;
            await this.store.remove(ACCESS_KEY); await this.store.remove(REFRESH_KEY);
          });
        }
        throw error;
      }
    })().finally(() => { this.pending=null; });
    return this.pending;
  }
}
