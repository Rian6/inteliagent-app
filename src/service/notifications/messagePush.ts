import { AppState, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { api } from "../default/defaultHTTPService";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { useSessionStore } from "@root/context/sessionContext";

export const PUSH_DEVICE_KEY = "inteliagent-push-installation";
let conversation: string | null = null;
export const setNotificationConversation = (id: string | null) => {
  conversation = id;
};
export function nativePushAvailable() {
  return (
    Platform.OS !== "web" &&
    Constants.executionEnvironment !== "storeClient" &&
    !!requireOptionalNativeModule("ExpoPushTokenManager")
  );
}
export async function notificationModule() {
  if (!nativePushAvailable()) return null;
  return import("expo-notifications");
}
let permissionRequest: { ask: boolean; promise: Promise<boolean> } | undefined;
function logPermission(event: string, details: Record<string, unknown> = {}) {
  if (__DEV__) console.info("[notifications:permission]", JSON.stringify({
    event, os: Platform.OS, version: Platform.Version,
    runtime: Constants.executionEnvironment, ...details,
  }));
}
export async function ensureNotificationPermission(askPermission = false): Promise<boolean> {
  // Display permission belongs to the installed app, independently of login,
  // Firebase credentials or whether remote push is supported by this runtime.
  if (Platform.OS === "web" || !requireOptionalNativeModule("ExpoNotificationPermissionsModule")) {
    logPermission("unavailable");
    return false;
  }
  if (permissionRequest) {
    if (!askPermission || permissionRequest.ask) return permissionRequest.promise;
    await permissionRequest.promise;
    return ensureNotificationPermission(askPermission);
  }
  const request = (async () => {
    const notifications = await import("expo-notifications");
    if (Platform.OS === "android") {
      try {
        await notifications.setNotificationChannelAsync("messages", {
          name: "Mensagens", importance: notifications.AndroidImportance.HIGH,
        });
      } catch {
        // A channel failure in the host runtime must not prevent Android's
        // independent display-permission request (existing channels still work).
        logPermission("channel-unavailable");
      }
    }
    let permission = await notifications.getPermissionsAsync();
    logPermission("checked", { status: permission.status, granted: permission.granted, canAskAgain: permission.canAskAgain });
    if (!permission.granted && askPermission && permission.canAskAgain !== false) {
      logPermission("requesting");
      permission = await notifications.requestPermissionsAsync();
      logPermission("result", { status: permission.status, granted: permission.granted, canAskAgain: permission.canAskAgain });
    }
    return permission.granted;
  })();
  permissionRequest = { ask: askPermission, promise: request };
  try { return await request; }
  catch (error) {
    logPermission("failed", { error: error instanceof Error ? error.message : "permission request failed" });
    throw error;
  }
  finally { if (permissionRequest?.promise === request) permissionRequest = undefined; }
}
let installationPromise: Promise<string> | undefined;
async function deviceId() {
  if (!installationPromise) installationPromise = (async () => {
    let id = await AsyncStorage.getItem(PUSH_DEVICE_KEY);
    if (!id) {
      id = randomUUID();
      await AsyncStorage.setItem(PUSH_DEVICE_KEY, id);
    }
    return id;
  })().catch(error => { installationPromise = undefined; throw error; });
  return installationPromise;
}
const registrations = new Map<number, { ask: boolean; promise: Promise<boolean> }>();
export async function registerMessagePush(askPermission = false): Promise<boolean> {
  const owner = useSessionStore.getState().profile?.id;
  if (!owner) return false;
  const running = registrations.get(owner);
  if (running) {
    if (!askPermission || running.ask) return running.promise;
    await running.promise.catch(() => {});
    if (useSessionStore.getState().profile?.id !== owner) return false;
    return registerMessagePush(true);
  }
  const promise = registerDevice(owner, askPermission);
  registrations.set(owner, { ask: askPermission, promise });
  try { return await promise; }
  finally { if (registrations.get(owner)?.promise === promise) registrations.delete(owner); }
}
async function registerDevice(owner: number, askPermission: boolean) {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  if (Constants.executionEnvironment === "storeClient") {
    if (askPermission) throw new Error("Para receber notificações, instale a versão de teste do Inteliagent. O Expo Go não recebe push neste aplicativo.");
    return false;
  }
  const notifications = await notificationModule();
  if (!notifications || !projectId) {
    if (askPermission)
      throw new Error(
        "As notificações ainda não estão disponíveis nesta versão do aplicativo.",
      );
    return false;
  }
  let granted: boolean;
  try {
    granted = await ensureNotificationPermission(askPermission && useSessionStore.getState().profile?.id === owner);
  } catch {
    throw new Error("Não foi possível consultar a permissão de notificações. Reabra o APK atualizado do Inteliagent.");
  }
  if (!granted) {
    return false;
  }
  let token: string;
  try {
    token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    throw new Error("Não foi possível obter o registro de notificações no Google/Expo. Verifique a internet. O aplicativo tentará novamente automaticamente.");
  }
  try {
    if (!owner || useSessionStore.getState().profile?.id !== owner)
      return false;
    await api.put(SOCKETSERVICEURL + "/push/devices/" + (await deviceId()), {
      kind: "expo",
      token,
      userId: owner,
    });
  } catch {
    throw new Error(
      "Não foi possível registrar as notificações no servidor. Verifique a conexão. O aplicativo tentará novamente automaticamente.",
    );
  }
  return true;
}
export function setMessageNotificationHandler(
  notifications: typeof import("expo-notifications"),
) {
  notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data || {};
      const owner = useSessionStore.getState().profile?.id;
      const show =
        !!owner &&
        Number(data.recipientId) === owner &&
        (AppState.currentState !== "active" ||
        String(data.senderId) !== conversation);
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      };
    },
  });
}
