import { useCallback, useEffect } from "react";
import { BackHandler, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Heading, Text } from "@root/components/ui";
import { colors as c } from "@root/theme";
import useVisitaStore from "@root/context/visitaContext";

export default function VisitCompleted() {
  const { idPlanejamento } = useLocalSearchParams<{ idPlanejamento: string }>();
  // Keep the completed form intact until its route has unmounted. Resetting
  // during save makes its stage guard navigate with an empty planning ID.
  useEffect(() => {
    useVisitaStore.getState().resetVisita();
  }, []);
  const returnToVisits = useCallback(() => {
    if (!idPlanejamento) {
      router.replace("/tabs/application/planning");
      return;
    }
    router.dismissTo({
      pathname: "/atendimento/visitas",
      params: { idPlanejamento },
    });
  }, [idPlanejamento]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;
      const listener = BackHandler.addEventListener("hardwareBackPress", () => {
        returnToVisits();
        return true;
      });
      return () => listener.remove();
    }, [returnToVisits]),
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: c.surface, padding: 24 }}
    >
      <View
        testID="visit-completed"
        style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 20 }}
      >
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: c.mint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name="check" size={56} color={c.primary} />
        </View>
        <Heading style={{ textAlign: "center" }}>Visita concluída!</Heading>
        <Text muted style={{ textAlign: "center", maxWidth: 340 }}>
          A visita foi salva com sucesso. Você já pode continuar as visitas deste planejamento.
        </Text>
      </View>
      <Button testID="visit-completed-back" icon="arrow-left" onPress={returnToVisits}>
        Voltar às visitas
      </Button>
    </SafeAreaView>
  );
}
