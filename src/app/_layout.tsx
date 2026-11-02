import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import Button from '@root/components/_default/button/ActionButton';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { restoreAccount } from '@root/offline/runtime';
import SyncLifecycle from '@root/offline/SyncLifecycle';
import MessagePushLifecycle from '@root/components/chat/MessagePushLifecycle';
import ProfileLifecycle from '@root/components/chat/ProfileLifecycle';
import AppUpdateLifecycle from '@root/components/updates/AppUpdateLifecycle';
import { AppUpdateBanner, AppUpdateGate } from '@root/components/updates/AppUpdateBanner';
import { useSessionStore } from '@root/context/sessionContext';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme, navigationTheme } from '@root/theme';
import { useFonts } from 'expo-font';

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font, ...FontAwesome.font,
    'Ubuntu-Regular': require('../assets/fonts/Ubuntu-Regular.ttf'),
    'Ubuntu-Medium': require('../assets/fonts/Ubuntu-Medium.ttf'),
    'Ubuntu-Bold': require('../assets/fonts/Ubuntu-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });
  const [ready,setReady] = useState(false), [failure,setFailure] = useState(''), [attempt,setAttempt] = useState(0);
  const profile=useSessionStore(state=>state.profile);
  useEffect(()=>{let active=true;setFailure('');restoreAccount().then(()=>{if(active)setReady(true);}).catch(()=>{if(active)setFailure('Não foi possível abrir os dados locais. Nenhum arquivo foi apagado.');});return()=>{active=false;};},[attempt]);
  if(!ready || (!fontsLoaded && !fontError))return <PaperProvider theme={theme}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:theme.colors.background}}>{failure?<><Text>{failure}</Text><Button contentStyle={{ minHeight: 48 }} onPress={()=>setAttempt(value=>value+1)}>Tentar novamente</Button></>:<ActivityIndicator accessibilityLabel="Abrindo dados locais"/>}</View></PaperProvider>;

  return (
    <SafeAreaProvider><PaperProvider theme={theme}><StatusBar style="dark"/><SyncLifecycle/><ProfileLifecycle/><MessagePushLifecycle/><AppUpdateLifecycle/><View style={{flex:1}}><AppUpdateBanner/><AppUpdateGate><Stack screenOptions={navigationTheme}>
      <Stack.Screen name="index" options={{headerShown: false}} />
      <Stack.Screen name="login/index" options={{headerShown: false}} />
      <Stack.Screen name="login/recoverPassword" options={{headerShown: false}}/>
      <Stack.Screen name="register/index" options={{headerShown: false}} />
      <Stack.Screen name="register/aprovacao" options={{headerShown: false}} />
      <Stack.Screen name="register/aprovacaoId" options={{headerShown: false}} />
      <Stack.Screen name="register/informacoesPessoais" options={{headerShown: false}} />
      <Stack.Screen name="register/verificacao" options={{headerShown: false}} />
      <Stack.Screen name="register/confirmaCadastroScreen" options={{headerShown: false}} />

      <Stack.Protected guard={!!profile}>
      <Stack.Screen name="profile/index" options={{title:"Meu perfil",headerBackTitle:"Voltar"}}/>
      <Stack.Screen name="sync-status" options={{title:"Revisar registros"}}/>
      <Stack.Screen name="tabs" options={{headerShown: false}}/>

      <Stack.Screen name="atendimento" options={{headerShown: false}} />
      <Stack.Screen name="chat-message/index" options={{headerShown: true, title:''}} />
      </Stack.Protected>
    </Stack></AppUpdateGate></View></PaperProvider></SafeAreaProvider>
  );
}
