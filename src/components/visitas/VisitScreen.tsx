import { useCallback, useState, type ReactNode } from "react";
import {
  View,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Button,
  Text,
  Heading,
  ErrorText,
  FieldErrors,
} from "@root/components/ui";
import FormScreen from "@root/components/_default/screen/FormScreen";
import DraftNotice from "./DraftNotice";
import useVisitaStore from "@root/context/visitaContext";
import {
  visitStages,
  previousVisitPage,
  accessibleVisitPage,
  visitPageErrors,
  type VisitPage,
} from "@root/data/visit-flow";
import { goVisit, closeVisit } from "./visitNavigation";
import { colors as c } from "@root/theme";
import { selectUpdateBannerVisible, useUpdateStore } from "@root/service/updates/updateStore";
export default function VisitScreen({
  page,
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  busy = false,
  error,
  testID,
}: {
  page: VisitPage;
  title: string;
  description?: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  busy?: boolean;
  error?: string;
  testID?: string;
}) {
  const visita = useVisitaStore((state) => state.visita);
  const bannerVisible = useUpdateStore(selectUpdateBannerVisible);
  const [attempted, setAttempted] = useState(false);
  const stages = visitStages(visita.situacaoVisita),
    index = Math.max(
      0,
      stages.findIndex((s) => s.page === page),
    );
  const previous = previousVisitPage(page, visita.situacaoVisita),
    errors = attempted ? visitPageErrors(page, visita) : {};
  const back = useCallback(() => {
    if (busy) return;
    previous ? goVisit(previous) : closeVisit();
  }, [previous, busy]);
  useFocusEffect(
    useCallback(() => {
      const permitted = accessibleVisitPage(
        page,
        useVisitaStore.getState().visita,
      );
      if (permitted !== page) goVisit(permitted, false);
      const listener = Platform.OS === 'web' ? null : BackHandler.addEventListener("hardwareBackPress", () => {
        back();
        return true;
      });
      return () => listener?.remove();
    }, [page, back]),
  );
  function advance() {
    if (busy) return;
    setAttempted(true);
    const current = useVisitaStore.getState();
    if (Object.keys(visitPageErrors(page, current.visita)).length) return;
    const permitted = accessibleVisitPage(page, current.visita);
    if (permitted !== page) {
      goVisit(permitted);
      return;
    }
    current.updateVisita({
      __completed: [...new Set([...(current.visita.__completed || []), page])],
    });
    onPrimary();
  }
  const firstError = Object.values(errors)[0];
  return (
    <SafeAreaView
      edges={bannerVisible ? ["left", "right", "bottom"] : ["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            minHeight: 56,
          }}
        >
          <Button
            variant="ghost"
            icon="arrow-left"
            label={previous ? "Voltar à etapa anterior" : "Voltar às visitas"}
            disabled={busy}
            onPress={back}
            style={{ width: 48, paddingHorizontal: 12 }}
          />
          <Text bold style={{ flex: 1, textAlign: "center" }}>
            Visita
          </Text>
          <Button
            variant="ghost"
            icon="close"
            label="Fechar cadastro"
            disabled={busy}
            onPress={closeVisit}
            style={{ width: 48, paddingHorizontal: 12 }}
          />
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 4,
            gap: 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text small bold style={{ color: c.primary }}>
              ETAPA {index + 1} DE {stages.length}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {stages.map((stage, i) => {
              const completed =
                (visita.__completed || []).includes(stage.page) &&
                !Object.keys(visitPageErrors(stage.page, visita)).length;
              const allowed =
                accessibleVisitPage(stage.page, visita) === stage.page;
              return (
                <Pressable
                  key={stage.page}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}. ${stage.label}${completed ? ", concluída" : i === index ? ", etapa atual" : allowed ? "" : ", bloqueada"}`}
                  accessibilityState={{
                    disabled: !allowed || busy,
                    selected: i === index,
                  }}
                  disabled={!allowed || busy}
                  onPress={() => goVisit(stage.page)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      borderRadius: 6,
                      backgroundColor:
                        i === index
                          ? c.primary
                          : completed
                            ? c.onSurface
                            : c.outlineVariant,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {completed ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={13}
                        color={c.onSurfaceVariant}
                      />
                    ) : null}
                    <Text small muted style={{ fontSize: 11 }}>
                      {i + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <DraftNotice />
        <FieldErrors.Provider value={errors}>
          <FormScreen safeArea={false} avoidKeyboard={false} testID={testID}>
            <View style={{ gap: 6, marginBottom: 4 }}>
              <Heading>{title}</Heading>
              {!!description && (
                <Text muted small>
                  {description}
                </Text>
              )}
            </View>
            {children}
          </FormScreen>
        </FieldErrors.Provider>
        <View
          style={{
            backgroundColor: c.surface,
            borderTopWidth: 1,
            borderColor: c.outlineVariant,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <ErrorText>{error || firstError}</ErrorText>
          <Button
            testID={
              page === "revisao"
                ? "visit-save"
                : `${page === "index" ? "visit-general" : page}-next`
            }
            loading={busy}
            onPress={advance}
            icon={page === "revisao" ? "check" : "arrow-right"}
          >
            {primaryLabel}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
