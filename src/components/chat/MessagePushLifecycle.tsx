import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { router, useRootNavigationState, usePathname } from "expo-router";
import { useSessionStore } from "@root/context/sessionContext";
import {
  notificationModule,
  registerMessagePush,
  setMessageNotificationHandler,
} from "@root/service/notifications/messagePush";

export default function MessagePushLifecycle() {
  const owner = useSessionStore((state) => state.profile?.id);
  const navigation = useRootNavigationState();
  const pathname = usePathname();
  const [pending, setPending] = useState<{ owner: number; sender: number; name: string } | null>(null);
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
    if (!owner) return;
    let active = true;
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
      const notifications = await notificationModule();
      if (!active || !notifications) return;
      setMessageNotificationHandler(notifications);
      subscriptions.push(
        notifications.addNotificationResponseReceivedListener(open),
      );
      subscriptions.push(
        notifications.addPushTokenListener(() => {
          registerMessagePush().catch(() => {});
        }),
      );
      const last = notifications.getLastNotificationResponse();
      if (last) {
        open(last);
        notifications.clearLastNotificationResponse();
      }
      await registerMessagePush();
    })().catch(() => {});
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") registerMessagePush().catch(() => {});
    });
    return () => {
      active = false;
      app.remove();
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [owner]);
  return null;
}
