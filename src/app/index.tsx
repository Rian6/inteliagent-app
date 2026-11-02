import { useCallback } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSessionStore } from "@root/context/sessionContext";
import FormScreen from "@root/components/_default/screen/FormScreen";
import { BrandMark } from "@root/components/auth/AuthScreen";
import { Button, Heading, Text } from "@root/components/ui";
import { colors as c } from "@root/theme";
export default function Welcome() {
  const profile = useSessionStore((state) => state.profile);
  useFocusEffect(useCallback(() => {
    if (profile) router.replace("/tabs/application/planning");
  }, [profile?.id]));
  return (
    <FormScreen>
      <View
        style={{
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
          gap: 28,
          paddingTop: 40,
        }}
      >
        <BrandMark size={64} />
        <View style={{ gap: 12 }}>
          <Text muted small>
            INTELIAGENT
          </Text>
          <Heading style={{ fontSize: 34, lineHeight: 42 }}>
            Seu trabalho em campo, mais simples.
          </Heading>
          <Text muted>
            Planeje as rotas, registre as visitas e acompanhe sua equipe.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: c.primaryContainer,
            borderRadius: 28,
            padding: 24,
            gap: 16,
          }}
        >
          <View
            style={{
              width: 48,
              height: 6,
              backgroundColor: c.blue,
              borderRadius: 6,
            }}
          />
          <Text bold style={{ fontSize: 20, lineHeight: 28 }}>
            Uma etapa de cada vez.
          </Text>
          <Text muted>
            Encontre a localidade e comece o atendimento. O aplicativo cuida do
            resto.
          </Text>
        </View>
        <Button onPress={() => router.push("/login")}>
          Entrar na minha conta
        </Button>
        <Button variant="secondary" onPress={() => router.push("/register")}>
          Criar nova conta
        </Button>
      </View>
    </FormScreen>
  );
}
