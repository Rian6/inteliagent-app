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
export async function registerMessagePush(askPermission = false) {
  const owner = useSessionStore.getState().profile?.id;
  if (!owner) return false;
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
  if (Platform.OS === "android")
    await notifications.setNotificationChannelAsync("messages", {
      name: "Mensagens",
      importance: notifications.AndroidImportance.HIGH,
    });
  let permission = await notifications.getPermissionsAsync();
  if (!permission.granted && askPermission)
    permission = await notifications.requestPermissionsAsync();
  if (!permission.granted) {
    if (askPermission)
      throw new Error("Permita as notificações nas configurações do celular.");
    return false;
  }
  try {
    const token = (await notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    if (!owner || useSessionStore.getState().profile?.id !== owner)
      return false;
    await api.put(SOCKETSERVICEURL + "/push/devices/" + (await deviceId()), {
      kind: "expo",
      token,
      userId: owner,
    });
  } catch {
    throw new Error(
      "Não foi possível ativar as notificações. Verifique a conexão e a versão do aplicativo.",
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
