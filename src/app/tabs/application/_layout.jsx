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
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: black,
        tabBarStyle: {
          backgroundColor: primariaClara,
          height: 60,
          paddingBottom: 10,
        },
        headerShown: false,
      })}
      initialRouteName="home/index"
    >
      <Tabs.Screen
        name="planning/index"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={20} name="list-check" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="comment-dots" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
