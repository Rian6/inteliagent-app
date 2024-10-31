import { getSocket } from '../default/defaultSocketService';

export const getLoad = () => {
        return getSocket('/getLoads');
};
