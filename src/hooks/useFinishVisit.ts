import { useState } from "react";
import { router } from "expo-router";
import useVisitaStore from "@root/context/visitaContext";
import { inserirVisita } from "@root/db/visitaPersistence";
import {
  accessibleVisitPage,
  visitPageErrors,
  visitStages,
} from "@root/data/visit-flow";

export function useFinishVisit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function finish() {
    const state = useVisitaStore.getState();
    if (state.saving) return;
    if (accessibleVisitPage("revisao", state.visita) !== "revisao") {
      setError("Conclua as etapas anteriores antes de salvar.");
      return;
    }
    const validation = visitStages(state.visita.situacaoVisita).flatMap(
      (stage) => Object.values(visitPageErrors(stage.page, state.visita)),
    );
    if (validation.length) {
      setError(validation[0]);
      return;
    }
    state.setSaving(true);
    setBusy(true);
    setError("");
    try {
      const planId = state.visita.idPlanejamento;
      await inserirVisita(state.visita);
      router.replace({
        pathname: "/atendimento/visitaConcluida",
        params: {
          idPlanejamento: planId,
        },
      });
    } catch (failure) {
      setError(
        failure.message ||
          "Não foi possível salvar. Seu preenchimento foi mantido.",
      );
    } finally {
      useVisitaStore.getState().setSaving(false);
      setBusy(false);
    }
  }
  return { busy, error, finish };
}
