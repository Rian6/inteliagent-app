import { getDashboardMetrics } from "@root/db/dashboardMetrics";
import { useSessionStore } from "@root/context/sessionContext";
import Button from "@root/components/_default/button/ActionButton";
import { colors } from "@root/theme";
import { database } from "@root/offline/database";
import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Image,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Card, Text, List, HelperText } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { countByRegiao, findLastVisitas } from "@root/db/visitaPersistence";
import { useSyncStore } from "@root/context/syncContext";
import { clearToken } from "@root/service/default/tokenStore";
import BarChart from "@root/components/_default/chart/BarChart";
import LineChart from "@root/components/_default/chart/LineChart";
import InternetStatusMonitor from "@root/components/_default/internet/InternetStatusMonitor";
import PageIntro from "@root/components/_default/screen/PageIntro";
import { Disclosure } from "@root/components/ui";
import { loadProfile } from "@root/service/usuario/profileService";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ContactAvatar } from "@root/components/chat/ChatUI";
const db = database;
export default function Home() {
  const { width } = useWindowDimensions();
  const profile = useSessionStore((state) => state.profile);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const lastSync = useSyncStore((state) => state.lastSync);
  const [visits, setVisits] = useState<Record<string, any>[]>([]),
    [regions, setRegions] = useState<{ labels: string[]; data: number[] }>({
      labels: [],
      data: [],
    }),
    [days, setDays] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const [latest, region, daily] = await Promise.all([
      findLastVisitas(),
      countByRegiao(),
      db.getAllAsync(
        "SELECT date(PRIMEIRA_VISITA) AS dia, COUNT(*) AS quantidade FROM VISITA WHERE PRIMEIRA_VISITA IS NOT NULL AND COALESCE(SITUACAO,1) <> 0 GROUP BY date(PRIMEIRA_VISITA) ORDER BY dia DESC LIMIT 14",
      ),
    ]);
    setMetrics(await getDashboardMetrics());
    setVisits(latest || []);
    setRegions(region || { labels: [], data: [] });
    setDays(daily.reverse());
    setError("");
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadProfile().catch(() => {});
      load().catch(() =>
        setError("Não foi possível carregar os dados locais."),
      );
    }, [load, lastSync]),
  );
  async function logout() {
    await clearToken();
    router.replace("/login");
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 840,
            alignSelf: "center",
            minHeight: 56,
            paddingHorizontal: 16,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: "Inter-SemiBold",
              fontSize: 22,
              lineHeight: 28,
              color: colors.onSurface,
              includeFontPadding: false,
            }}
          >
            Visão geral
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Meu perfil"
            onPress={() => router.push("/profile")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile?.fotoUri ? (
              <Image
                source={{ uri: profile.fotoUri }}
                style={{ width: 34, height: 34, borderRadius: 17 }}
              />
            ) : (
              <ContactAvatar name={profile?.nome || ""} size={34} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={logout}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 24,
          paddingBottom: 32,
          width: "100%",
          maxWidth: 840,
          alignSelf: "center",
        }}
      >
        <InternetStatusMonitor />
        <PageIntro
          eyebrow="SUA ROTINA EM CAMPO"
          title={"Olá, " + (profile?.nome?.split(" ")[0] || "agente")}
          description="Seu dia em campo, organizado em um só lugar."
        />
        <Button
          contentStyle={{ minHeight: 52 }}
          mode="contained"
          icon="map-marker-radius-outline"
          onPress={() => router.navigate("/tabs/application/planning")}
        >
          Ir para planejamentos
        </Button>
        {!!error && <HelperText type="error">{error}</HelperText>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {[
            ["Realizadas hoje", metrics.hoje, "#1C1C1C"],
            ["Em preenchimento", metrics.rascunhos, "#E6F1FD"],
            ["Planos em andamento", metrics.ativos, "#EDE9FE"],
            ["Fechados / recusados", metrics.pendencias, "#FFF2DD"],
          ].map(([label, value, background], index) => (
            <View
              key={String(label)}
              style={{
                width: "48%",
                flexGrow: 1,
                padding: 20,
                borderRadius: 24,
                backgroundColor: String(background),
                gap: 12,
              }}
            >
              <Text
                variant="bodySmall"
                style={{ color: index === 0 ? "#FFFFFF" : "#575760" }}
              >
                {label}
              </Text>
              <Text
                variant="headlineMedium"
                style={{ color: index === 0 ? "#FFFFFF" : "#1C1C1C" }}
              >
                {Number(value || 0)}
              </Text>
            </View>
          ))}
        </View>
        <Card
          mode="contained"
          style={{ backgroundColor: colors.surface, borderRadius: 24 }}
        >
          <Card.Content style={{ gap: 12 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text variant="titleMedium">Visitas realizadas</Text>
              <Text>
                {metrics.realizadas || 0} de {metrics.total || 0}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 6,
                backgroundColor: colors.outlineVariant,
                overflow: "hidden",
              }}
            >
              <View
                style={
                  {
                    height: 6,
                    borderRadius: 6,
                    backgroundColor: colors.blue,
                    width:
                      String(
                        metrics.total
                          ? Math.round(
                              (metrics.realizadas / metrics.total) * 100,
                            )
                          : 0,
                      ) + "%",
                  } as any
                }
              />
            </View>
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant }}
            >
              {metrics.amostras || 0} com coleta · {metrics.tratamentos || 0}{" "}
              com tratamento
            </Text>
          </Card.Content>
        </Card>
        <Disclosure
          title="Visitas por região"
          summary="Compare os atendimentos por localidade"
        >
          <Card mode="outlined">
            <Card.Content>
              <Text variant="titleMedium">Visitas por região</Text>
              {regions.data.length ? (
                <BarChart
                  width={Math.max(200, Math.min(width, 840) - 64)}
                  height={220}
                  labels={regions.labels}
                  data={regions.data}
                />
              ) : (
                <Text style={{ marginVertical: 24 }}>
                  Nenhuma visita registrada.
                </Text>
              )}
            </Card.Content>
          </Card>
        </Disclosure>
        <Disclosure
          title="Evolução das visitas"
          summary="Acompanhe os últimos 14 dias com registros"
        >
          <Card mode="outlined">
            <Card.Content>
              <Text variant="titleMedium">Evolução das visitas</Text>
              {days.length ? (
                <LineChart
                  width={Math.max(200, Math.min(width, 840) - 64)}
                  height={220}
                  labels={days.map((d) => d.dia)}
                  data={days.map((d) => d.quantidade)}
                />
              ) : (
                <Text style={{ marginVertical: 24 }}>
                  As visitas realizadas aparecerão aqui.
                </Text>
              )}
            </Card.Content>
          </Card>
        </Disclosure>
        <Card mode="outlined">
          <Card.Content>
            <Text variant="titleMedium">Últimas visitas</Text>
            {visits.map((item) => (
              <List.Item
                key={item.id}
                title={item.title || "Visita"}
                description={item.numero || "Sem número"}
                left={(props) => (
                  <List.Icon {...props} icon="map-marker-outline" />
                )}
              />
            ))}
            {!visits.length && (
              <Text style={{ marginVertical: 24 }}>
                Nenhuma visita disponível.
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
