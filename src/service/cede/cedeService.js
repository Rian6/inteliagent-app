import { AUTHSERVICE } from "@root/constants/urls";
import { get } from "@root/service/default/defaultHTTPService";

export function validateUsuariosCede(codigo){
    return get(AUTHSERVICE+'/api/cede/validate?cede='+codigo)
}