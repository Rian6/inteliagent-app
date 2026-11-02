import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_RELEASE_URL } from '@root/constants/urls';
import { parseAppRelease, updateSeverity } from './appUpdates';
import { useUpdateStore } from './updateStore';
const CACHE='inteliagent-github-release';
let pending:Promise<boolean>|undefined, restoration:Promise<void>|undefined, lastCheck=0;
export const installedRelease = () => ({
  version: (__DEV__ ? Constants.expoConfig?.version : Application.nativeApplicationVersion) || Constants.expoConfig?.version || '',
  code: Number((__DEV__ ? Constants.expoConfig?.android?.versionCode : Application.nativeBuildVersion) ?? Constants.expoConfig?.android?.versionCode),
});
async function restore() {
  if (!restoration) restoration=(async()=>{
    const installed=installedRelease();
    try { const value=await AsyncStorage.getItem(CACHE);
      const release=value?parseAppRelease(JSON.parse(value),APP_RELEASE_URL,installed.code):null;
      if(release) useUpdateStore.setState({release,severity:updateSeverity(release,installed.version,installed.code)});
    } catch { /* No valid cached release. */ }
  })();
  return restoration;
}
export function beginUpdateSession() { useUpdateStore.setState({dismissedBuild:null}); }
export async function checkForAppUpdate(force=false):Promise<boolean> {
  if(Platform.OS!=='android') return true;
  await restore();
  if(pending) return pending;
  if(!force && Date.now()-lastCheck<60000) return true;
  const installed=installedRelease();if(!Number.isSafeInteger(installed.code)||installed.code<1) return false;
  pending=(async()=>{
    lastCheck=Date.now();useUpdateStore.setState({checking:true});
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const url=new URL(APP_RELEASE_URL.replace(/latest\.json$/, 'check'));
      url.searchParams.set('version',installed.version);url.searchParams.set('build',String(installed.code));
      const response=await fetch(url.href,{signal:controller.signal,headers:{'Cache-Control':'no-cache'}});
      if(!response.ok) throw Error('Version service unavailable');
      const result=await response.json();
      if(result.source!=='github' || typeof result.available!=='boolean') throw Error('Invalid version response');
      const release=parseAppRelease(result.release,APP_RELEASE_URL,installed.code);
      if(result.available && !release) throw Error('Invalid available release');
      const severity=release?updateSeverity(release,installed.version,installed.code):'none';
      useUpdateStore.setState({release,severity,error:''});
      if(release) await AsyncStorage.setItem(CACHE,JSON.stringify(release));
      else await AsyncStorage.removeItem(CACHE);
      return true;
    } catch { return false; /* Retain known required updates while offline. */ }
    finally {clearTimeout(timeout);useUpdateStore.setState({checking:false});}
  })();
  pending = pending.finally(() => { pending = undefined; });
  return pending;
}
