import { create } from "zustand";

const useVisitaStore = create((set) => ({
  visita: { descricao: '' },
  updateVisita: (data) => set((state) => ({ visita: { ...state.visita, ...data } })),
}));

export default useVisitaStore;