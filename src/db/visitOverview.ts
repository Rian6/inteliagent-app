import type { OfflineDatabase } from "../offline/contracts";
export type VisitFilter = "all" | "draft" | "completed";
export async function getVisitOverview(
  db: OfflineDatabase,
  planId: string,
  query = "",
  limit = 100,
  filter: VisitFilter = "all",
) {
  // In-progress forms appear beside visits, including edits to existing visits.
  // A draft replaces its saved row in the list without changing the saved data.
  return db.getAllAsync(
    `WITH entries AS (
    SELECT ID, json_extract(PAYLOAD_JSON,'$.nome') AS NOME,
      json_extract(PAYLOAD_JSON,'$.numero') AS NUMERO,
      json_extract(PAYLOAD_JSON,'$.situacaoVisita') AS STATUS,
      json_extract(PAYLOAD_JSON,'$.sequencia') AS SEQUENCIA,
      1 AS IN_PROGRESS, UPDATED_AT
    FROM VISITA_DRAFTS WHERE PLAN_ID=?
    UNION ALL
    SELECT v.ID,v.NOME,v.NUMERO,v.SITUACAO_REFERENCIA AS STATUS,v.SEQUENCIA,
      0 AS IN_PROGRESS,0 AS UPDATED_AT FROM VISITA v
    WHERE v.ID_PLANEJAMENTO=? AND COALESCE(v.SITUACAO,1)<>0
      AND NOT EXISTS (SELECT 1 FROM VISITA_DRAFTS d WHERE d.ID=v.ID)
  ) SELECT * FROM entries WHERE (COALESCE(NOME,'') LIKE ? OR COALESCE(NUMERO,'') LIKE ?)
    AND (?='all' OR (?='draft' AND IN_PROGRESS=1) OR (?='completed' AND IN_PROGRESS=0 AND STATUS=3))
    ORDER BY IN_PROGRESS DESC, UPDATED_AT DESC, SEQUENCIA, ID LIMIT ?`,
    [planId, planId, `%${query}%`, `%${query}%`, filter, filter, filter, limit],
  );
}
