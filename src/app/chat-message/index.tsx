import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TextInput,
  Pressable,
  Image,
  AppState,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useLocalSearchParams, useNavigation, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text, ErrorText } from "@root/components/ui";
import { colors as c } from "@root/theme";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { getValidToken } from "@root/service/default/tokenStore";
import { api } from "@root/service/default/defaultHTTPService";
import { useSessionStore } from "@root/context/sessionContext";
import ChatMedia, {
  type ChatAttachment,
  audioTime,
} from "@root/components/chat/ChatMedia";
import {
  ChatIcon,
  ContactAvatar,
  ChatWallpaper,
} from "@root/components/chat/ChatUI";
import { chatDate, chatDay, chatTime } from "@root/data/chat-presentation";
import EmojiPicker from "@root/components/chat/EmojiPicker";
import {setNotificationConversation} from "@root/service/notifications/messagePush";
type Message = {
  id: number;
  sender: number;
  text: string;
  timestamp: string;
  recipient?: number;
  attachment?: ChatAttachment;
};
type Pending = ChatAttachment & { uri: string; uploaded?: ChatAttachment };
const merge = (first: Message[], second: Message[]) =>
  [
    ...new Map([...first, ...second].map((item) => [item.id, item])).values(),
  ].sort((a, b) => a.id - b.id);
