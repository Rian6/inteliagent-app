import { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  Text,
  Heading,
  Button,
  Field,
  Choice,
  ErrorText,
} from "@root/components/ui";
import { database } from "@root/offline/database";
import { scheduleSync } from "@root/offline/runtime";
import { useSyncStore } from "@root/context/syncContext";
import { getVisitOverview, type VisitFilter } from "@root/db/visitOverview";
import { getPlanejamentoById } from "@root/db/atendimentoPersistence";
import VisitaList from "@root/components/visitas/VisitaList";
import InternetStatusMonitor from "@root/components/_default/internet/InternetStatusMonitor";
import { colors as c } from "@root/theme";
import { useSessionStore } from "@root/context/sessionContext";
const pageSize = 100;
export default function Visits() {
  const params = useLocalSearchParams(),
    planId = String(params.idPlanejamento || params.id || "");
  const canAdd = !!useSessionStore(
    (state) => state.profile?.permissions?.addVisits,
  );
  const lastSync = useSyncStore((state) => state.lastSync);
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (!params.savedAt) return;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [params.savedAt]);
  const [data, setData] = useState<Record<string, any>[]>([]),
    [plan, setPlan] = useState<Record<string, any> | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<VisitFilter>("all"),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [limit, setLimit] = useState(pageSize);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [rows, details] = await Promise.all([
        getVisitOverview(database, planId, query, limit, filter),
        getPlanejamentoById(planId),
      ]);
      setPlan(details);
      setData(
        rows.map((row) => ({
          id: row.ID,
          nome: row.NOME
            ? `${row.NOME}, ${row.NUMERO || "s/n"}`
            : "Nova visita",
          status: row.STATUS,
          inProgress: !!row.IN_PROGRESS,
          sequencia: row.SEQUENCIA,
        })),
      );
      setError("");
    } catch {
      setError("Não foi possível abrir as visitas. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }, [planId, query, limit, filter]);
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 180);
      return () => clearTimeout(timer);
    }, [load, lastSync]),
  );
  if (!planId)
    return (
      <View style={{ padding: 24 }}>
        <Text>Selecione um planejamento para ver as visitas.</Text>
        <Button onPress={() => router.back()}>Voltar</Button>
      </View>
    );
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: c.surface,
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text bold style={{ flex: 1, fontSize: 18, lineHeight: 25 }}>
          {plan?.nome || "Visitas da localidade"}
        </Text>
        <Button
          variant="ghost"
          icon="map-marker-path"
          label="Ver ordem da rota"
          onPress={() =>
            router.push({
              pathname: "/atendimento/rotaVisita",
              params: { idPlanejamento: planId },
            })
          }
          style={{ paddingHorizontal: 8 }}
        >
          Rota
        </Button>
      </View>
      <Button
        variant="secondary"
        icon="file-pdf-box"
        onPress={() =>
          router.push({
            pathname: "/atendimento/boletim",
            params: { idPlanejamento: planId },
          })
        }
      >
        Gerar boletim PDF
      </Button>
      <InternetStatusMonitor />
      <Field
        label="Buscar visitas"
        placeholder="Endereço ou número"
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setLimit(pageSize);
        }}
      />
      <Choice
        label="Filtrar visitas"
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setLimit(pageSize);
        }}
        options={[
          { label: "Todas", value: "all" },
          { label: "Em curso", value: "draft" },
          { label: "Realizadas", value: "completed" },
        ]}
      />
      <ErrorText>{error}</ErrorText>
      {busy && !data.length && <ActivityIndicator color={c.primary} />}
      <VisitaList
        data={data}
        planId={planId}
        refreshing={busy && data.length > 0}
        onRefresh={() => {
          scheduleSync(0);
          load();
        }}
        emptyMessage={
          busy
            ? ""
            : query
              ? "Nenhum endereço encontrado."
              : filter === "draft"
                ? "Nenhum cadastro em andamento."
                : filter === "completed"
                  ? "Nenhuma visita realizada."
                  : "Nenhuma visita por aqui ainda."
        }
        onEndReached={() => {
          if (!busy && data.length === limit)
            setLimit((value) => value + pageSize);
        }}
      />
      {showSaved && (
        <View
          accessibilityRole="alert"
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: c.primaryContainer,
          }}
        >
          <Text small style={{ color: c.primary }}>
            {String(params.savedMessage || "Visita salva com sucesso.")}
          </Text>
        </View>
      )}
      {canAdd && (
        <View style={{ paddingBottom: 8 }}>
          <Button
            testID="visit-create"
            icon="plus"
            onPress={() =>
              router.push({
                pathname: "/atendimento/registroServico",
                params: {
                  idVisita: Crypto.randomUUID(),
                  idPlanejamento: planId,
                },
              })
            }
          >
            Nova visita
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
