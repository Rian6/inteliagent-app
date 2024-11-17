import { AUTHSERVICE, MAINSERVICE } from "@root/constants/urls";
import { get, post } from "@root/service/default/defaultHTTPService";

export function uploadLoads(loads){
    return post(MAINSERVICE+'/api/sync', loads)
}

export function getLoads(idUsuario, isLoadFull=false) {
    return get(MAINSERVICE + `/api/consumer/${idUsuario}?isLoadFull=${isLoadFull}`);
}

export function confirmLoads(idUsuario, dataHora, tables) {
    return post(MAINSERVICE + `/api/consumer-confirm/${idUsuario}?dataHora=${dataHora}`, tables);
}
