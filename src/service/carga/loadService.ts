import { LOADSERVICE } from "@root/constants/urls";
import { get, post } from "@root/service/default/defaultHTTPService";

export function uploadLoads(loads){
    return post(LOADSERVICE+'/api/sync', loads)
}

export function getLoads(idUsuario, isLoadFull=false, offset=0, downloadId='') {
    return get(LOADSERVICE + `/api/consumer/${idUsuario}?isLoadFull=${isLoadFull}&offset=${offset}&downloadId=${encodeURIComponent(downloadId)}`);
}

export function confirmLoads(idUsuario, downloadId, tables) {
    return post(LOADSERVICE + `/api/consumer-confirm/${idUsuario}?downloadId=${encodeURIComponent(downloadId)}`, tables);
}
