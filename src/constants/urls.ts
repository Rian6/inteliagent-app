export const SERVER_URL = 'http://192.168.1.81:5173';
export const AUTHSERVICE = process.env.EXPO_PUBLIC_AUTH_URL || SERVER_URL;
export const MAINSERVICE = process.env.EXPO_PUBLIC_MAIN_URL || SERVER_URL;
export const LOADSERVICE = process.env.EXPO_PUBLIC_LOAD_URL || SERVER_URL;
export const SOCKETSERVICEURL = process.env.EXPO_PUBLIC_CHAT_URL || SERVER_URL;
export const APP_RELEASE_URL = process.env.EXPO_PUBLIC_APP_RELEASE_URL || 'http://192.168.1.81:5174/mobile/releases/latest.json';
export const LOADSOCKETSERVICEURL = AUTHSERVICE.replace(/^http/, 'ws');
export const CEPSERVICE = 'https://viacep.com.br/ws/{CEP}/json/';
