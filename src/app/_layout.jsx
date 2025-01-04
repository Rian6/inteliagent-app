import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}} />
      <Stack.Screen name="login/index" options={{headerShown: false}} />
      <Stack.Screen name="login/recoverPassword" options={{headerShown: false}}/>
      <Stack.Screen name="register/index" options={{headerShown: false}} />
      <Stack.Screen name="register/aprovacao" options={{headerShown: false}} />
      <Stack.Screen name="register/aprovacaoId" options={{headerShown: false}} />
      <Stack.Screen name="register/informacoesPessoais" options={{headerShown: false}} />
      <Stack.Screen name="register/verificacao" options={{headerShown: false}} />
      <Stack.Screen name="register/confirmaCadastroScreen" options={{headerShown: false}} />

      <Stack.Screen name="tabs" options={{headerShown: false}}/>

      <Stack.Screen name="atendimento" options={{headerShown: false}} />
      <Stack.Screen name="chat-message/index" options={{headerShown: true, title:''}} />
    </Stack>
  );
}
