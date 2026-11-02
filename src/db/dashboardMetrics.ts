import { database } from "@root/offline/database";
export async function getDashboardMetrics() {
  const [visits, plans, drafts] = await Promise.all([
    database.getFirstAsync(
      "SELECT COUNT(*) AS total,SUM(CASE WHEN SITUACAO_REFERENCIA=3 THEN 1 ELSE 0 END) AS realizadas,SUM(CASE WHEN SITUACAO_REFERENCIA IN (1,2) THEN 1 ELSE 0 END) AS pendencias,SUM(CASE WHEN SITUACAO_REFERENCIA=3 AND date(PRIMEIRA_VISITA)=date('now','localtime') THEN 1 ELSE 0 END) AS hoje,SUM(CASE WHEN CONTEM_AMOSTRA=1 THEN 1 ELSE 0 END) AS amostras,SUM(CASE WHEN CONTEM_TRATAMENTO=1 THEN 1 ELSE 0 END) AS tratamentos FROM VISITA WHERE COALESCE(SITUACAO,1)<>0",
    ),
    database.getFirstAsync(
      "SELECT COUNT(*) AS total,SUM(CASE WHEN STATUS=3 THEN 1 ELSE 0 END) AS ativos FROM PLANEJAMENTO WHERE COALESCE(SITUACAO,1)<>0",
    ),
    database.getFirstAsync("SELECT COUNT(*) AS total FROM VISITA_DRAFTS"),
  ]);
  return {
    total: Number(visits?.total || 0),
    realizadas: Number(visits?.realizadas || 0),
    hoje: Number(visits?.hoje || 0),
    pendencias: Number(visits?.pendencias || 0),
    amostras: Number(visits?.amostras || 0),
    tratamentos: Number(visits?.tratamentos || 0),
    planejamentos: Number(plans?.total || 0),
    ativos: Number(plans?.ativos || 0),
    rascunhos: Number(drafts?.total || 0),
  };
}