export default function ChatMessages() {
  const profile = useSessionStore((state) => state.profile),
    insets = useSafeAreaInsets(),
    headerHeight = useHeaderHeight();
  const params = useLocalSearchParams(),
    recipient = String(params.idUsuarioMensagem || ""),
    name = String(params.nome || "Conversa");
  const navigation = useNavigation(),
    socket = useRef<Socket | null>(null),
    input = useRef<ElementRef<typeof TextInput>>(null);
  const [messages, setMessages] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [more, setMore] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null),
    [emojiOpen, setEmojiOpen] = useState(false),
    [keyboardOpen, setKeyboardOpen] = useState(false),
    [preparing, setPreparing] = useState(false),
    [recording, setRecording] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const cancelled = useRef(false),
    duration = useRef(0),
    attempt = useRef<{ id: string; signature: string } | null>(null),
    uploadAbort = useRef<AbortController | null>(null),
    sendLock = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.hasError) {
      setError("A gravação foi interrompida. Tente gravar novamente.");
      setRecording(false);
    }
    if (status.isFinished && status.url && !cancelled.current) {
      setRecording(false);
      setPending({
        uri: status.url,
        kind: "audio",
        mime: Platform.OS === "web" ? "audio/webm" : "audio/mp4",
        name:
          Platform.OS === "web"
            ? "Mensagem de voz.webm"
            : "Mensagem de voz.m4a",
        durationMillis: Math.max(1, Math.min(180000, duration.current)),
      });
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  });
  const recorderState = useAudioRecorderState(recorder, 200);
  duration.current = recorderState.durationMillis;
  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const [contactPhoto, setContactPhoto] = useState<{ recipient: string; url: string | null } | null>(null);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const { data } = await api.get(SOCKETSERVICEURL + "/users", { signal: controller.signal });
        if (!controller.signal.aborted) setContactPhoto({ recipient, url: data.find((user: { id: number }) => String(user.id) === recipient)?.photoUrl || null });
      } catch {}
    };
    void refresh();
    const app = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 30000);
    return () => { controller.abort(); app.remove(); clearInterval(timer); };
  }, [recipient, profile?.id]));
  useFocusEffect(useCallback(()=>{setNotificationConversation(recipient);return ()=>setNotificationConversation(null);},[recipient]));
  useEffect(() => {
    navigation.setOptions({
      title: name,
      headerBackTitle: "Mensagens",
      headerStyle: { backgroundColor: c.surface },
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ContactAvatar name={name} photoUrl={contactPhoto?.recipient === recipient ? contactPhoto.url : null} size={36} />
          <Text bold numberOfLines={1} style={{ maxWidth: 190 }}>
            {name}
          </Text>
        </View>
      ),
      headerRight: () => (
        <ChatIcon
          icon="magnify"
          label="Buscar na conversa"
          onPress={() => setSearchOpen((value) => !value)}
        />
      ),
    });
  }, [navigation, name, recipient, contactPhoto]);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardOpen(true);
        setEmojiOpen(false);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardOpen(false);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    setMessages([]);
    setMore(false);
    setError("");
    setText("");
    setPending(null);
    setEmojiOpen(false);
    attempt.current = null;
    let active = true;
    const connection = io(SOCKETSERVICEURL, {
      auth: async (callback) => {
        try {
          callback({ token: await getValidToken() });
        } catch {
          callback({ token: "" });
        }
      },
    });
    socket.current = connection;
    connection.on("connect", () => {
      if (!active) return;
      setConnected(true);
      setError("");
      connection
        .timeout(10000)
        .emit("load_messages", { recipient }, (timeout, result) => {
          if (active) {
            setMore(!!result?.hasMore);
            if (timeout || !result?.success)
              setError(
                "Não foi possível carregar esta conversa. Tente reconectar.",
              );
          }
        });
    });
    connection.on("disconnect", () => {
      if (active) setConnected(false);
    });
    connection.on("connect_error", () => {
      if (active) {
        setConnected(false);
        setError(
          "Não foi possível conectar. Verifique a conexão ou entre novamente.",
        );
      }
    });
    connection.on("all_messages", (loaded) => {
      if (active) setMessages((previous) => merge(loaded, previous));
    });
    connection.on("receive_message", (message) => {
      if (
        active &&
        (String(message.sender) === recipient ||
          String(message.recipient) === recipient)
      )
        setMessages((previous) => merge(previous, [message]));
    });
    return () => {
      active = false;
      connection.disconnect();
      socket.current = null;
      uploadAbort.current?.abort();
    };
  }, [recipient, profile?.id]);
  useEffect(() => {
    const background = AppState.addEventListener("change", (state) => {
      if (state !== "active" && recorder.isRecording)
        recorder.stop().catch(() => {});
    });
    return () => {
      background.remove();
      cancelled.current = true;
      if (recorder.isRecording)
        recorder
          .stop()
          .finally(() => setAudioModeAsync({ allowsRecording: false }))
          .catch(() => {});
    };
  }, [recorder]);
  function older() {
    if (!socket.current?.connected || !messages.length) return;
    socket.current
      .timeout(10000)
      .emit(
        "load_messages",
        { recipient, before: messages[0].id },
        (timeout, result) => {
          if (timeout || !result?.success)
            setError("Não foi possível carregar o histórico.");
          else setMore(!!result.hasMore);
        },
      );
  }
  async function pickImage() {
    if (busy || recording || preparing) return;
    setPreparing(true);
    setError("");
    setEmojiOpen(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0],
        width = Math.min(asset.width || 1600, 1600);
      const image = await manipulateAsync(asset.uri, [{ resize: { width } }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      setPending({
        kind: "image",
        uri: image.uri,
        mime: "image/jpeg",
        name: "Imagem.jpg",
      });
    } catch {
      setError("Não foi possível abrir a imagem. Tente novamente.");
    } finally {
      setPreparing(false);
    }
  }
  async function startAudio() {
    if (busy || pending || preparing) return;
    setPreparing(true);
    setError("");
    setEmojiOpen(false);
    Keyboard.dismiss();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError(
          "Permita o acesso ao microfone nas configurações do celular para gravar áudio.",
        );
        return;
      }
      cancelled.current = false;
      duration.current = 0;
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 180 });
      setRecording(true);
    } catch {
      setError("Não foi possível iniciar a gravação. Verifique o microfone.");
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    } finally {
      setPreparing(false);
    }
  }
  async function stopAudio(cancel = false) {
    cancelled.current = cancel;
    setPreparing(true);
    try {
      await recorder.stop();
      setRecording(false);
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      setRecording(false);
      setError("Não foi possível concluir a gravação. Tente novamente.");
    } finally {
      setPreparing(false);
    }
  }
  async function send() {
    if (
      sendLock.current ||
      recording ||
      preparing ||
      (!text.trim() && !pending)
    )
      return;
    if (!socket.current?.connected) {
      setError("Aguarde a conexão. Sua mensagem permanece aqui.");
      return;
    }
    sendLock.current = true;
    setBusy(true);
    setError("");
    try {
      let attachment = pending?.uploaded;
      if (pending && !attachment) {
        if (
          new File(pending.uri).size >
          (pending.kind === "image" ? 8 : 12) * 1024 * 1024
        )
          throw new Error(
            "Arquivo muito grande. Use uma imagem de até 8 MB ou um áudio de até 12 MB.",
          );
        const form = new FormData();
        form.append("recipient", recipient);
        if (pending.durationMillis)
          form.append("durationMillis", String(pending.durationMillis));
        form.append("file", {
          uri: pending.uri,
          name: pending.name,
          type: pending.mime,
        } as any);
        const abort = new AbortController();
        uploadAbort.current = abort;
        const timeout = setTimeout(() => abort.abort(), 30000);
        try {
          // Expo's fetch cannot serialize React Native's { uri, name, type }
          // file parts. XHR reads the local file and supplies the multipart boundary.
          const { data } = await api.post(
            SOCKETSERVICEURL + "/attachments",
            form,
            {
              adapter: "xhr",
              timeout: 30000,
              signal: abort.signal,
            },
          );
          attachment = data;
          setPending((previous) =>
            previous ? { ...previous, uploaded: data } : previous,
          );
        } finally {
          clearTimeout(timeout);
          uploadAbort.current = null;
        }
      }
      const signature = JSON.stringify([text.trim(), attachment?.id || ""]);
      if (attempt.current?.signature !== signature)
        attempt.current = { id: Crypto.randomUUID(), signature };
      const result = await new Promise<any>((resolve, reject) =>
        socket.current!.timeout(15000).emit(
          "send_message",
          {
            recipient,
            text: text.trim(),
            attachmentId: attachment?.id,
            clientId: attempt.current!.id,
          },
          (timeout, result) =>
            timeout
              ? reject(
                  new Error("O envio não foi confirmado. Tente novamente."),
                )
              : resolve(result),
        ),
      );
      if (!result?.success)
        throw new Error(result?.error || "Não foi possível enviar.");
      setText("");
      setSelection({ start: 0, end: 0 });
      setPending(null);
      setEmojiOpen(false);
      attempt.current = null;
    } catch (cause) {
      setError(
        ((cause as any)?.response?.data?.error ||
          (cause instanceof Error
            ? cause.message
            : "Não foi possível enviar.")) +
          " Sua mensagem foi mantida para tentar novamente.",
      );
    } finally {
      sendLock.current = false;
      setBusy(false);
    }
  }
  function emoji(value: string) {
    const next =
      text.slice(0, selection.start) + value + text.slice(selection.end);
    if (next.length > 4000) return;
    setText(next);
    setSelection({
      start: selection.start + value.length,
      end: selection.start + value.length,
    });
  }
  return (
    <SafeAreaView
      edges={keyboardOpen ? ["left", "right"] : ["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: "#EEF2F6" }}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, minHeight: 0 }}
          // Keep the composer above the IME without manual screen measurements.
          behavior={Platform.OS === "web" ? undefined : "padding"}
          keyboardVerticalOffset={headerHeight}
        >
          <ChatWallpaper />
          {searchOpen && (
            <View
              style={{
                backgroundColor: c.surface,
                padding: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TextInput
                accessibilityLabel="Buscar na conversa"
                placeholder="Buscar na conversa"
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, padding: 12, color: c.onSurface }}
              />
              <ChatIcon
                icon="close"
                label="Fechar busca"
                onPress={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
              />
            </View>
          )}
          {(!connected || !!error) && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                backgroundColor: c.surface,
              }}
            >
              {!connected && (
                <Text small muted>
                  Conectando…
                </Text>
              )}
              <ErrorText>{error}</ErrorText>
            </View>
          )}
          <FlatList
            style={{ flex: 1, minHeight: 0 }}
            inverted
            data={
              query.trim()
                ? reversed.filter((item) =>
                    item.text
                      .toLocaleLowerCase()
                      .includes(query.trim().toLocaleLowerCase()),
                  )
                : reversed
            }
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
            ListFooterComponent={
              more ? (
                <Button variant="ghost" onPress={older}>
                  Carregar mensagens anteriores
                </Button>
              ) : undefined
            }
            ListEmptyComponent={
              <Text
                muted
                style={{ textAlign: "center", transform: [{ scaleY: -1 }] }}
              >
                Envie uma mensagem para começar a conversa.
              </Text>
            }
            renderItem={({ item, index }) => {
              const own = item.sender === profile?.id;
              const previous =
                reversed[
                  reversed.findIndex((message) => message.id === item.id) + 1
                ];
              const dayStart =
                !previous ||
                chatDay(previous.timestamp) !== chatDay(item.timestamp);
              return (
                <View style={{ gap: 10 }}>
                  {dayStart && (
                    <View
                      style={{
                        alignSelf: "center",
                        backgroundColor: "#FFFFFFED",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                      }}
                    >
                      <Text small muted>
                        {chatDate(item.timestamp)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      alignSelf: own ? "flex-end" : "flex-start",
                      maxWidth: "88%",
                      padding: 9,
                      borderRadius: 9,
                      borderTopRightRadius: own ? 0 : 9,
                      borderTopLeftRadius: own ? 9 : 0,
                      backgroundColor: own ? c.primaryContainer : c.surface,
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        [own ? "right" : "left"]: -6,
                        width: 0,
                        height: 0,
                        borderTopWidth: 8,
                        borderTopColor: own ? c.primaryContainer : c.surface,
                        borderLeftWidth: own ? 0 : 7,
                        borderRightWidth: own ? 7 : 0,
                        borderLeftColor: "transparent",
                        borderRightColor: "transparent",
                      }}
                    />
                    {item.attachment && (
                      <ChatMedia attachment={item.attachment} />
                    )}
                    {!!item.text && (
                      <Text style={{ fontSize: 15, lineHeight: 21 }}>
                        {item.text}
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 4,
                      }}
                    >
                      <Text small muted style={{ fontSize: 11 }}>
                        {chatTime(item.timestamp)}
                      </Text>
                      {own && (
                        <MaterialCommunityIcons
                          name="check"
                          size={15}
                          color={c.onSurfaceVariant}
                          accessibilityLabel="Mensagem enviada"
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
          <View
            testID="chat-composer"
            style={{
              flexShrink: 0,
              backgroundColor: "#EEF2F6",
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 6,
              gap: 8,
            }}
          >
            {pending && (
              <View
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: c.background,
                  gap: 8,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {pending.kind === "image" && (
                    <Image
                      source={{ uri: pending.uri }}
                      style={{ width: 56, height: 56, borderRadius: 8 }}
                    />
                  )}
                  <Text small style={{ flex: 1 }}>
                    {pending.kind === "image"
                      ? "Imagem pronta para enviar"
                      : "Áudio pronto para enviar"}
                  </Text>
                  <ChatIcon
                    icon="close"
                    label="Remover anexo"
                    disabled={busy}
                    onPress={() => setPending(null)}
                  />
                </View>
                {pending.kind === "audio" && <ChatMedia attachment={pending} />}
              </View>
            )}
            {recording ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 52,
                }}
              >
                <ChatIcon
                  icon="delete-outline"
                  label="Cancelar"
                  disabled={preparing}
                  onPress={() => stopAudio(true)}
                />
                <MaterialCommunityIcons
                  name="record-circle"
                  size={18}
                  color={c.error}
                />
                <Text style={{ flex: 1, color: c.error }}>
                  Gravando · {audioTime(recorderState.durationMillis / 1000)} /
                  3:00
                </Text>
                <ChatIcon
                  icon="stop"
                  label="Concluir gravação"
                  filled
                  disabled={preparing}
                  onPress={() => stopAudio()}
                />
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "flex-end",
                      backgroundColor: c.surface,
                      borderRadius: 26,
                      paddingHorizontal: 2,
                    }}
                  >
                    <ChatIcon
                      icon={emojiOpen ? "keyboard-outline" : "emoticon-outline"}
                      label="Escolher emoji"
                      disabled={busy || preparing}
                      onPress={() => {
                        if (emojiOpen) {
                          setEmojiOpen(false);
                          input.current?.focus();
                        } else {
                          Keyboard.dismiss();
                          setEmojiOpen(true);
                        }
                      }}
                    />
                    <TextInput
                      ref={input}
                      testID="chat-message-input"
                      accessibilityLabel="Sua mensagem"
                      placeholder="Mensagem"
                      multiline
                      maxLength={4000}
                      value={text}
                      onChangeText={setText}
                      onSelectionChange={(event) =>
                        setSelection(event.nativeEvent.selection)
                      }
                      onFocus={() => setEmojiOpen(false)}
                      editable={!busy}
                      style={{
                        flex: 1,
                        minHeight: 46,
                        maxHeight: 120,
                        paddingHorizontal: 2,
                        paddingVertical: 12,
                        fontFamily: "Inter-Regular",
                        fontSize: 16,
                        color: c.onSurface,
                      }}
                    />
                    <ChatIcon
                      icon="paperclip"
                      label="Adicionar anexo"
                      disabled={busy || preparing}
                      onPress={() => {
                        Keyboard.dismiss();
                        setAttachmentsOpen(true);
                      }}
                    />
                  </View>
                  {text.trim() || pending ? (
                    <ChatIcon
                      icon="send"
                      label="Enviar mensagem"
                      testID="chat-send"
                      filled
                      disabled={busy || preparing || !connected}
                      loading={busy}
                      onPress={send}
                    />
                  ) : (
                    <ChatIcon
                      icon="microphone"
                      label="Gravar áudio"
                      filled
                      disabled={busy || preparing}
                      loading={preparing}
                      onPress={startAudio}
                    />
                  )}
                </View>
                {emojiOpen && (
                  <EmojiPicker onSelect={emoji} disabled={busy || preparing} />
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
      <Modal
        visible={attachmentsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachmentsOpen(false)}
      >
        <Pressable
          accessibilityLabel="Fechar anexos"
          style={{
            flex: 1,
            backgroundColor: "#00000055",
            justifyContent: "flex-end",
          }}
          onPress={() => setAttachmentsOpen(false)}
        >
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(24, insets.bottom),
              gap: 8,
            }}
          >
            <Text bold style={{ marginBottom: 8 }}>
              Adicionar à conversa
            </Text>
            <Button
              variant="ghost"
              icon="image-outline"
              onPress={() => {
                setAttachmentsOpen(false);
                pickImage();
              }}
            >
              Adicionar imagem
            </Button>
            <Button
              variant="ghost"
              icon="microphone-outline"
              onPress={() => {
                setAttachmentsOpen(false);
                startAudio();
              }}
            >
              Gravar áudio
            </Button>
            <Button variant="ghost" onPress={() => setAttachmentsOpen(false)}>
              Cancelar
            </Button>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
