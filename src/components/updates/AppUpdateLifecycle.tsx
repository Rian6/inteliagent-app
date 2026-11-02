import { useEffect } from "react";
import { AppState } from "react-native";
import { useSessionStore } from '@root/context/sessionContext';
import { beginUpdateSession,checkForAppUpdate } from '@root/service/updates/checkAppUpdate';

export default function AppUpdateLifecycle() {
  const owner=useSessionStore(state=>state.profile?.id);
  useEffect(()=>{if(owner){beginUpdateSession();void checkForAppUpdate(true);}},[owner]);
  useEffect(() => {
    beginUpdateSession();
    const check=()=>{if(AppState.currentState==='active') void checkForAppUpdate();};
    void checkForAppUpdate(true);
    const subscription=AppState.addEventListener('change',state=>{if(state==='active') check();});
    const interval=setInterval(check,60000);
    return()=>{clearInterval(interval);subscription.remove();};
  }, []);
  return null;
}
