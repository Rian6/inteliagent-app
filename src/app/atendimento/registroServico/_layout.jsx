import { FontAwesome6 } from "@expo/vector-icons";
import {
  black,
  primariaClara,
  primaryColor,
} from "@root/components/_default/colors";
import { Tabs, useRootNavigationState } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: black,
        tabBarStyle: {
          backgroundColor: primariaClara,
          height: 60,
          paddingVertical: 10,
        },
        headerShown: false,
        tabBarPosition: 'top', // Adicione esta linha
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Geral",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={20} name="tree-city" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspecao"
        options={{
          title: "Inspeção",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="newspaper" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="amostra"
        options={{
          title: "Amostra",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="vial-circle-check" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tratamento"
        options={{
          title: "Tratamento",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="mosquito" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
