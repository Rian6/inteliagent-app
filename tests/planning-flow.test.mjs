// Cenários de fluxo para planejamento e visita (camada de dados e validação).
// O fluxo de planejamento na UI usa inserirPlanejamento(), que depende do
// motor nativo; por isso a validação de cadastro é testada pelas funções puras
// que ele executa na mesma ordem: planningCycle → validatePlanningClassification
// → requirePlanningReport.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  planningCycle,
  validatePlanningClassification,
  mergeClassification,
  selectedClassification,
} from "../src/data/planning-fields.ts";
import {
  planningReportErrors,
  requirePlanningReport,
} from "../src/data/planning-report.ts";
import {
  visitStatus,
  treatmentMode,
  newVisit,
  Visits,
} from "../src/offline/visits.ts";
import { changedVisitStage } from "../src/data/visit-flow.ts";
import store from "../src/context/visitaContext.ts";
import { initializeDatabase } from "../src/offline/schema.ts";
import { adaptDatabase } from "../src/offline/sqliteAdapter.ts";
import { OfflineEngine } from "../src/offline/engine.ts";

const catalog = JSON.parse(
  readFileSync(new URL("../src/data/planning-catalog.json", import.meta.url), "utf8"),
);
const validPlan = (over = {}) => ({
  idCidade: 4104808,
  idCategoria: 10001,
  atividade: 2,
  tipo: 1,
  ciclo: 3,
  ano: "2026",
  nome: "Região Norte",
  zona: "Norte",
  catalogoVersao: catalog.version,
  boletim: { codigoLocalidade: "IBGE-0001" },
  ...over,
});

// ---------- Cadastro de planejamento: validação na mesma ordem do app ----------

test("cadastro válido de planejamento passa por toda a validação", () => {
  const plan = validPlan();
  assert.equal(planningCycle(plan.ciclo), 3);
  assert.doesNotThrow(() => validatePlanningClassification(plan, catalog));
  assert.deepEqual(planningReportErrors(plan, catalog), {});
  assert.doesNotThrow(() => requirePlanningReport(plan, catalog));
});

test("ciclo inválido é rejeitado antes de qualquer outra validação", () => {
  for (const ciclo of [-1, 100, 1.5, "abc"])
    assert.throws(() => planningCycle(ciclo), /ciclo/i);
});

test("classificação com referência inexistente no catálogo é rejeitada", () => {
  assert.throws(
    () => validatePlanningClassification(validPlan({ idCidade: 1 }), catalog),
    /município|categoria|atividade|tipo/i,
  );
  assert.throws(
    () =>
      validatePlanningClassification(validPlan({ catalogoVersao: "outra" }), catalog),
    /não suportada/i,
  );
});

test("merge parcial exige os quatro campos da classificação", () => {
  assert.throws(
    () =>
      mergeClassification(
        { idCidade: 1, idCategoria: 77, atividade: 88, tipo: 99 },
        { idCidade: 4104808 },
        catalog,
      ),
    /quatro|município|categoria|atividade|tipo/i,
  );
  // Apenas a seleção vazia preserva os dados legados.
  assert.deepEqual(
    mergeClassification(
      { idCidade: 1, idCategoria: 77, atividade: 88, tipo: 99 },
      {},
      catalog,
    ),
    { idCidade: 1, idCategoria: 77, atividade: 88, tipo: 99, catalogoVersao: null },
  );
});

test("selectedClassification ignora versão legada e devolve nulos", () => {
  assert.deepEqual(
    selectedClassification(
      { idCidade: 4104808, idCategoria: 10001, atividade: 2, tipo: 1 },
      catalog,
    ),
    { idCidade: null, idCategoria: null, atividade: null, tipo: null },
  );
  assert.deepEqual(
    selectedClassification(validPlan(), catalog),
    { idCidade: 4104808, idCategoria: 10001, atividade: 2, tipo: 1 },
  );
});

