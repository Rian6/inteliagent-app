import { LOADSERVICE } from "@root/constants/urls";
import { get, post } from "@root/service/default/defaultHTTPService";

export function uploadLoads(loads){
    return post(LOADSERVICE+'/api/sync', loads)
}

export function getLoads(idUsuario, isLoadFull=false) {
    return get(LOADSERVICE + `/api/consumer/${idUsuario}?isLoadFull=${isLoadFull}`);
}

export function confirmLoads(idUsuario, dataHora, tables) {
    return post(LOADSERVICE + `/api/consumer-confirm/${idUsuario}?dataHora=${dataHora}`, tables);
}
