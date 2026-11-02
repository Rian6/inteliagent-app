// Registration approval is now read through authenticated REST endpoints.
// The unauthenticated /aprove WebSocket protocol has been removed.
export const getSocket = async () => {
  throw new Error('A aprovação da conta é feita pelo administrador da sede. Após a aprovação, entre novamente.');
};
