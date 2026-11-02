export const AUTHSERVICE = process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:8080';
export const MAINSERVICE = process.env.EXPO_PUBLIC_MAIN_URL || 'http://localhost:8070';
export const LOADSERVICE = process.env.EXPO_PUBLIC_LOAD_URL || 'http://localhost:8090';
export const SOCKETSERVICEURL = process.env.EXPO_PUBLIC_CHAT_URL || 'http://localhost:5000';
export const LOADSOCKETSERVICEURL = AUTHSERVICE.replace(/^http/, 'ws');
export const CEPSERVICE = 'https://viacep.com.br/ws/{CEP}/json/';
