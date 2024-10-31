import axios from 'axios';

export function get(url, data={}) {
    return axios({
        method: "get",
        url,
        data,
    });
}

export function post(url, data={}) {
    return axios({
        method: "post",
        url,
        data,
    });
}

export function put(url, data={}) {
    return axios({
        method: "put",
        url,
        data,
    });
}

export function del(url, data={}) {
    return axios({
        method: "delete",
        url,
        data,
    });
}