import { Stack } from 'expo-router';

export default function LayoutPlanning() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}} />
      <Stack.Screen name="chatMessages" options={{title: '', headerShown: true, tabBarStyle: { display: '' }}} />
    </Stack>
  );
}