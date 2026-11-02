import { create } from "zustand";
import { newVisit } from "../offline/visits.ts";
import { changedVisitStage, visitStages } from "../data/visit-flow.ts";
type DraftPersistence = {
  drafts: { save: (visit: any) => Promise<any> };
  before?: (id: string) => void;
  changed?: (id: string) => void;
  failed?: (id: string) => void;
};
let persistence: DraftPersistence | null = null;
export const configureVisitPersistence = (value: DraftPersistence | null) => {
  persistence = value;
};
const saveDraft = (visit) => {
  const target = persistence;
  if (target && visit.id) {
    target.before?.(visit.id);
    target.drafts
      .save(visit)
      .then(() => target.changed?.(visit.id))
      .catch(() => target.failed?.(visit.id));
  }
};
interface VisitaState {
  visita: ReturnType<typeof newVisit>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  updateVisita: (data: any) => void;
  resetVisita: () => void;
  initializeVisita: (data: any, options?: { save?: boolean }) => void;
}
const useVisitaStore = create<VisitaState>((set) => ({
  visita: newVisit(),
  saving: false,
  setSaving: (saving) => set({ saving }),
  updateVisita: (data) =>
    set((state) => {
      if (state.saving) return state;
      const next = newVisit({ ...state.visita, ...data });
      const changed =
        Object.keys(data).length === 1 && data.boletim
          ? Object.keys(data.boletim).some(
              (key) =>
                data.boletim[key] !== state.visita.boletim?.[key] &&
                [
                  "imovelInformado",
                  "quarteiraoConcluido",
                  "quarteirao",
                  "sequenciaQuarteirao",
                  "ladoQuarteirao",
                  "sequenciaImovel",
                  "agenteNome",
                  "agenteCodigo",
                  "horaEntrada",
                ].includes(key),
            )
            ? "index"
            : data.boletim.laboratorio !== state.visita.boletim?.laboratorio
              ? "amostra"
              : data.boletim.inspecionadoLI !==
                  state.visita.boletim?.inspecionadoLI
                ? "inspecao"
                : data.boletim.focalGramas !==
                      state.visita.boletim?.focalGramas ||
                    data.boletim.focal2 !== state.visita.boletim?.focal2
                  ? "tratamento"
                  : null
          : changedVisitStage(data);
      if (changed) {
        const stages = visitStages(state.visita.situacaoVisita).map(
          (s) => s.page,
        );
        next.__completed = (state.visita.__completed || []).filter(
          (p: any) => stages.indexOf(p) < stages.indexOf(changed),
        );
      }
      saveDraft(next);
      return { visita: next };
    }),
  resetVisita: () => set({ visita: newVisit(), saving: false }),
  initializeVisita: (data, { save = false } = {}) =>
    set(() => {
      const next = newVisit(data);
      if (save) saveDraft(next);
      return { visita: next };
    }),
}));
export default useVisitaStore;