test("relatório de planejamento ausente acusa todos os campos", () => {
  const errors = planningReportErrors({}, catalog);
  for (const key of [
    "idCidade",
    "idCategoria",
    "atividade",
    "tipo",
    "nome",
    "zona",
    "ano",
    "ciclo",
    "codigoLocalidade",
  ])
    assert.ok(errors[key], `erro esperado para ${key}`);
});

test("inconsistências entre boletim e classificação são detectadas", () => {
  const municipio = planningReportErrors(
    validPlan({ boletim: { codigoLocalidade: "X", municipioIbge: 1 } }),
    catalog,
  );
  assert.ok(municipio.idCidade);
  const categoria = planningReportErrors(
    validPlan({ boletim: { codigoLocalidade: "X", categoriaLocalidade: "PV" } }),
    catalog,
  );
  assert.ok(categoria.idCategoria);
  const atividade = planningReportErrors(
    validPlan({ boletim: { codigoLocalidade: "X", atividade: 1 } }),
    catalog,
  );
  assert.ok(atividade.atividade);
  const tipo = planningReportErrors(
    validPlan({ boletim: { codigoLocalidade: "X", tipoLocalidade: 2 } }),
    catalog,
  );
  assert.ok(tipo.tipo);
});

test("ano precisa de quatro dígitos e código da localidade tem limite de 32", () => {
  assert.ok(planningReportErrors(validPlan({ ano: "26" }), catalog).ano);
  assert.deepEqual(
    planningReportErrors(validPlan({ ano: "2026-01-01" }), catalog),
    {},
  );
  assert.ok(
    planningReportErrors(
      validPlan({ boletim: { codigoLocalidade: "x".repeat(33) } }),
      catalog,
    ).codigoLocalidade,
  );
  assert.deepEqual(
    planningReportErrors(
      validPlan({ boletim: { codigoLocalidade: "x".repeat(32) } }),
      catalog,
    ),
    {},
  );
});

test("requirePlanningReport junta as mensagens de erro", () => {
  assert.throws(
    () => requirePlanningReport({}, catalog),
    (error) => /zona/i.test(error.message) && /ano/i.test(error.message),
  );
});

// ---------- Helpers puros da visita ----------

test("visitStatus aceita letras e números", () => {
  assert.equal(visitStatus("N"), 3);
  assert.equal(visitStatus("R"), 2);
  assert.equal(visitStatus("F"), 1);
  assert.equal(visitStatus(4), 4);
  assert.equal(visitStatus("5"), 5);
  assert.equal(visitStatus(undefined), 3);
  assert.ok(Number.isNaN(visitStatus("abc")));
});

test("treatmentMode separa focal, perifocal e legado", () => {
  assert.equal(treatmentMode("FOCAL:BTI"), "focal");
  assert.equal(treatmentMode("PERIFOCAL:Delta"), "perifocal");
  assert.equal(treatmentMode("Produto legado"), "legacy");
  assert.equal(treatmentMode(""), "legacy");
});

test("newVisit aplica os padrões do fluxo", () => {
  const visit = newVisit();
  assert.equal(visit.tipoVisita, "N");
  assert.equal(visit.situacaoVisita, 3);
  assert.equal(visit.numeroQuartos, 0);
  assert.deepEqual(visit.itensInspecionados, []);
  assert.equal(visit.amostra.numeroInicio, 0);
  const custom = newVisit({ situacaoVisita: "F", nome: "Rua A" });
  assert.equal(custom.situacaoVisita, 1);
  assert.equal(custom.nome, "Rua A");
});

