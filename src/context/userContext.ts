import { create } from "zustand";
interface UserState {
  user: {
    nome: string;
    email: string;
    senha: string;
    codigoEmail: string;
    imagemPerfilUsuario: any;
    [key: string]: any;
  };
  verifiedEmail: string;
  setVerifiedEmail: (email: string) => void;
  updateUser: (data: Record<string, any>) => void;
}
const useUserStore = create<UserState>((set) => ({
  user: {
    nome: "",
    email: "",
    senha: "",
    codigoEmail: "",
    imagemPerfilUsuario: null,
  },
  verifiedEmail: "",
  setVerifiedEmail: (verifiedEmail) => set({ verifiedEmail }),
  updateUser: (data) =>
    set((state) => ({
      user: { ...state.user, ...data },
      verifiedEmail:
        data.email !== undefined && data.email !== state.user.email
          ? ""
          : state.verifiedEmail,
    })),
}));
export default useUserStore;
