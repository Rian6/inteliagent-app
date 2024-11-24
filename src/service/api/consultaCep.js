import { CEPSERVICE } from "@root/constants/urls";
import { get } from "@root/service/default/defaultHTTPService";


export function consultaCep(cep) {
    return get(CEPSERVICE.replace("{CEP}", cep));
}