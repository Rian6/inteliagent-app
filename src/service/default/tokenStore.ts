import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { offlineSession } from '../../offline/sessionStore';
import { useSessionStore } from '../../context/sessionContext';
import { AUTHSERVICE, SOCKETSERVICEURL } from '../../constants/urls';
import { Credentials, REFRESH_KEY } from '../../offline/credentials';
let legacyCleanup: Promise<any> | undefined;
const removeLegacyToken = () => legacyCleanup ||= AsyncStorage.removeItem('token');
const credentials = new Credentials({
  store: { get: key => SecureStore.getItemAsync(key), set: (key,value) => SecureStore.setItemAsync(key,value), remove: key => SecureStore.deleteItemAsync(key) },
  renew: async refreshToken => (await axios.post(AUTHSERVICE+'/api/user/refresh',{refreshToken},{timeout:15000})).data,
  onRenew: async result => {
    const current=useSessionStore.getState().profile;
    if (current && (current.id!==result.id || current.idCede!==result.idCede)) return;
    const { token,refreshToken,senha,securityPassword,codigoEmail,...profile }=result;
    await offlineSession.save({...(current||{}),...profile});
    if (current) useSessionStore.getState().setProfile({ ...current, ...profile, id:Number(result.id), idCede:Number(result.idCede) });
  },
});
export const getToken = async () => { await removeLegacyToken(); return credentials.get(); };
export const getValidToken = async (options = {}) => { await removeLegacyToken(); return credentials.valid(options); };
export const setToken = async (token: string,refreshToken?: string) => { await removeLegacyToken(); return credentials.save(token,refreshToken); };
export const invalidateAccessToken = (rejected?: string | null) => credentials.invalidate(rejected);
export const clearToken = async () => {
  const installation=await AsyncStorage.getItem("inteliagent-push-installation");
  const access=await credentials.get();
  const removePush=installation && access
    ? axios.delete(SOCKETSERVICEURL+'/push/devices/'+installation,{headers:{Authorization:'Bearer '+access},timeout:5000}).catch(()=>{})
    : Promise.resolve();
  const refreshToken=await SecureStore.getItemAsync(REFRESH_KEY);
  try { await credentials.clear(); await offlineSession.clear(); }
  finally { useSessionStore.getState().setProfile(null); }
  await removePush;
  if (refreshToken) await axios.post(AUTHSERVICE+'/api/user/logout',{refreshToken},{timeout:5000}).catch(() => {});
};
