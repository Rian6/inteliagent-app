import { Stack } from 'expo-router';

export default function LayoutTabs() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title: '', headerShown: false}} />
      <Stack.Screen name="chatMessages" options={{title: '', headerShown: true, tabBarStyle: { display: '' }}} />
    </Stack>
  );
}
