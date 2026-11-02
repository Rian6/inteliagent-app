import { useCallback, useState, useRef, type ElementRef } from "react";
import { View, FlatList, Pressable, TextInput, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@root/service/default/defaultHTTPService";
import { SOCKETSERVICEURL } from "@root/constants/urls";
import { useSessionStore } from "@root/context/sessionContext";
import { Text, Heading, Field, Button, ErrorText } from "@root/components/ui";
import { ActivityIndicator } from "react-native";
import { colors as c } from "@root/theme";
import { ChatIcon, ContactAvatar } from "@root/components/chat/ChatUI";
import {
  chatPreview,
  chatTime,
  chatDate,
  chatDay,
} from "@root/data/chat-presentation";
import { selectUpdateBannerVisible, useUpdateStore } from "@root/service/updates/updateStore";
export default function Chat() {
  const search = useRef<ElementRef<typeof TextInput>>(null);
  const bannerVisible = useUpdateStore(selectUpdateBannerVisible);
  const profile = useSessionStore((state) => state.profile);
  const [contacts, setContacts] = useState<
      {
        id: number;
        nome: string;
        photoUrl?: string | null;
        lastMessage?: string;
        lastMessageAt?: string;
        lastAttachmentMime?: string;
      }[]
    >([]),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async (silent = false) => {
    if (!silent) setBusy(true);
    setError("");
    try {
      const { data } = await api.get(SOCKETSERVICEURL + "/users");
      if (useSessionStore.getState().profile?.id === profile?.id)
        setContacts(data.filter((item) => item.id !== profile?.id));
    } catch {
      setError(
        "Não foi possível carregar sua equipe. Verifique a conexão e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }, [profile?.id]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const app = AppState.addEventListener("change", (state) => {
        if (state === "active") void load(true);
      });
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load(true);
      }, 30000);
      return () => { app.remove(); clearInterval(timer); };
    }, [load]),
  );
  const shown = contacts.filter((item) =>
    item.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        query
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
  );
  return (
    <SafeAreaView
      edges={bannerVisible ? ["left", "right"] : ["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.surface }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Heading>Mensagens</Heading>
        <ChatIcon
          icon="message-plus-outline"
          label="Nova conversa"
          onPress={() => search.current?.focus()}
        />
      </View>
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 12,
          backgroundColor: c.background,
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={23}
          color={c.onSurfaceVariant}
        />
        <TextInput
          ref={search}
          accessibilityLabel="Buscar pessoa"
          placeholder="Pesquisar"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            minHeight: 46,
            color: c.onSurface,
            fontFamily: "Inter-Regular",
            fontSize: 15,
          }}
        />
        {!!query && (
          <ChatIcon
            icon="close"
            label="Limpar busca"
            onPress={() => setQuery("")}
          />
        )}
      </View>
      <ErrorText>{error}</ErrorText>
      {!!error && (
        <Button variant="secondary" onPress={() => load()}>
          Tentar novamente
        </Button>
      )}
      <FlatList
        style={{ flex: 1 }}
        data={shown}
        keyExtractor={(item) => String(item.id)}
        refreshing={busy && contacts.length > 0}
        onRefresh={() => load()}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              marginLeft: 84,
              backgroundColor: c.outlineVariant,
            }}
          />
        )}
        ListEmptyComponent={
          busy ? (
            <ActivityIndicator color={c.primary} />
          ) : (
            <Text muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {query
                ? "Nenhuma pessoa encontrada."
                : "Nenhum contato disponível na sua sede."}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Conversar com " + item.nome}
            onPress={() =>
              router.push({
                pathname: "/chat-message",
                params: { idUsuarioMensagem: String(item.id), nome: item.nome },
              })
            }
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 13,
              minHeight: 82,
              backgroundColor: pressed ? c.primaryContainer : c.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            })}
          >
            <ContactAvatar name={item.nome} photoUrl={item.photoUrl} size={52} />
            <View style={{ flex: 1, gap: 5 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text bold numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>
                  {item.nome}
                </Text>
                {!!item.lastMessageAt && (
                  <Text small muted style={{ fontSize: 11 }}>
                    {chatDay(item.lastMessageAt) ===
                    chatDay(new Date().toISOString())
                      ? chatTime(item.lastMessageAt)
                      : chatDate(item.lastMessageAt)}
                  </Text>
                )}
              </View>
              <Text muted numberOfLines={1} style={{ fontSize: 14 }}>
                {chatPreview(item)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
