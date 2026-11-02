import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { router, useRootNavigationState, usePathname } from "expo-router";
import { useSessionStore } from "@root/context/sessionContext";
import {
  notificationModule,
  registerMessagePush,
  setMessageNotificationHandler,
  nativePushAvailable,
  ensureNotificationPermission,
} from "@root/service/notifications/messagePush";
import { useMessagePushState } from "@root/service/notifications/messagePushState";

export default function MessagePushLifecycle() {
  const owner = useSessionStore((state) => state.profile?.id);
  const navigation = useRootNavigationState();
  const pathname = usePathname();
  const [pending, setPending] = useState<{ owner: number; sender: number; name: string } | null>(null);
  useEffect(() => {
    let active = true;
    let checked = false;
    let checking = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      if (!active || checking || checked || AppState.currentState !== "active") return;
      checking = true;
      try {
        await ensureNotificationPermission(true);
        checked = true;
      } catch {
        if (active) retry = setTimeout(() => { void check(); }, 10000);
      } finally { checking = false; }
    };
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void check();
    });
    void check();
    return () => { active = false; clearTimeout(retry); subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!pending) return;
    if (pending.owner !== owner) { setPending(null); return; }
    // Allow session restoration and the welcome/login redirect to settle first.
    if (!navigation?.key || pathname === "/" || pathname.startsWith("/login")) return;
    setPending(null);
    router.push({
      pathname: "/chat-message",
      params: { idUsuarioMensagem: String(pending.sender), nome: pending.name },
    });
  }, [pending, owner, navigation?.key, pathname]);
  useEffect(() => {
    useMessagePushState.setState({ owner: owner || null, status: "idle", message: "" });
    if (!owner) return;
    let active = true;
    let askOnActivation = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const update = (status: Partial<ReturnType<typeof useMessagePushState.getState>>) => {
      if (active && useSessionStore.getState().profile?.id === owner)
        useMessagePushState.setState(status);
    };
    const register = async (askPermission = false) => {
      if (!active || AppState.currentState !== "active") return;
      clearTimeout(retry);
      update({ status: "registering", message: "" });
      try {
        const ask = askPermission || askOnActivation;
        askOnActivation = false;
        const enabled = await registerMessagePush(ask);
        update({ status: enabled ? "enabled" : "permission", message: "" });
      } catch (error) {
        update({ status: "error", message: error instanceof Error ? error.message : "Não foi possível registrar as notificações." });
        // Transient connection/provider errors must not require a button press.
        if (active && useSessionStore.getState().profile?.id === owner) {
          clearTimeout(retry);
          retry = setTimeout(() => { void register(); }, 30000);
        }
      }
    };
    const subscriptions: { remove(): void }[] = [];
    let lastResponse: string | undefined;
    const open = (
      response: import("expo-notifications").NotificationResponse,
    ) => {
      const data = response.notification.request.content.data || {};
      const sender = Number(data.senderId);
      if (
        !active ||
        useSessionStore.getState().profile?.id !== Number(data.recipientId) ||
        !Number.isSafeInteger(sender) ||
        sender < 1
      )
        return;
      const key = response.notification.request.identifier + "|" + response.actionIdentifier;
      if (lastResponse === key) return;
      lastResponse = key;
      setPending({ owner, sender, name: String(data.senderName || "Conversa") });
    };
    (async () => {
      if (!nativePushAvailable()) {
        update({ status: "unsupported", message: "" });
        return;
      }
      const notifications = await notificationModule();
      if (!active || !notifications) return;
      setMessageNotificationHandler(notifications);
      subscriptions.push(
        notifications.addNotificationResponseReceivedListener(open),
      );
      subscriptions.push(
        notifications.addPushTokenListener(() => {
          void register();
        }),
      );
      const last = notifications.getLastNotificationResponse();
      if (last) {
        open(last);
        notifications.clearLastNotificationResponse();
      }
      await register(true);
    })().catch(() => {
      update({ status: "error", message: "Não foi possível iniciar as notificações. Reabra o APK atualizado do Inteliagent." });
    });
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active" && nativePushAvailable()) void register();
    });
    return () => {
      active = false;
      clearTimeout(retry);
      app.remove();
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [owner]);
  return null;
}
