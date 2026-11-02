import Button from "@root/components/_default/button/ActionButton";
import { colors } from "@root/theme";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View, Linking, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelperText, List, Text, ActivityIndicator } from "react-native-paper";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { WebView } from "react-native-webview";
import { database } from "@root/offline/database";
import { routeMapHtml } from "@root/components/visitas/routeMapHtml";
import { useSessionStore } from "@root/context/sessionContext";
import { currentEngine, scheduleSync } from "@root/offline/runtime";
import { Visits } from "@root/offline/visits.ts";
const status: Record<number, string> = {
  1: "Fechado",
  2: "Recusado",
  3: "Realizada",
  4: "Rejeitada",
  5: "Aberto",
};
export default function VisitRoute() {
  const params = useLocalSearchParams();
  const planId = String(params.idPlanejamento || params.id || "");
  const { height } = useWindowDimensions();
  const canReorder = !!useSessionStore(
    (state) => state.profile?.permissions?.reorderVisits,
  );
  const [ordering, setOrdering] = useState(false),
    [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<Record<string, any>[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [selected, setSelected] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      database
        .getAllAsync(
          "SELECT ID,NOME,NUMERO,LATITUDE,LONGITUDE,SEQUENCIA,SITUACAO_REFERENCIA FROM VISITA WHERE ID_PLANEJAMENTO=? AND COALESCE(SITUACAO,1)<>0 ORDER BY SEQUENCIA,ID",
          [planId],
        )
        .then((data) => {
          if (active) setRows(data);
        })
        .catch(() => {
          if (active) setError("Não foi possível abrir a rota salva.");
        })
        .finally(() => {
          if (active) setBusy(false);
        });
      return () => {
        active = false;
      };
    }, [planId]),
  );
  const html = useMemo(() => routeMapHtml(rows), [rows]);
  function move(index: number, delta: number) {
    if (
      !canReorder ||
      saving ||
      index + delta < 0 ||
      index + delta >= rows.length
    )
      return;
    setRows((previous) => {
      const next = [...previous];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  async function saveOrder() {
    setSaving(true);
    setError("");
    try {
      await new Visits(currentEngine()).reorder(
        planId,
        rows.map((row) => row.ID),
      );
      scheduleSync(0);
      setOrdering(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a ordem.",
      );
    } finally {
      setSaving(false);
    }
  }
  function openVisit(id: string) {
    router.push({
      pathname: "/atendimento/registroServico",
      params: { idVisita: id, idPlanejamento: planId },
    });
  }
  async function navigate(row: Record<string, any>) {
    const coordinate =
      row.LATITUDE != null && row.LONGITUDE != null
        ? row.LATITUDE + "," + row.LONGITUDE
        : [row.NOME, row.NUMERO, row.CEP].filter(Boolean).join(", ");
    try {
      await Linking.openURL(
        "https://www.google.com/maps/dir/?api=1&destination=" +
          encodeURIComponent(coordinate),
      );
    } catch {
      setError("Não foi possível abrir o aplicativo de navegação.");
    }
  }
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={{
          height: Math.max(180, Math.min(320, height * 0.36)),
          borderBottomWidth: 1,
          borderColor: colors.outlineVariant,
        }}
      >
        <WebView
          source={{ html }}
          originWhitelist={["*"]}
          javaScriptEnabled
          onMessage={(event) => {
            try {
              setSelected(JSON.parse(event.nativeEvent.data).id);
            } catch {}
          }}
          onError={() =>
            setError(
              "O mapa precisa de conexão. A lista da rota continua disponível abaixo.",
            )
          }
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 4 }}>
        <Text variant="titleLarge">Ordem das visitas</Text>
        <Text variant="bodySmall">
          Toque em um imóvel para abrir o registro. O trajeto segue as ruas, na
          ordem salva, para deslocamento de carro.
        </Text>
        {canReorder && !ordering && rows.length > 1 && (
          <Button
            icon="sort"
            disabled={busy}
            onPress={() => {
              setOriginal(rows);
              setOrdering(true);
            }}
          >
            Alterar ordem
          </Button>
        )}
        {ordering && (
          <View style={{ gap: 8 }}>
            <Text variant="bodySmall">
              Use as setas para organizar a rota e salve ao terminar.
            </Text>
            <Button disabled={saving || !canReorder} onPress={saveOrder}>
              {saving ? "Salvando…" : "Salvar ordem"}
            </Button>
            <Button
              disabled={saving}
              onPress={() => {
                setRows(original);
                setOrdering(false);
                setError("");
              }}
            >
              Cancelar
            </Button>
          </View>
        )}
      </View>
      {!!error && <HelperText type="error">{error}</HelperText>}
      {busy && <ActivityIndicator />}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.ID}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          !busy ? <Text>Nenhuma visita neste planejamento.</Text> : undefined
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              backgroundColor:
                selected === item.ID ? colors.primaryContainer : colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
            }}
          >
            <List.Item
              title={
                String(index + 1) +
                ". " +
                (item.NOME || "Imóvel") +
                ", " +
                (item.NUMERO || "s/n")
              }
              titleNumberOfLines={3}
              description={
                status[item.SITUACAO_REFERENCIA] || "Aguardando visita"
              }
              onPress={() => {
                if (!ordering) openVisit(item.ID);
              }}
            />
            {ordering && canReorder && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  paddingHorizontal: 8,
                  paddingBottom: 8,
                }}
              >
                <Button
                  accessibilityLabel={
                    "Mover visita " + (index + 1) + " para cima"
                  }
                  icon="arrow-up"
                  disabled={saving || index === 0}
                  onPress={() => move(index, -1)}
                  contentStyle={{ minHeight: 48 }}
                >
                  Subir
                </Button>
                <Button
                  accessibilityLabel={
                    "Mover visita " + (index + 1) + " para baixo"
                  }
                  icon="arrow-down"
                  disabled={saving || index === rows.length - 1}
                  onPress={() => move(index, 1)}
                  contentStyle={{ minHeight: 48 }}
                >
                  Descer
                </Button>
              </View>
            )}
            <Button
              contentStyle={{ minHeight: 48 }}
              icon="navigation-outline"
              onPress={() => navigate(item)}
            >
              Navegar até o imóvel
            </Button>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
