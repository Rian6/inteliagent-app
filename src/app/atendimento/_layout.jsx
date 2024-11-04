import { black, primariaClara } from "@root/components/_default/colors";
import { Stack } from "expo-router";

export default function LayoutPlanning() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: "Dados Gerais" }}
      />
      <Stack.Screen
        name="visitas"
        options={{ headerShown: true, title: "Visitas" }}
      />
      <Stack.Screen
        name="rotaVisita"
        options={{ headerShown: true, title: "Visitas" }}
      />
      <Stack.Screen
        name="registroServico"
        options={{
          headerShown: true,
          title: "Registro do Serviço Antivetorial",
          headerStyle: {
            backgroundColor: primariaClara,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: black,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Stack>
  );
}
