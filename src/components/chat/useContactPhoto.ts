import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { api } from "@root/service/default/defaultHTTPService";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { useSessionStore } from "@root/context/sessionContext";

export function useContactPhoto(photoUrl?: string | null) {
  const owner = useSessionStore((state) => state.profile?.id);
  const [revision, setRevision] = useState(0);
  const key = `${owner}|${photoUrl || ""}|${revision}`;
  const [photo, setPhoto] = useState<{ key: string; uri: string } | null>(null);
  useEffect(() => {
    if (!owner || !photoUrl) return;
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") setRevision(value => value + 1);
    });
    return () => app.remove();
  }, [owner, photoUrl]);
  useEffect(() => {
    if (!owner || !photoUrl) return;
    const controller = new AbortController();
    let dispose = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const url = new URL(photoUrl, SOCKETSERVICEURL);
      if (url.origin !== new URL(SOCKETSERVICEURL).origin ||
          !/^\/users\/\d+\/photo$/.test(url.pathname)) return;
      // The API client renews expired credentials before retrying the download.
      const response = await api.get(url.href, {
        responseType: "arraybuffer", signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const mime = String(response.headers["content-type"] || "").split(";")[0];
      if (!["image/jpeg", "image/png"].includes(mime)) return;
      let uri: string;
      if (Platform.OS === "web") {
        uri = URL.createObjectURL(new Blob([response.data], { type: mime }));
        dispose = () => URL.revokeObjectURL(uri);
      } else {
        const file = new File(Paths.cache, `contact-${randomUUID()}.${mime === "image/png" ? "png" : "jpg"}`);
        dispose = () => { try { file.delete(); } catch {} };
        file.write(new Uint8Array(response.data));
        uri = file.uri;
      }
      if (controller.signal.aborted) dispose();
      else setPhoto({ key, uri });
    })().catch(() => {
      dispose();
      if (!controller.signal.aborted) retryTimer = setTimeout(() => {
        if (AppState.currentState === "active") setRevision(value => value + 1);
      }, 30000);
    });
    return () => { controller.abort(); clearTimeout(retryTimer); dispose(); };
  }, [key]);
  return photo?.key === key ? photo.uri : null;
}
