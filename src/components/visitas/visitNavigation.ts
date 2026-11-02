import { router } from "expo-router";
import useVisitaStore from "@root/context/visitaContext";
import { visitPath, accessibleVisitPage, type VisitPage } from "@root/data/visit-flow";
export function goVisit(page: VisitPage, remember = true) {
  const state = useVisitaStore.getState(),
    visit = state.visita;
  page = accessibleVisitPage(page, visit);
  if (remember && String(visit.nome || "").trim())
    state.updateVisita({ __page: page });
  router.replace({
    pathname: visitPath(page) as any,
    params: { idVisita: visit.id, idPlanejamento: visit.idPlanejamento },
  });
}
export function closeVisit() {
  const visit = useVisitaStore.getState().visita;
  router.dismissTo({
    pathname: "/atendimento/visitas",
    params: { idPlanejamento: visit.idPlanejamento },
  });
}
