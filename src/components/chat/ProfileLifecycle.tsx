import { useEffect } from "react";
import { AppState } from "react-native";
import { loadProfile } from "@root/service/usuario/profileService";
import { useSessionStore } from "@root/context/sessionContext";

export default function ProfileLifecycle() {
  const owner = useSessionStore((state) => state.profile?.id);
  useEffect(() => {
    if (!owner) return;
    const refresh = () => { void loadProfile().catch(() => {}); };
    refresh();
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, 30000);
    return () => { app.remove(); clearInterval(timer); };
  }, [owner]);
  return null;
}
