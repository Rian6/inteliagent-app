import { colors } from "@root/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { View, FlatList, ScrollView } from "react-native";
import {
  FAB,
  Searchbar,
  Text,
  HelperText,
  IconButton,
  Card,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSessionStore } from "@root/context/sessionContext";
import { useSyncStore } from "@root/context/syncContext";
import { getPlanejamentos } from "@root/db/atendimentoPersistence";
import { scheduleSync } from "@root/offline/runtime";
import InternetStatusMonitor from "@root/components/_default/internet/InternetStatusMonitor";
const statuses: Record<number, string> = {
  1: "Concluído",
  2: "Pendente",
  3: "Em andamento",
};
export default function Planning() {
  const profile = useSessionStore((state) => state.profile);
  const admin = !!profile?.permissions?.editPlanning;
  const canCreate = !!profile?.permissions?.createPlanning;
  const lastSync = useSyncStore((state) => state.lastSync);
  const phase = useSyncStore((state) => state.phase);
  const awaitingFirstLoad =
    !lastSync && (phase === "offline" || phase === "error");
  const [rows, setRows] = useState<Record<string, any>[]>([]),
    [query, setQuery] = useState(""),
    [limit, setLimit] = useState(100),
    [filter, setFilter] = useState(0),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      setRows((await getPlanejamentos(query, limit, filter)) || []);
      setError("");
    } catch {
      setError("Não foi possível abrir os planejamentos. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }, [query, limit, filter]);
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 180);
      return () => clearTimeout(timer);
    }, [load, lastSync]),
  );
  const openVisits = (item) =>
    router.push({
      pathname: "/atendimento/visitas",
      params: { idPlanejamento: item.id },
    });
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium" accessibilityRole="header">
          Planejamentos
        </Text>
        <Text style={{ color: colors.onSurfaceVariant }}>
          Escolha uma localidade para começar as visitas.
        </Text>
      </View>
      <InternetStatusMonitor />
      <Searchbar
        style={{ backgroundColor: colors.surface, borderRadius: 14 }}
        inputStyle={{ fontSize: 15 }}
        accessibilityLabel="Pesquisar região"
        placeholder="Buscar localidade ou zona"
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setLimit(100);
        }}
      />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[
            [0, "Todos"],
            [2, "Pendentes"],
            [3, "Em andamento"],
            [1, "Concluídos"],
          ].map(([value, label]) => (
            <Chip
              key={value}
              selected={filter === value}
              showSelectedCheck={false}
              onPress={() => {
                setFilter(Number(value));
                setLimit(100);
              }}
            >
              {String(label)}
            </Chip>
          ))}
        </ScrollView>
      </View>
      {!!error && <HelperText type="error">{error}</HelperText>}
      <FlatList
        data={rows}
        refreshing={busy && rows.length > 0}
        onRefresh={() => {
          scheduleSync(0);
          load();
        }}
        onEndReached={() => {
          if (!busy && rows.length === limit) setLimit((value) => value + 100);
        }}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: canCreate ? 88 : 16, gap: 12, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ padding: 24, gap: 12, alignItems: "center" }}>
            {busy || (!lastSync && phase === "syncing") ? (
              <>
                <ActivityIndicator />
                <Text>Preparando seus planejamentos…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={40}
                  color={colors.onSurfaceVariant}
                />
                <Text variant="titleMedium">
                  {query || filter
                    ? "Nenhum resultado"
                    : awaitingFirstLoad
                      ? "Não foi possível carregar"
                      : "Seu trabalho começa aqui"}
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: colors.onSurfaceVariant,
                  }}
                >
                  {query || filter
                    ? "Tente outra busca ou escolha Todos."
                    : awaitingFirstLoad
                      ? "Os planejamentos ainda não estão disponíveis. Tente novamente em instantes."
                      : admin
                        ? "Crie um planejamento para organizar as visitas da equipe."
                        : "Os planejamentos da sua equipe aparecerão aqui."}
                </Text>
                {awaitingFirstLoad && (
                  <IconButton
                    icon="refresh"
                    accessibilityLabel="Tentar carregar planejamentos novamente"
                    onPress={() => scheduleSync(0)}
                  />
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            }}
            onPress={() => openVisits(item)}
            accessibilityLabel={`${item.nome}. ${statuses[item.status] || "Planejamento"}. Abrir visitas`}
          >
            <Card.Content style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.primaryContainer,
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker-radius-outline"
                    size={26}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="titleMedium">{item.nome}</Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    {item.zona || "Localidade"}
                    {item.ciclo != null ? ` · Ciclo ${item.ciclo}` : ""}
                  </Text>
                </View>
                <IconButton
                  icon={admin ? "pencil-outline" : "information-outline"}
                  accessibilityLabel={`${admin ? "Editar" : "Ver dados de"} ${item.nome}`}
                  onPress={() =>
                    router.push({
                      pathname: "/atendimento",
                      params: { id: item.id },
                    })
                  }
                  style={{ margin: -4 }}
                />
              </View>
              <View
                style={{
                  gap: 8,
                }}
              >
                <Text
                  variant="labelMedium"
                  style={{
                    color:
                      item.status === 1 ? colors.secondary : colors.primary,
                    backgroundColor:
                      item.status === 1
                        ? colors.secondaryContainer
                        : colors.primaryContainer,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  {statuses[item.status] || "Planejamento"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    {item.visits} {item.visits === 1 ? "visita" : "visitas"}
                  </Text>
                  <Text variant="labelLarge" style={{ color: colors.primary }}>
                    Ver visitas →
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
      />
      {canCreate && (
        <FAB
          icon="plus"
          accessibilityLabel="Novo planejamento"
          accessibilityHint="Abre o cadastro de um planejamento"
          testID="planning-create"
          size="medium"
          color={colors.onPrimary}
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            borderRadius: 28,
            backgroundColor: colors.primary,
          }}
          onPress={() => router.push("/atendimento")}
        />
      )}
    </SafeAreaView>
  );
}
