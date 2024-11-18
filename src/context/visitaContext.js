import { create } from "zustand";

const useVisitaStore = create((set) => ({
  visita: {
    id: '',
    idPlanejamento: '',
    primeiraVisita: null,
    segundaVisita: null,
    tipoVisita: '',
    numeroQuartos: '',
    contêmAmostra: false,
    contêmTratamento: false,
    situacaoReferencia: '',
    situacao: 1,
    inspecoes: [],
    amostra: {
      numeroInicio: '',
      numeroFinal: '',
      quantidade: '',
      imagens: []
    },
    tratamento: {
      depositosEliminados: '',
      imoveisTratados: '',
      quantidadeTratamento: '',
      tipo: '',
      quantidadeCarga: ''
    }
  },
  updateVisita: (data) => set((state) => ({ visita: { ...state.visita, ...data } })),
}));

export default useVisitaStore;
