import { Stack } from "expo-router";
import { navigationTheme } from "@root/theme";

export default function LayoutPlanning() {
  return (
    <Stack screenOptions={navigationTheme}>
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: "Planejamento" }}
      />
      <Stack.Screen name="boletim" options={{headerShown:true,title:"Boletim diário"}}/>
      <Stack.Screen
        name="visitas"
        options={{ headerShown: true, title: "Visitas" }}
      />
      <Stack.Screen
        name="rotaVisita"
        options={{ headerShown: true, title: "Rota de visitas" }}
      />
      <Stack.Screen
        name="registroServico"
        options={{
          headerShown: false,
          title: "Visita",
        }}
      />
    </Stack>
  );
}
