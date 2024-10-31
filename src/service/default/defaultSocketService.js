import { LOADSOCKETSERVICEURL } from '../../constants/urls';

export const getSocket = (url) => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(LOADSOCKETSERVICEURL + url);

        socket.onopen = () => {
            socket.send(JSON.stringify({ nomeCarga: 'Teste' }));
        };

        socket.onmessage = (event) => {
            resolve(event.data);
        };

        socket.onerror = (error) => {
            reject(error);
        };
    });
};