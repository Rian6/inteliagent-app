import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useGlobalSearchParams, usePathname, router } from "expo-router";
import * as Crypto from "expo-crypto";
import { currentEngine } from "@root/offline/runtime";
import { Visits, newVisit } from "@root/offline/visits.ts";
import useVisitaStore from "@root/context/visitaContext";
import { resumedPage } from "@root/data/visit-flow";
import { goVisit } from "@root/components/visitas/visitNavigation";
import { Text, Button } from "@root/components/ui";
import { colors } from "@root/theme";
export default function VisitLayout() {
  const params = useGlobalSearchParams(),
    pathname = usePathname();
  const [id] = useState(() => String(params.idVisita || Crypto.randomUUID()));
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const resume = useRef<ReturnType<typeof resumedPage>>("index");
  const initialIndex = useRef(pathname.endsWith("/registroServico"));
  useEffect(() => {
    let active = true;
    new Visits(currentEngine())
      .load(id)
      .then((saved) => {
        if (!active) return;
        if (!saved && !currentEngine().user.permissions?.addVisits) throw new Error("Você não tem permissão para adicionar visitas a planejamentos.");
        const visit =
          saved ||
          newVisit({
            id,
            idPlanejamento: String(params.idPlanejamento || params.id || ""),
          });
        if (!visit.idPlanejamento)
          throw new Error("Selecione um planejamento para registrar a visita.");
        useVisitaStore.getState().initializeVisita(visit);
        resume.current = initialIndex.current ? resumedPage(visit) : "index";
        setReady(true);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Não foi possível abrir esta visita. Volte à lista e tente novamente.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (ready && resume.current !== "index") {
      const target = resume.current;
      resume.current = "index";
      goVisit(target, false);
    }
  }, [ready]);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          gap: 16,
          backgroundColor: colors.surface,
        }}
      >
        {error ? (
          <>
            <Text>{error}</Text>
            <Button onPress={() => router.back()}>Voltar às visitas</Button>
          </>
        ) : (
          <ActivityIndicator
            color={colors.primary}
            accessibilityLabel="Abrindo visita"
          />
        )}
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="inspecao" />
      <Stack.Screen name="amostra" />
      <Stack.Screen name="tratamento" />
      <Stack.Screen name="revisao" />
    </Stack>
  );
}
