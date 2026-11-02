import { Stack } from 'expo-router';

export default function LayoutTabs() {
  return (
    <Stack>
      <Stack.Screen name="application" options={{title: 'Tela tab', headerShown: false}} />
    </Stack>
  );
}
