import { useState } from "react";
import { View } from "react-native";
import { Button, ErrorText, Text } from "@root/components/ui";
import { registerMessagePush } from "@root/service/notifications/messagePush";
export default function MessagePushButton() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [enabled, setEnabled] = useState(false);
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}>
      {enabled ? (
        <Text small muted>
          Notificações de mensagens ativadas.
        </Text>
      ) : (
        <Button
          variant="ghost"
          disabled={busy}
          loading={busy}
          onPress={async () => {
            setBusy(true);
            setError("");
            try {
              setEnabled(await registerMessagePush(true));
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível ativar as notificações.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Ativar notificações de mensagens
        </Button>
      )}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
