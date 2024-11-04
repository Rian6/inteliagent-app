import { AUTHSERVICE } from "@root/constants/urls";
import { get, post } from "@root/service/default/defaultHTTPService";

export function uploadLoads(loads){
    return post(AUTHSERVICE+'/api/load/upload', loads)
}