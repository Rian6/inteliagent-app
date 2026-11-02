import { useCallback, useState } from "react";
import { View, ScrollView, Image, Modal, Pressable } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Text, Button, ErrorText } from "@root/components/ui";
import { ContactAvatar, ChatIcon } from "@root/components/chat/ChatUI";
import { colors as c } from "@root/theme";
import { useSessionStore } from "@root/context/sessionContext";
import {
  loadProfile,
  saveProfilePhoto,
  removeProfilePhoto,
} from "@root/service/usuario/profileService";
export default function Profile() {
  const profile = useSessionStore((state) => state.profile),
    insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [preview, setPreview] = useState(""),
    [remove, setRemove] = useState(false);
  useFocusEffect(
    useCallback(() => {
      loadProfile().catch(() =>
        setError(
          "Não foi possível atualizar seu perfil. Seus dados salvos continuam disponíveis.",
        ),
      );
    }, []),
  );
  async function choose() {
    setError("");
    setSuccess("");
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permita o acesso às fotos para escolher sua imagem.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setBusy(true);
      const image = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.85, format: SaveFormat.JPEG },
      );
      setPreview(image.uri);
    } catch {
      setError("Não foi possível abrir a foto. Escolha outra imagem.");
    } finally {
      setBusy(false);
    }
  }
  async function save(deleting = false) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (deleting) await removeProfilePhoto();
      else await saveProfilePhoto(preview);
      setPreview("");
      setRemove(false);
      setSuccess(deleting ? "Foto removida." : "Foto atualizada.");
    } catch {
      setError(
        "Não foi possível salvar a foto. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  const details = [
    ["Nome", profile?.nome],
    ["Email", profile?.email],
    ["Função", profile?.role === "ADMIN" ? "Administrador" : "Agente"],
    [
      "Sede",
      profile?.codigoSede
        ? [profile.nomeSede, String(profile.codigoSede)]
            .filter(Boolean)
            .join(" · ")
        : "Não disponível",
    ],
    [
      "Situação da conta",
      profile?.situacaoAprovacao === 1 ? "Aprovada" : "Aguardando aprovação",
    ],
  ];
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(24, insets.bottom),
          gap: 20,
        }}
      >
        <ErrorText>{error}</ErrorText>
        {!!error && (
          <Button
            variant="ghost"
            onPress={() => {
              setError("");
              loadProfile().catch(() =>
                setError("Não foi possível atualizar o perfil."),
              );
            }}
          >
            Tentar novamente
          </Button>
        )}
        {!!success && <Text accessibilityLiveRegion="polite">{success}</Text>}
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: 24,
            padding: 20,
            gap: 20,
          }}
        >
          <View
            style={{
              alignItems: "center",
              gap: 16,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: c.outlineVariant,
            }}
          >
            {profile?.fotoUri ? (
              <Image
                accessibilityLabel={"Foto de " + profile.nome}
                source={{ uri: profile.fotoUri }}
                style={{ width: 112, height: 112, borderRadius: 56 }}
              />
            ) : (
              <ContactAvatar name={profile?.nome || ""} size={112} />
            )}
            <Button
              icon="camera-outline"
              disabled={busy}
              loading={busy}
              onPress={choose}
            >
              {profile?.fotoUri ? "Trocar foto" : "Adicionar foto"}
            </Button>
            {!!profile?.fotoUri && (
              <Button
                variant="ghost"
                icon="delete-outline"
                disabled={busy}
                onPress={() => setRemove(true)}
              >
                Remover foto
              </Button>
            )}
          </View>
          {details.map(([label, value]) => (
            <View
              key={label}
              style={{
                gap: 6,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderColor: c.outlineVariant,
              }}
            >
              <Text small muted>
                {label}
              </Text>
              <Text selectable>{value || "Não informado"}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={!!preview || remove}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) {
            setPreview("");
            setRemove(false);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000066",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: c.surface,
              padding: 20,
              borderRadius: 24,
              gap: 16,
            }}
          >
            <Text bold>
              {remove ? "Remover foto do perfil?" : "Atualizar foto"}
            </Text>
            {!!preview && (
              <Image
                accessibilityLabel="Prévia da foto de perfil"
                source={{ uri: preview }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 20 }}
              />
            )}
            {remove && (
              <Text muted>Suas iniciais aparecerão no lugar da foto.</Text>
            )}
            <ErrorText>{error}</ErrorText>
            <Button disabled={busy} loading={busy} onPress={() => save(remove)}>
              {remove ? "Remover" : "Salvar foto"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setPreview("");
                setRemove(false);
              }}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
