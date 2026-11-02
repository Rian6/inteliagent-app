import { api as axios } from '../service/default/defaultHTTPService';
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { AccountDatabases } from "./accounts.ts";
import { OfflineEngine } from "./engine.ts";
import { tokenExpiresAt } from "./session.ts";
import { offlineSession } from "./sessionStore";
import { openDatabase, backupDatabase, setActiveDatabase } from "./database";
import { ensureGeneratedSchema, registerLegacySchema } from "./nativeMigrations";
import { getValidToken, setToken, clearToken } from "../service/default/tokenStore";
import useVisitaStore, {
  configureVisitPersistence,
} from "../context/visitaContext";
import { VisitDrafts } from "./visits.ts";
import { AUTHSERVICE } from "../constants/urls";
import { LOADSERVICE } from "../constants/urls";
import { useSyncStore } from "../context/syncContext";
import { useSessionStore } from "../context/sessionContext";

const accounts = new AccountDatabases({
  open: openDatabase,
  backup: backupDatabase,
  migrate: async db => ensureGeneratedSchema(db.native),
  baseline: async db => registerLegacySchema(db.native),
});
let engine: OfflineEngine | null = null,
  timer: ReturnType<typeof setTimeout> | null = null,
  lastPull = 0,
  activation = Promise.resolve(),
  restoration: Promise<any> | null = null,
  activating = false;
