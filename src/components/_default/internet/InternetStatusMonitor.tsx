import { Banner } from "react-native-paper";
import { router } from "expo-router";
import { useSyncStore } from "../../../context/syncContext";
export default function InternetStatusMonitor() {
  const { conflicts, rejected, requiresLogin } = useSyncStore();
  const visible = conflicts > 0 || rejected > 0 || requiresLogin;
  if (!visible) return null;
  const message = requiresLogin
    ? "Confirme sua conta para manter os dados atualizados. Seu trabalho está salvo."
    : conflicts
      ? `${conflicts} registros foram alterados pela equipe. Escolha qual versão manter.`
      : `${rejected} registros precisam de uma correção.`;
  return (
    <Banner
      visible={visible}
      icon={requiresLogin ? "account-lock-outline" : "alert-circle-outline"}
      actions={[
        {
          label: requiresLogin ? "Entrar" : "Revisar",
          onPress: () => router.push(requiresLogin ? "/login" : "/sync-status"),
        },
      ]}
    >
      {message}
    </Banner>
  );
}
