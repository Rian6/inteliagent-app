import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { api } from "../default/defaultHTTPService";
import { AUTHSERVICE } from "@root/constants/urls";
import { useSessionStore } from "@root/context/sessionContext";
import { offlineSession } from "@root/offline/sessionStore";
let revision = 0;
export async function applyProfile(data: any, expectedRevision = revision) {
  const current = useSessionStore.getState().profile;
  if (
    expectedRevision !== revision ||
    !current ||
    current.id !== data.id ||
    current.idCede !== data.idCede
  )
    return;
  const { foto, ...fields } = data;
  let fotoUri: string | null = null;
  if (foto) {
    if (Platform.OS === "web") fotoUri = foto;
    else {
      const file = new File(
        Paths.document,
        `profile-${data.id}-${Date.now()}.jpg`,
      );
      await file.write(foto.split(",")[1], { encoding: "base64" });
      fotoUri = file.uri;
    }
  }
  if (
    expectedRevision !== revision ||
    useSessionStore.getState().profile?.id !== current.id
  )
    return;
  // Only the small file URI is stored in the encrypted session, never image bytes.
  await offlineSession.updateProfile(current, { ...fields, fotoUri });
  const latest = useSessionStore.getState().profile;
  if (expectedRevision !== revision || latest?.id !== current.id) return;
  const updated = { ...latest, ...fields, fotoUri };
  useSessionStore.getState().setProfile(updated);
  if (
    current.fotoUri &&
    current.fotoUri !== fotoUri &&
    current.fotoUri.startsWith(Paths.document.uri + "profile-")
  ) {
    try {
      await new File(current.fotoUri).delete();
    } catch {}
  }
  return updated;
}
export async function loadProfile() {
  const requestRevision = ++revision;
  const { data } = await api.get(AUTHSERVICE + "/api/user/me");
  return applyProfile(data, requestRevision);
}
export async function saveProfilePhoto(uri: string) {
  const requestRevision = ++revision;
  const form = new FormData();
  form.append("file", { uri, type: "image/jpeg", name: "perfil.jpg" } as any);
  const { data } = await api.put(AUTHSERVICE + "/api/user/me/photo", form, { adapter: "xhr" });
  return applyProfile(data, requestRevision);
}
export async function removeProfilePhoto() {
  const requestRevision = ++revision;
  const { data } = await api.delete(AUTHSERVICE + "/api/user/me/photo");
  return applyProfile(data, requestRevision);
}