export const isActivating = () => activating;
export const currentEngine = () => {
  if (!engine) throw new Error("Entre na sua conta antes de acessar os dados");
  return engine;
};
export function updateActiveProfile(profile) {
  if (engine && profile.id===engine.user.id && profile.idCede===engine.user.idCede) engine.user=profile;
}
export function deactivateAccount() {
  if (timer) clearTimeout(timer);
  timer = null;
  engine?.dispose();
  engine = null;
  setActiveDatabase(null);
  configureVisitPersistence(null);
  useVisitaStore.getState().resetVisita();
}
async function deviceId() {
  let id = await SecureStore.getItemAsync("inteliagent.device-id");
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync("inteliagent.device-id", id);
  }
  return id;
}
async function publish(selected) {
  if (engine !== selected) return;
  const status = await selected.status();
  if (engine === selected) useSyncStore.getState().update(status);
}
export function scheduleSync(delay = 300) {
  if (!engine) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    synchronize().catch(() => {});
  }, delay);
}
async function activate(input, { onlineLogin = false } = {}) {
  deactivateAccount();
  lastPull = 0;
  useSessionStore.getState().setProfile(null);
  const { token, refreshToken, senha, securityPassword, codigoEmail, ...profile } = input;
  const db = await accounts.activate(profile);
  const clientId = await deviceId();
  let selected;
  const request = async (method, path, data, signal) => {
    try {
      return (
        await axios({
          method,
          url: LOADSERVICE + path,
          data,
          signal,
          timeout: 15000,
        })
      ).data;
    } catch (error) {
      error.status = error.response?.status;
      const retryAfter = error.response?.headers?.["retry-after"];
      if (retryAfter) error.retryAfterMs = Number(retryAfter) * 1000;
      if (error.status === 401 && engine === selected) {
        useSyncStore
          .getState()
          .update({ requiresLogin: true, phase: "auth_required" });
      }
      throw error;
    }
  };
  selected = new OfflineEngine({
    db,
    user: profile,
    uuid: () => Crypto.randomUUID(),
    transport: {
      online: async () => {
        const state = await NetInfo.fetch();
        return state.isConnected && state.isInternetReachable !== false;
      },
      authorized: async () => tokenExpiresAt(await getValidToken() || '') > Date.now() + 5000,
      upload: (batch, signal) => request("post", "/api/sync", batch, signal),
      download: ({ userId, full, offset, downloadId, signal }) =>
        request(
          "get",
          `/api/consumer/${userId}?isLoadFull=${full}&offset=${offset}&downloadId=${encodeURIComponent(downloadId)}&clientId=${clientId}`,
          undefined,
          signal,
        ),
      confirm: ({ userId, downloadId, tables, signal }) =>
        request(
          "post",
          `/api/consumer-confirm/${userId}?downloadId=${encodeURIComponent(downloadId)}`,
          tables,
          signal,
        ),
    },
    onChange: ({ local = false } = {}) => {
      if (engine === selected) {
        publish(selected).catch(() => {});
        if (local) scheduleSync();
      }
    },
  });
  engine = selected;
  setActiveDatabase(db);
  await selected.recoverLegacy();
  if (onlineLogin) {
    try {
      await setToken(String(token || '').replace(/^Bearer /, ''), refreshToken);
      await offlineSession.save(profile);
    } catch (error) {
      await clearToken();
      deactivateAccount();
      throw error;
    }
  }
  const drafts = new VisitDrafts(db);
  useVisitaStore.getState().resetVisita();
  let pendingDraftWrites = 0;
  configureVisitPersistence({
    drafts,
    before: () => {
      pendingDraftWrites++;
      if (engine === selected)
        useSyncStore.getState().update({ draftSaving: true });
    },
    changed: (id) => {
      pendingDraftWrites--;
      if (engine === selected)
        useSyncStore
          .getState()
          .update({
            draftSaving: pendingDraftWrites > 0,
            draftSavedId: id,
            draftError: "",
          });
    },
    failed: () => {
      pendingDraftWrites--;
      if (engine === selected)
        useSyncStore
          .getState()
          .update({
            draftSaving: pendingDraftWrites > 0,
            draftError:
              "Não foi possível salvar o rascunho. Verifique o espaço livre do dispositivo.",
          });
    },
  });
  useSessionStore.getState().setProfile(profile);
  const savedSync = await db.getFirstAsync(
    "SELECT VALUE FROM SYNC_META WHERE KEY='last_sync'",
  );
  useSyncStore
    .getState()
    .update({
      phase: "idle",
      error: "",
      requiresLogin: false,
      lastSync: Number(savedSync?.VALUE) || null,
      draftError: "",
      draftSaving: false,
      draftSavedId: undefined,
    });
  await publish(selected);
  scheduleSync(0);
  return profile;
}
export function activateAccount(input, options = {}) {
  const operation = activation.then(async () => {
    activating = true;
    try {
      return await activate(input, options);
    } finally {
      activating = false;
    }
  });
  activation = operation.catch(() => {});
  return operation;
}
export function restoreAccount() {
  if (!restoration)
    restoration = (async () => {
      let profile = await offlineSession.restore();
      if (!profile) {
        try { await getValidToken({ force:true }); profile=await offlineSession.restore(); }
        catch { /* Offline access still follows the previously validated window. */ }
      }
      if (profile) await activateAccount(profile);
      return profile;
    })().finally(() => {
      restoration = null;
    });
  return restoration;
}
export async function synchronize({ full = false, force = false } = {}) {
  if (!engine) return;
  const selected = engine;
  const before = await selected.status();
  if (!force && !full && !before.pending && Date.now() - lastPull < 60000)
    return;
  if (force)
    await selected.db.runAsync(
      "UPDATE SYNC_OUTBOX SET NEXT_ATTEMPT_AT=0 WHERE STATE='pending'",
    );
  useSyncStore.getState().update({ phase: "syncing", error: "" });
  try {
    const result = await selected.sync({ full });
    if (engine !== selected) return;
    if (result.offline) {
      useSyncStore.getState().update({ phase: "offline" });
      await publish(selected);
      return result;
    } else {
      lastPull = Date.now();
      useSyncStore
        .getState()
        .update({
          phase: result.conflicts
            ? "conflict"
            : result.rejected
              ? "error"
              : "idle",
          lastSync: lastPull,
          requiresLogin: false,
        });
    }
    await publish(selected);
    const status = await selected.status();
    if (status.nextRetry)
      scheduleSync(Math.max(1000, status.nextRetry - Date.now()));
    else if (status.ready) scheduleSync(500);
    return result;
  } catch (error) {
    if (engine === selected) {
      const state =
        error.code === "AUTH_REQUIRED" || error.status === 401
          ? "auth_required"
          : "error";
      useSyncStore
        .getState()
        .update({
          phase: state,
          error:
            state === "auth_required"
              ? "Entre novamente para sincronizar. Seus dados permanecem salvos."
              : "Sem conexão com o serviço. Os dados continuam salvos no dispositivo.",
          requiresLogin: state === "auth_required",
        });
      await publish(selected);
      if (state !== "auth_required") {
        const status = await selected.status();
        scheduleSync(
          status.nextRetry
            ? Math.max(1000, status.nextRetry - Date.now())
            : 30000,
        );
      }
    }
    throw error;
  }
}