test("changedVisitStage mapeia campos para a etapa correta", () => {
  assert.equal(changedVisitStage({ nome: "Rua" }), "index");
  assert.equal(changedVisitStage({ situacaoVisita: 2 }), "index");
  assert.equal(changedVisitStage({ boletim: { qualquer: 1 } }), "index");
  assert.equal(changedVisitStage({ itensInspecionados: [1] }), "inspecao");
  assert.equal(changedVisitStage({ __inspectionAnswered: true }), "inspecao");
  assert.equal(changedVisitStage({ amostra: { quantidade: 1 } }), "amostra");
  assert.equal(changedVisitStage({ contemAmostra: true }), "amostra");
  assert.equal(changedVisitStage({ tratamento: { focal: {} } }), "tratamento");
  assert.equal(changedVisitStage({ contemTratamento: true }), "tratamento");
  assert.equal(changedVisitStage({ campoDesconhecido: 1 }), null);
  assert.equal(changedVisitStage({}), null);
  // A ordem do cascade vence: campos de inspeção e tratamento juntos invalidam a inspeção.
  assert.equal(
    changedVisitStage({ itensInspecionados: [1], tratamento: {} }),
    "inspecao",
  );
});

// ---------- Invalidação fina do boletim no store ----------

const openVisit = (patch = {}) =>
  newVisit({
    nome: "Rua de campo",
    numero: "10",
    situacaoVisita: 3,
    ...patch,
  });
const fullProgress = ["index", "inspecao", "amostra", "tratamento"];

test("boletim de endereço invalida todas as etapas seguintes", () => {
  store.getState().initializeVisita(
    openVisit({
      __completed: [...fullProgress],
      contemAmostra: true,
      amostra: { numeroInicio: 1, numeroFinal: 2, quantidade: 2 },
    }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { horaEntrada: "08:00" } });
  assert.deepEqual(store.getState().visita.__completed, []);
});

test("boletim de laboratório invalida amostra e tratamento", () => {
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { laboratorio: "Lab Norte" } });
  assert.deepEqual(store.getState().visita.__completed, ["index", "inspecao"]);
});

test("boletim de inspeção invalida apenas a partir da inspeção", () => {
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { inspecionadoLI: "1" } });
  assert.deepEqual(store.getState().visita.__completed, ["index"]);
});

test("boletim de tratamento invalida apenas o tratamento", () => {
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { focalGramas: "1,5" } });
  assert.deepEqual(store.getState().visita.__completed, [
    "index",
    "inspecao",
    "amostra",
  ]);
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { focal2: { tipo: "BTI" } } });
  assert.deepEqual(store.getState().visita.__completed, [
    "index",
    "inspecao",
    "amostra",
  ]);
});

test("boletim com campo fora das etapas não invalida nada", () => {
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store.getState().updateVisita({ boletim: { complemento: "Bloco B" } });
  assert.deepEqual(store.getState().visita.__completed, [...fullProgress]);
});

test("patch misto de endereço e laboratório invalida tudo pela etapa de endereço", () => {
  store.getState().initializeVisita(
    openVisit({ __completed: [...fullProgress] }),
    { save: false },
  );
  store
    .getState()
    .updateVisita({ nome: "Rua Corrigida", boletim: { laboratorio: "Lab" } });
  assert.deepEqual(store.getState().visita.__completed, []);
});

// ---------- Visitas: rejeições de dados e planejamento ----------

