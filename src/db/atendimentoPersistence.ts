import { requirePlanningReport } from "@root/data/planning-report";
import { database as db } from "@root/offline/database";
import { currentEngine, scheduleSync } from "@root/offline/runtime";
import catalog from "@root/data/planning-catalog.json";
import {
  planningCycle,
  validatePlanningClassification,
} from "@root/data/planning-fields";
export async function inserirPlanejamento(item) {
  const engine = currentEngine();
  if (!engine.user.permissions?.[item.id ? "editPlanning" : "createPlanning"])
    throw new Error(
      "Você não tem permissão para cadastrar ou editar este planejamento.",
    );
  if (!String(item.nome || "").trim() || !String(item.zona || "").trim())
    throw new Error("Informe nome e zona.");
  validatePlanningClassification(item, catalog);
  if (!item.id) requirePlanningReport(item, catalog);
  const id = item.id || engine.uuid(),
    date = new Date(item.dataUltVisita || engine.now());
  if (!Number.isFinite(date.getTime())) throw new Error("Data inválida.");
  const year = String(item.ano || date.getFullYear()).match(/\d{4}/)?.[0];
  const locality = item.id
    ? { ...item.boletim }
    : {
        ...item.boletim,
        criadorId: engine.user.id,
        criadorNome: engine.user.nome || "",
        supervisorNome: engine.user.nome || "",
      };
  for (const key of [
    "concluida",
    "municipioIbge",
    "categoriaLocalidade",
    "atividade",
    "tipoLocalidade",
  ])
    delete locality[key];
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", {
      ID: id,
      BOLETIM_JSON: JSON.stringify(locality),
      ID_CIDADE: item.idCidade ?? null,
      ID_CATEGORIA: item.idCategoria ?? null,
      NOME: String(item.nome).trim(),
      ATIVIDADE: item.atividade ?? null,
      TIPO: item.tipo ?? null,
      DATA_ULT_VISITA: date.toISOString().replace("T", " ").slice(0, 19),
      ANO: `${year}-01-01`,
      ZONA: String(item.zona).trim(),
      STATUS: Number(item.status || 2),
      SITUACAO: Number(item.situacao ?? 1),
      CICLO: planningCycle(item.ciclo),
      CATALOGO_VERSAO: item.catalogoVersao ?? null,
    }),
  );
  scheduleSync();
  return id;
}
export async function getPlanejamentos(query = "", limit = 100, status = 0) {
  const planejamentos = await db.getAllAsync(
    `SELECT p.ID,p.NOME,p.DATA_ULT_VISITA,p.STATUS,p.ZONA,p.CICLO,
      (SELECT COUNT(*) FROM VISITA v WHERE v.ID_PLANEJAMENTO=p.ID AND COALESCE(v.SITUACAO,1)<>0) AS VISITS
      FROM PLANEJAMENTO p WHERE COALESCE(p.SITUACAO,1)<>0 AND (p.NOME LIKE ? OR p.ZONA LIKE ?)
      AND (?=0 OR p.STATUS=?) ORDER BY CASE p.STATUS WHEN 3 THEN 0 WHEN 2 THEN 1 ELSE 2 END,p.NOME,p.ID LIMIT ?`,
    [`%${query}%`, `%${query}%`, status, status, limit],
  );

  try {
    if (planejamentos) {
      return await planejamentos.map((pl) => {
        return {
          id: pl.ID,
          nome: pl.NOME,
          data: pl.DATA_ULT_VISITA,
          status: pl.STATUS,
          zona: pl.ZONA,
          ciclo: pl.CICLO,
          visits: pl.VISITS,
        };
      });
    }
  } catch (error) {
    console.error("Erro ao inserir item:", error);
  }

  return null;
}

export async function getPlanejamentoById(id) {
  const pl = await db.getFirstAsync(
    `SELECT ID, ID_CIDADE, ID_CATEGORIA, NOME, ATIVIDADE, TIPO, DATA_ULT_VISITA, ANO, ZONA, STATUS, SITUACAO, CICLO, CATALOGO_VERSAO, BOLETIM_JSON FROM PLANEJAMENTO WHERE ID = $ID`,
    { $ID: id },
  );
  if (!pl) return null;

  try {
    const planejamento = {
      boletim: JSON.parse(pl.BOLETIM_JSON || "{}"),
      id: pl.ID,
      ciclo: pl.CICLO,
      catalogoVersao: pl.CATALOGO_VERSAO,
      idCidade: pl.ID_CIDADE,
      idCategoria: pl.ID_CATEGORIA,
      nome: pl.NOME,
      atividade: pl.ATIVIDADE,
      tipo: pl.TIPO,
      dataUltVisita: pl.DATA_ULT_VISITA,
      ano: pl.ANO,
      zona: pl.ZONA,
      status: pl.STATUS,
      situacao: pl.SITUACAO,
    };
    return planejamento;
  } catch (error) {
    console.error("Erro ao inserir item:", error);
  }

  return null;
}
