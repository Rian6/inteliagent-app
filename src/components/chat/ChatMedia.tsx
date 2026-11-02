import { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { Button, Text, ErrorText } from "@root/components/ui";
import { getValidToken } from "@root/service/default/tokenStore";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { ChatIcon } from "./ChatUI";
import { colors as c } from "@root/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ChatImage from "./ChatImage";
export type ChatAttachment = {
  id?: string;
  kind: "image" | "audio";
  mime: string;
  name: string;
  url?: string;
  uri?: string;
  durationMillis?: number;
  size?: number;
};
export const audioTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
function AudioMessage({
  source,
  duration,
}: {
  source: any;
  duration?: number;
}) {
  const player = useAudioPlayer(source),
    state = useAudioPlayerStatus(player);
  const [error, setError] = useState("");
  const [trackWidth, setTrackWidth] = useState(1);
  async function toggle() {
    try {
      setError("");
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (state.playing) player.pause();
      else {
        if (
          state.didJustFinish ||
          (state.duration > 0 && state.currentTime >= state.duration)
        )
          await player.seekTo(0);
        player.play();
      }
    } catch {
      setError("Não foi possível reproduzir este áudio. Tente novamente.");
    }
  }
  return (
    <View style={{ minWidth: 205, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ChatIcon
          icon={state.playing ? "pause" : "play"}
          label={state.playing ? "Pausar áudio" : "Reproduzir áudio"}
          disabled={!source}
          onPress={toggle}
        />
        <View style={{ flex: 1, gap: 7 }}>
          <Pressable
            accessibilityRole="adjustable"
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            accessibilityActions={[
              { name: "increment" },
              { name: "decrement" },
            ]}
            onAccessibilityAction={(event) => {
              const total = state.duration || Number(duration || 0) / 1000;
              const delta =
                event.nativeEvent.actionName === "increment" ? 10 : -10;
              player
                .seekTo(
                  Math.max(
                    0,
                    Math.min(total, (state.currentTime || 0) + delta),
                  ),
                )
                .catch(() => setError("Não foi possível avançar o áudio."));
            }}
            accessibilityLabel="Posição do áudio"
            accessibilityValue={{
              min: 0,
              max: Math.round(state.duration || Number(duration || 0) / 1000),
              now: Math.round(state.currentTime || 0),
            }}
            onPress={(event) => {
              const position = event.nativeEvent.locationX;
              player
                .seekTo(
                  Math.max(0, Math.min(1, position / trackWidth)) *
                    (state.duration || Number(duration || 0) / 1000),
                )
                .catch(() =>
                  setError(
                    "Falha ao alterar a posi\u00e7\u00e3o do \u00e1udio.",
                  ),
                );
            }}
            style={{ height: 24, justifyContent: "center" }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 3,
                backgroundColor: c.outlineVariant,
              }}
            >
              <View
                style={{
                  height: 3,
                  borderRadius: 3,
                  backgroundColor: c.onSurfaceVariant,
                  width: `${Math.min(100, (100 * (state.currentTime || 0)) / (state.duration || Number(duration || 0) / 1000 || 1))}%`,
                }}
              />
            </View>
          </Pressable>
          <Text small muted style={{ fontSize: 11 }}>
            {audioTime(state.currentTime || 0)} /{" "}
            {audioTime(state.duration || Number(duration || 0) / 1000)}
          </Text>
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="microphone"
            size={22}
            color={c.onSurfaceVariant}
          />
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
export default function ChatMedia({
  attachment,
}: {
  attachment: ChatAttachment;
}) {
  const [token, setToken] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!attachment.uri && attachment.kind === "audio")
      getValidToken()
        .then((value) => {
          if (active) setToken(value || "");
        })
        .catch(() => {
          if (active) setError("Entre novamente para carregar o anexo.");
        });
    return () => {
      active = false;
    };
  }, [attachment.id, attachment.uri, attachment.kind]);
  const source = attachment.uri
    ? { uri: attachment.uri }
    : token
      ? {
          uri: SOCKETSERVICEURL + attachment.url,
          headers: { Authorization: "Bearer " + token },
        }
      : null;
  if (attachment.kind === "audio")
    return (
      <AudioMessage source={source} duration={attachment.durationMillis} />
    );
  return <ChatImage attachment={attachment} />;
}
