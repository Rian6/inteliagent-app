import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  View,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { api } from "@root/service/default/defaultHTTPService";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { useSessionStore } from "@root/context/sessionContext";
import { Button, ErrorText } from "@root/components/ui";
import type { ChatAttachment } from "./ChatMedia";

export default function ChatImage({
  attachment,
}: {
  attachment: ChatAttachment;
}) {
  const account = useSessionStore((state) => state.profile?.id);
  const { width } = useWindowDimensions();
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; uri: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const key = [account, attachment.url, attachment.uri, revision].join("|");
  const uri = attachment.uri || (loaded?.key === key ? loaded.uri : null);
  useEffect(() => {
    setError("");
    setOpen(false);
    if (attachment.uri) return;
    const controller = new AbortController();
    let dispose = () => {};
    let file: File | undefined;
    (async () => {
      const url = new URL(attachment.url || "", SOCKETSERVICEURL);
      if (!attachment.url || url.origin !== new URL(SOCKETSERVICEURL).origin)
        throw new Error("Invalid attachment");
      // Unlike Image's native network loader, this client renews rejected tokens.
      const response = await api.get(url.href, {
        responseType: "arraybuffer",
        signal: controller.signal,
        timeout: 30000,
      });
      if (controller.signal.aborted) return;
      const mime = String(response.headers["content-type"] || "").split(";")[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
        throw new Error("Invalid image response");
      let downloadedUri: string;
      if (Platform.OS === "web") {
        downloadedUri = URL.createObjectURL(
          new Blob([response.data], { type: mime }),
        );
        dispose = () => URL.revokeObjectURL(downloadedUri);
      } else {
        const extension =
          mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
        file = new File(
          Paths.cache,
          "chat-image-" + randomUUID() + "." + extension,
        );
        await file.write(new Uint8Array(response.data));
        downloadedUri = file.uri;
        const cached = file;
        dispose = () => {
          cached.delete().catch(() => {});
        };
      }
      if (controller.signal.aborted) dispose();
      else setLoaded({ key, uri: downloadedUri });
    })().catch(() => {
      if (file) file.delete().catch(() => {});
      if (!controller.signal.aborted)
        setError("Não foi possível carregar a imagem. Tente novamente.");
    });
    return () => {
      controller.abort();
      dispose();
    };
  }, [key]);
  const source = uri ? { uri } : null;
  const thumbnailWidth = Math.max(64, Math.min(220, width * 0.88 - 50));
  return (
    <View style={{ gap: 6, width: thumbnailWidth }}>
      {source && !error ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ampliar imagem da mensagem"
          onPress={() => setOpen(true)}
        >
          <Image
            testID="chat-received-image"
            source={source}
            style={{ width: thumbnailWidth, height: 180, borderRadius: 8 }}
            resizeMode="cover"
            onError={() =>
              setError(
                "Não foi possível abrir esta imagem. Tente carregá-la novamente.",
              )
            }
          />
        </Pressable>
      ) : !error ? (
        <View
          accessibilityLabel="Carregando imagem"
          style={{
            height: 180,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      ) : null}
      <ErrorText>{error}</ErrorText>
      {!!error && (
        <Button
          variant="secondary"
          onPress={() => setRevision((value) => value + 1)}
        >
          Carregar imagem novamente
        </Button>
      )}
      <Modal
        visible={open && !!source && !error}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#111111F5",
            justifyContent: "center",
            padding: 20,
            paddingTop: 60,
          }}
        >
          <Button variant="secondary" onPress={() => setOpen(false)}>
            Fechar imagem
          </Button>
          {source && (
            <Image
              testID="chat-expanded-image"
              source={source}
              style={{ flex: 1, width: "100%" }}
              resizeMode="contain"
              onError={() =>
                setError(
                  "Não foi possível abrir esta imagem. Tente carregá-la novamente.",
                )
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
