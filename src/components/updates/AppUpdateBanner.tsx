import type { ReactNode } from 'react';
import { Linking,Pressable,Text,View,StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@root/theme';
import { useThemeStore } from '@root/service/theme/themeStore';
import { useUpdateStore } from '@root/service/updates/updateStore';
export function AppUpdateBanner() {
  const state=useUpdateStore(),release=state.release;
  if(!release||state.severity==='none'||(state.severity==='normal'&&state.dismissedBuild===release.versionCode)) return null;
  const mandatory=state.severity==='mandatory';
  return <SafeAreaView edges={['top']} style={{backgroundColor:mandatory?'#FEE2E2':'#FFF3CD'}}>
    <View style={styles.banner} accessibilityRole="alert">
      <View style={{flex:1}}><Text style={styles.title}>{mandatory?'Atualização obrigatória':'Atualização disponível'}</Text>
        <Text style={styles.message}>Versão {release.version} · build {release.versionCode}. {mandatory?'Atualize para continuar.':'Atualize seu aplicativo.'}</Text>
        {!!state.error&&<Text style={styles.message}>{state.error}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar aplicativo" style={styles.button} onPress={()=>{
        void Linking.openURL(release.downloadUrl).catch(()=>useUpdateStore.setState({error:'Não foi possível abrir o download. Tente novamente.'}));
      }}><Text style={styles.buttonText}>Atualizar</Text></Pressable>
      {state.severity==='normal'&&<Pressable accessibilityRole="button" accessibilityLabel="Ocultar aviso até o próximo login" style={styles.close} onPress={()=>useUpdateStore.setState({dismissedBuild:release.versionCode})}><Text style={styles.closeText}>×</Text></Pressable>}
    </View>
  </SafeAreaView>;
}
export function AppUpdateGate({children}:{children:ReactNode}) {
  useThemeStore(state=>state.mode);
  const required=useUpdateStore(state=>!!state.release&&state.severity==='mandatory');
  return <View style={{flex:1}}>
    <View style={{flex:1}} pointerEvents={required?'none':'auto'} accessibilityElementsHidden={required} importantForAccessibility={required?'no-hide-descendants':'auto'}>{children}</View>
    {required&&<View style={[styles.blocker,{backgroundColor:colors.background}]}><Text style={[styles.blockTitle,{color:colors.onSurface}]}>Atualize para continuar</Text><Text style={[styles.blockText,{color:colors.onSurfaceVariant}]}>Esta versão precisa ser atualizada. Use o botão Atualizar acima para instalar a nova versão. Seus dados serão mantidos.</Text></View>}
  </View>;
}
const styles=StyleSheet.create({
  banner:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12},
  title:{fontSize:14,fontWeight:'700',color:'#5B3510'},message:{fontSize:12,lineHeight:18,color:'#5B3510'},
  button:{backgroundColor:'#5B3510',borderRadius:8,paddingHorizontal:12,paddingVertical:12},buttonText:{color:'#FFFFFF',fontWeight:'700',fontSize:13},
  close:{minWidth:36,minHeight:44,alignItems:'center',justifyContent:'center'},closeText:{fontSize:26,color:'#5B3510'},
  blocker:{position:'absolute',top:0,right:0,bottom:0,left:0,alignItems:'center',justifyContent:'center',padding:28},
  blockTitle:{fontSize:22,fontWeight:'700',marginBottom:12},blockText:{fontSize:16,lineHeight:24,textAlign:'center'},
});
