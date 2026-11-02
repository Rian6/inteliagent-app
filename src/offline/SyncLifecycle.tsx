import { api } from "../service/default/defaultHTTPService";
import { AUTHSERVICE } from "../constants/urls";
import { useEffect } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSessionStore } from "../context/sessionContext";
import {
  scheduleSync,
  deactivateAccount,
  isActivating,
  updateActiveProfile,
} from "./runtime";
import { offlineSession } from "./sessionStore";
import { getValidToken } from "../service/default/tokenStore";
export default function SyncLifecycle() {
  const profile = useSessionStore((state) => state.profile);
  useEffect(() => {
    if (profile) updateActiveProfile(profile);
  }, [profile]);
  useEffect(() => {
    if (!profile) {
      if (!isActivating()) deactivateAccount();
      return;
    }
    let active = true;
    const refreshPermissions = async () => {
      try {
        const { data } = await api.get(AUTHSERVICE + "/api/user/permissions");
        const current = useSessionStore.getState().profile;
        if (
          !active ||
          !current ||
          current.id !== profile.id ||
          current.idCede !== profile.idCede
        )
          return;
        const next = {
          ...current,
          permissions: {
            createPlanning: !!data.createPlanning,
            editPlanning: !!data.editPlanning,
            addVisits: !!data.addVisits,
            reorderVisits: !!data.reorderVisits,
          },
        };
        await offlineSession.updatePermissions(current, next.permissions);
        const latest = useSessionStore.getState().profile;
        if (
          active &&
          latest?.id === current.id &&
          latest?.idCede === current.idCede
        )
          useSessionStore
            .getState()
            .setProfile({ ...latest, permissions: next.permissions });
      } catch {
        /* Offline access retains the last granted snapshot; upload is checked by the server. */
      }
    };
    refreshPermissions();
    scheduleSync(0);
    const network = NetInfo.addEventListener((state) => {
      if (
        state.isConnected &&
        state.isInternetReachable !== false &&
        AppState.currentState === "active"
      ) {
        scheduleSync(100);
        refreshPermissions();
      }
    });
    const app = AppState.addEventListener("change", (state) => {
      (async () => {
        if (state === "active") {
          if (!(await offlineSession.restore())) {
            try {
              await getValidToken({ force: true });
            } catch {}
            if (!(await offlineSession.restore())) {
              useSessionStore.getState().setProfile(null);
              return;
            }
          }
          {
            scheduleSync(100);
            refreshPermissions();
          }
        }
      })().catch(() => {});
    });
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        scheduleSync(100);
        refreshPermissions();
      }
    }, 60000);
    return () => {
      active = false;
      network();
      app.remove();
      clearInterval(interval);
    };
  }, [profile?.id, profile?.idCede]);
  return null;
}
