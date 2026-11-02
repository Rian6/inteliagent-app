import axios from 'axios';
import { getValidToken, invalidateAccessToken } from './tokenStore';
import { AUTHSERVICE, MAINSERVICE, LOADSERVICE, SOCKETSERVICEURL } from '../../constants/urls';
declare module 'axios' { interface InternalAxiosRequestConfig { _protectedInternal?: boolean; _authRetried?: boolean; _sessionToken?: string | null } }
const origins = [AUTHSERVICE, MAINSERVICE, LOADSERVICE, SOCKETSERVICEURL].map(url => new URL(url).origin);
const publicAuthPaths = new Set(['/api/user/login','/api/user/refresh','/api/user/logout','/api/user/register','/api/user/sendEmail','/api/user/validateRegisterUser','/api/user/validateCodeUserRegister','/api/user/password/request','/api/user/password/reset','/api/cede/validate']);
export const api = axios.create({ timeout: 15000 });
api.interceptors.request.use(async config => {
  config._protectedInternal=false;
  if (config.url && origins.includes(new URL(config.url, config.baseURL).origin)) {
    const url = new URL(config.url, config.baseURL);
    const publicAuth = url.origin === new URL(AUTHSERVICE).origin && publicAuthPaths.has(url.pathname);
    config._protectedInternal=!publicAuth;
    if (!publicAuth) {
      const token = await getValidToken();
      config._sessionToken=token;
      if (token) config.headers.Authorization='Bearer '+token;
    }
  }
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const config=error.config;
  if (error.response?.status===401 && config?._protectedInternal) {
    if (!config._authRetried) {
      config._authRetried=true;
      const token=await getValidToken({force:true,rejected:config._sessionToken});
      if (token) { config.headers.Authorization='Bearer '+token;return api(config); }
    }
    await invalidateAccessToken(config._sessionToken);
  }
  return Promise.reject(error);
});
export const get = (url, params = {}) => api.get(url, { params });
export const post = (url, data = {}) => api.post(url, data);
export const put = (url, data = {}) => api.put(url, data);
export const del = (url, data = {}) => api.delete(url, { data });
