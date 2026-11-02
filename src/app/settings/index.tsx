import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Heading, Text, Toggle } from "@root/components/ui";
import { colors } from "@root/theme";
import { useThemeStore } from "@root/service/theme/themeStore";
import {
  checkForAppUpdate,
  installedRelease,
} from "@root/service/updates/checkAppUpdate";
import { useUpdateStore } from "@root/service/updates/updateStore";

type ManualCheck = "idle" | "checking" | "upToDate" | "available" | "error";

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 20,
        gap: 12,
        width: "100%",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceVariant,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={icon} size={24} color={colors.onSurface} />
        </View>
        <Text bold style={{ flex: 1, fontSize: 17 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function Settings() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const installed = installedRelease();
  const storeRelease = useUpdateStore((state) => state.release);
  const storeSeverity = useUpdateStore((state) => state.severity);
  const [manual, setManual] = useState<ManualCheck>("idle");
  const [openError, setOpenError] = useState("");

  const availableRelease =
    manual === "idle" || manual === "available"
      ? storeRelease && storeSeverity !== "none"
        ? storeRelease
        : null
      : null;

  const checkUpdate = async () => {
    setManual("checking");
    setOpenError("");
    const ok = await checkForAppUpdate(true);
    if (!ok) {
      setManual("error");
      return;
    }
    const { release, severity } = useUpdateStore.getState();
    setManual(release && severity !== "none" ? "available" : "upToDate");
  };

  const openDownload = (url?: string) => {
    if (!url) return;
    setOpenError("");
    Linking.openURL(url).catch(() =>
      setOpenError("Não foi possível abrir o download. Tente novamente."),
    );
  };

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          gap: 16,
          width: "100%",
          maxWidth: 840,
          alignSelf: "center",
        }}
      >
        <SectionCard icon="weather-night" title="Aparência">
          <Toggle
            label="Modo escuro"
            value={mode === "dark"}
            onChange={(value) => {
              void setMode(value ? "dark" : "light");
            }}
            testID="settings-dark-mode"
          />
          <Text small muted>
            Alterna entre o tema claro e o tema escuro em todo o aplicativo.
          </Text>
        </SectionCard>

        <SectionCard icon="cloud-download-outline" title="Atualização do aplicativo">
          <Text small muted>
            Versão instalada: {installed.version} (build {installed.code})
          </Text>
          <Button
            icon="refresh"
            loading={manual === "checking"}
            disabled={manual === "checking"}
            onPress={() => {
              void checkUpdate();
            }}
            testID="settings-check-update"
          >
            Procurar atualização
          </Button>
          {manual === "checking" ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              accessibilityLiveRegion="polite"
            >
              <ActivityIndicator color={colors.onSurfaceVariant} />
              <Text small muted>
                Procurando atualização…
              </Text>
            </View>
          ) : null}
          {manual === "upToDate" ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              accessibilityLiveRegion="polite"
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.blue}
              />
              <Text small style={{ color: colors.onSurface }}>
                Você está na versão mais recente.
              </Text>
            </View>
          ) : null}
          {manual === "error" ? (
            <Text small style={{ color: colors.error }} accessibilityLiveRegion="polite">
              Não foi possível verificar agora. Verifique a conexão e tente de novo.
            </Text>
          ) : null}
          {availableRelease ? (
            <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
              <Text small bold>
                Versão {availableRelease.version} (build {availableRelease.versionCode})
                disponível.
              </Text>
              <Button
                icon="download"
                variant="secondary"
                onPress={() => openDownload(availableRelease.downloadUrl)}
                testID="settings-download-update"
              >
                Atualizar agora
              </Button>
              {openError ? (
                <Text small style={{ color: colors.error }}>
                  {openError}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Text small muted>
            A verificação automática continua ativa: o aplicativo procura
            atualizações ao abrir, no login e a cada minuto, mesmo sem usar este
            botão.
          </Text>
        </SectionCard>

        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Heading style={{ fontSize: 15, lineHeight: 22 }}>Inteliagent</Heading>
          <Text small muted>
            v{installed.version} · build {installed.code}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
