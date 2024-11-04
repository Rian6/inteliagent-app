import { create } from "zustand";

const useUserStore = create((set) => ({
  user: { nome: '', email: '', senha: '', codigoEmail: '', imagemPerfilUsuario: null },
  updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
}));

export default useUserStore;
