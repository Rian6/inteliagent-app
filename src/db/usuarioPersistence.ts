import { activateAccount } from '../offline/runtime';
export const insertUsuario=profile=>activateAccount(profile,{onlineLogin:true});
