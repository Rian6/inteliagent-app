import { FlatList } from "react-native";
import { Text, ListRow } from "@root/components/ui";
import { router } from "expo-router";
const statuses: Record<number, string> = {
  1: "Imóvel fechado",
  2: "Visita recusada",
  3: "Realizada",
  4: "Visita rejeitada",
  5: "Aberto",
};
export default function VisitaList({
  data = [] as Record<string, any>[],
  planId,
  refreshing = false,
  onRefresh,
  onEndReached,
  emptyMessage = "Nenhuma visita encontrada.",
}) {
  return (
    <FlatList
      data={data}
      contentContainerStyle={{ paddingBottom: 16 }}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <Text muted style={{ paddingVertical: 24, textAlign: "center" }}>
          {emptyMessage}
        </Text>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.nome}
          detail={
            item.inProgress
              ? "Continuar cadastro"
              : statuses[item.status] || "Aguardando visita"
          }
          inProgress={item.inProgress}
          onPress={() =>
            router.push({
              pathname: "/atendimento/registroServico",
              params: { idVisita: item.id, idPlanejamento: planId },
            })
          }
        />
      )}
    />
  );
}