const root = mkdtempSync(join(tmpdir(), "inteliagent-planning-"));
const handles = [];
after(() => {
  for (const db of handles) {
    try {
      db.native.close();
    } catch {
      /* já fechado */
    }
  }
  assert.ok(
    resolve(root).startsWith(resolve(tmpdir()) + sep + "inteliagent-planning-"),
  );
  rmSync(root, { recursive: true, force: true });
});
function open() {
  const filename = join(root, randomUUID() + ".db");
  const native = new DatabaseSync(filename);
  let serial = Promise.resolve();
  const bind = (params) =>
    Array.isArray(params) ? params : Object.values(params ?? {});
  const invoke = (sql, params, method) => {
    const values = bind(params ?? []);
    const statement = native.prepare(sql);
    return Array.isArray(params)
      ? statement[method](...values)
      : statement[method](values[0]);
  };
  const connection = {
    execAsync: async (sql) => native.exec(sql),
    runAsync: async (sql, params = []) => {
      const value = invoke(sql, params, "run");
      return { ...value, lastInsertRowId: value.lastInsertRowid };
    },
    getFirstAsync: async (sql, params = []) =>
      invoke(sql, params, "get") ?? null,
    getAllAsync: async (sql, params = []) => invoke(sql, params, "all"),
  };
  const db = {
    file: filename,
    native,
    ...connection,
    transaction(work) {
      const tx = {
        ...connection,
        async save(table, values) {
          const columns = Object.keys(values),
            marks = columns.map(() => "?").join(",");
          const statement = native.prepare(
            `INSERT INTO ${table} (${columns.join(",")}) VALUES (${marks})
             ON CONFLICT(ID) DO UPDATE SET ${columns
               .map((column) => `${column}=excluded.${column}`)
               .join(",")}`,
          );
          statement.run(...columns.map((column) => values[column]));
          serial = serial.then(() => Promise.resolve());
          return values.ID;
        },
      };
      return work(tx);
    },
  };
  handles.push(db);
  return db;
}
const plan = (id, extra = {}) => ({ ID: id, NOME: "Região", SITUACAO: 1, ...extra });
async function fixture(user = {}) {
  const db = open();
  await initializeDatabase(db);
  const remote = {
    online: async () => false,
    authorized: async () => false,
    upload: async () => ({}),
    download: async () => ({ changes: [] }),
    confirm: async () => ({}),
  };
  const engine = new OfflineEngine({
    db,
    transport: remote,
    user: { id: 1, idCede: 1, permissions: { addVisits: true, reorderVisits: true }, ...user },
    uuid: randomUUID,
    now: () => 100000,
    random: () => 0.5,
  });
  return { db, engine };
}

test("planejamento excluído não aceita novas visitas", async () => {
  const { engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", plan(planId, { SITUACAO: 0 })),
  );
  const visits = new Visits(engine);
  await assert.rejects(
    () => visits.save(newVisit({ idPlanejamento: planId, nome: "Rua A" })),
    /disponível/,
  );
});

test("visita de um planejamento não pode migrar para outro", async () => {
  const { engine } = await fixture();
  const planA = randomUUID(),
    planB = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(planA)));
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(planB)));
  const visits = new Visits(engine);
  const id = await visits.save(
    newVisit({ idPlanejamento: planA, nome: "Rua A" }),
  );
  await assert.rejects(
    () => visits.save({ id, idPlanejamento: planB, nome: "Rua A" }),
    /outro planejamento/,
  );
});

test("valores inválidos são rejeitados antes de gravar", async () => {
  const { engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(planId)));
  const visits = new Visits(engine);
  await assert.rejects(
    () =>
      visits.save(
        newVisit({ idPlanejamento: planId, nome: "Rua A", numeroQuartos: -1 }),
      ),
    /quartos/i,
  );
  await assert.rejects(
    () =>
      visits.save(
        newVisit({
          idPlanejamento: planId,
          nome: "Rua A",
          itensInspecionados: [8],
        }),
      ),
    /depósito/i,
  );
  await assert.rejects(
    () =>
      visits.save(
        newVisit({
          idPlanejamento: planId,
          nome: "Rua A",
          contemAmostra: true,
          amostra: { numeroInicio: 10, numeroFinal: 5, quantidade: 3 },
        }),
      ),
    /final/i,
  );
  await assert.rejects(
    () =>
      visits.save(
        newVisit({
          idPlanejamento: planId,
          nome: "Rua A",
          contemAmostra: true,
          amostra: { numeroInicio: 1, numeroFinal: 2, quantidade: "abc" },
        }),
      ),
    /número inteiro/i,
  );
  await assert.rejects(
    () => visits.save(newVisit({ idPlanejamento: planId, nome: "Rua A", numeroQuartos: 2.5 })),
    /quartos/i,
  );
});

test("visita salva sem planejamento é recusada antes de qualquer leitura", async () => {
  const { engine } = await fixture();
  const visits = new Visits(engine);
  await assert.rejects(
    () => visits.save(newVisit({ nome: "Rua A" })),
    /planejamento/i,
  );
});
