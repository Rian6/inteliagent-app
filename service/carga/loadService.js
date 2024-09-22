import { getSocket } from '../default/defaultService';

export const getLoad = () => {
        return getSocket('/getLoads');
};
