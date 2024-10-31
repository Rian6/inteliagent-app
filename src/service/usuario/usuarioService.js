import { AUTHSERVICE } from "@root/constants/urls";
import { post } from "@root/service/default/defaultHTTPService";

export function registrarUsuario(data ={}){
    return post(AUTHSERVICE+"/api/user/register", data)
}

export function enviaEmailValidacaoCodigo(email){
    return post(AUTHSERVICE+"/api/user/sendEmail", {email})
}

export function validateRegisterUser(user){
    return post(AUTHSERVICE+"/api/user/validateCodeUserRegister", user)
}

export function login(user){
    return post(AUTHSERVICE+"/api/user/login", user)
}