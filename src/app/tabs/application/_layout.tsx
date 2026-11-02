import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTabOptions } from "@root/components/navigation/useTabOptions";
import { colors } from "@root/theme";
export const unstable_settings = { initialRouteName: "home/index" };
export default function TabLayout() {
  const options = useTabOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Visão geral",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color={focused ? colors.primary : colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="planning/index"
        options={{
          title: "Planejamentos",
          tabBarLabel: "Planejamentos",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={24}
              color={focused ? colors.primary : colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Mensagens",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="message-outline"
              size={24}
              color={focused ? colors.primary : colors.onSurfaceVariant}
            />
          ),
        }}
      />
    </Tabs>
  );
}
