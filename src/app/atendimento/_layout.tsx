import { Stack } from "expo-router";
import { navigationThemeFor } from "@root/theme";
import { useThemeStore } from "@root/service/theme/themeStore";

export default function LayoutPlanning() {
  const mode = useThemeStore((state) => state.mode);
  return (
    <Stack screenOptions={navigationThemeFor(mode)}>
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
        name="visitaConcluida"
        options={{ headerShown: false, gestureEnabled: false }}
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
