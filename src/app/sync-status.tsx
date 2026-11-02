import Button from "@root/components/_default/button/ActionButton";
import { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Card, HelperText, List, Text } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import {
  currentEngine,
  synchronize,
  scheduleSync,
} from "@root/offline/runtime";
import { VisitDrafts } from "@root/offline/visits.ts";
import { useSyncStore } from "@root/context/syncContext";

const labels = {
  PLANEJAMENTO: "Planejamento",
  VISITA: "Visita",
  INSPECAO: "Inspeção",
  AMOSTRA: "Amostra",
  TRATAMENTO: "Tratamento",
};
export default function SyncStatus() {
  const status = useSyncStore(),
    [problems, setProblems] = useState<Record<string, any>[]>([]),
    [drafts, setDrafts] = useState<
      { id: string; updatedAt: number; visit: Record<string, any> }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const engine = currentEngine();
    const [items, saved] = await Promise.all([
      engine.problems(),
      new VisitDrafts(engine.db).list(),
    ]);
    setProblems([
      ...new Map(items.map((item) => [item.AGGREGATE_KEY, item])).values(),
    ]);
    setDrafts(saved);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load().catch(() =>
        setError("Não foi possível carregar as pendências locais."),
      );
    }, [load, status.pending, status.conflicts, status.rejected]),
  );
  async function sync() {
    setBusy(true);
    setError("");
    try {
      await synchronize({ force: true });
      await load();
    } catch {
      setError("O envio não terminou. Os dados permanecem salvos.");
    } finally {
      setBusy(false);
    }
  }
  async function resolve(item, choice) {
    setBusy(true);
    try {
      await currentEngine().resolve(item.MUTATION_ID, choice);
      scheduleSync(0);
      await load();
    } catch {
      setError("Não foi possível resolver esta pendência.");
    } finally {
      setBusy(false);
    }
  }
  function choose(item, choice) {
    Alert.alert(
      choice === "local"
        ? "Manter meu preenchimento?"
        : "Usar a atualização da equipe?",
      choice === "local"
        ? "Seu preenchimento será enviado novamente para a equipe."
        : "Seu preenchimento deste registro será substituído pela atualização da equipe.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => resolve(item, choice) },
      ],
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text>
        Confira apenas os registros que precisam da sua decisão. As demais
        atualizações acontecem automaticamente.
      </Text>
      {!!error && <HelperText type="error">{error}</HelperText>}
      {status.requiresLogin ? (
        <Button
          contentStyle={{ minHeight: 48 }}
          mode="contained"
          onPress={() => router.push("/login")}
        >
          Confirmar minha conta
        </Button>
      ) : status.phase === "error" ? (
        <Button
          contentStyle={{ minHeight: 48 }}
          mode="contained"
          icon="sync"
          loading={busy}
          disabled={busy}
          onPress={sync}
        >
          Tentar novamente
        </Button>
      ) : null}
      <Text variant="titleLarge">Cadastros em preenchimento</Text>
      {!drafts.length && <Text>Nenhum formulário em andamento.</Text>}
      {drafts.map((item) => (
        <Card
          key={item.id}
          mode="outlined"
          onPress={() =>
            router.push({
              pathname: "/atendimento/registroServico",
              params: {
                idVisita: item.id,
                idPlanejamento: item.visit.idPlanejamento,
              },
            })
          }
        >
          <List.Item
            title={item.visit.nome || "Visita em andamento"}
            description={`Salvo em ${new Date(item.updatedAt).toLocaleString("pt-BR")}`}
            left={(props) => <List.Icon {...props} icon="file-edit-outline" />}
          />
        </Card>
      ))}
      <Text variant="titleLarge">Registros para revisar</Text>
      {!problems.length && (
        <Text>Tudo certo. Nenhum registro precisa da sua decisão.</Text>
      )}
      {problems.map((item) => {
        const local = JSON.parse(item.PAYLOAD_JSON),
          server = item.SERVER_JSON ? JSON.parse(item.SERVER_JSON) : null;
        return (
          <Card key={item.AGGREGATE_KEY} mode="outlined">
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">
                {labels[item.TABLE_NAME]}: {local.NOME || local.ID}
              </Text>
              <Text>{item.ERROR}</Text>
              {server && (
                <Text>
                  Equipe:{" "}
                  {server.NOME || "Registro atualizado em outro dispositivo"}
                </Text>
              )}
              <Text>
                A decisão vale para a visita e todos os seus detalhes. Para
                corrigir os campos, abra a visita e salve novamente.
              </Text>
              <View style={{ gap: 8 }}>
                <Button
                  contentStyle={{ minHeight: 48 }}
                  disabled={busy}
                  onPress={() => choose(item, "local")}
                >
                  Manter meu preenchimento
                </Button>
                <Button
                  contentStyle={{ minHeight: 48 }}
                  disabled={busy}
                  onPress={() => choose(item, "server")}
                >
                  Usar atualização da equipe
                </Button>
              </View>
            </Card.Content>
          </Card>
        );
      })}
    </ScrollView>
  );
}
