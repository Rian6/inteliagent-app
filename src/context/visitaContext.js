import { create } from "zustand";

// Define um objeto padrão para resetar ou inicializar visitas
const visitaInicial = {
  id: "",
  idPlanejamento: "",
  primeiraVisita: null,
  segundaVisita: null,
  tipoVisita: 'N',
  numeroQuartos: 0,
  contemAmostra: false,
  contemTratamento: false,
  situacaoVisita: 'N',
  cep: null,
  nome: null,
  numero: null,
  complemento: null,
  situacao: 1,
  inspecoes: [],
  amostra: {
    numeroInicio: null,
    numeroFinal: null,
    quantidade: null,
    imagens: [],
  },
  tratamento: {
    depositosEliminados: null,
    imoveisTratados: null,
    quantidadeTratamento: null,
    tipo: null,
    quantidadeCarga: null,
  },
};

// Cria o store com Zustand
const useVisitaStore = create((set) => ({
  visita: { ...visitaInicial },

  updateVisita: (data) =>
    set((state) => ({
      visita: { ...state.visita, ...data },
    })),

  resetVisita: () =>
    set(() => ({
      visita: { ...visitaInicial },
    })),

  initializeVisita: (data) =>
    set(() => ({
      visita: { ...visitaInicial, ...data },
    })),
}));

export default useVisitaStore;
