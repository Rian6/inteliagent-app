import { visitStages, previousVisitPage, resumedPage, addressError } from '../src/data/visit-flow.ts';
import { getVisitOverview } from '../src/db/visitOverview.ts';
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync, backup } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { initializeDatabase, TABLES } from "../src/offline/schema.ts";
import { OfflineEngine } from "../src/offline/engine.ts";
import { AccountDatabases } from "../src/offline/accounts.ts";
import { OfflineSession, tokenExpiresAt } from "../src/offline/session.ts";
import { Visits, newVisit, VisitDrafts } from "../src/offline/visits.ts";
import { adaptDatabase } from "../src/offline/sqliteAdapter.ts";
import { lookupPostalAddress, formatPostalCode } from '../src/utils/postalAddress.ts';
import { routeMapHtml } from '../src/components/visitas/routeMapHtml.ts';
import { recordAppliedAdditiveMigrations } from '../src/offline/additiveMigrations.ts';

test('already-applied additive upgrades reconcile their journal without changing plans or pending operations', async()=>{
  const db=open();await initializeDatabase(db);
  db.native.exec("CREATE TABLE __drizzle_migrations (hash TEXT,created_at INTEGER); INSERT INTO __drizzle_migrations VALUES ('baseline',1); INSERT INTO PLANEJAMENTO(ID,NOME,ID_CIDADE,ID_CATEGORIA) VALUES ('legacy-plan','Preservado',1,77); INSERT INTO SYNC_OUTBOX(MUTATION_ID,GROUP_ID,AGGREGATE_KEY,TABLE_NAME,ENTITY_ID,PAYLOAD_JSON,CREATED_AT) VALUES ('pending','group','PLANEJAMENTO:legacy-plan','PLANEJAMENTO','legacy-plan','{}',1)");
  const journal={entries:[{when:1},{when:2},{when:3}]};
  await db.transaction(tx=>recordAppliedAdditiveMigrations(tx,journal));
  await db.transaction(tx=>recordAppliedAdditiveMigrations(tx,journal));
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM __drizzle_migrations')).n,3);
  assert.equal((await db.getFirstAsync('SELECT ID_CATEGORIA FROM PLANEJAMENTO')).ID_CATEGORIA,77);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM SYNC_OUTBOX')).n,1);
});

test('an unapplied planning upgrade is not recorded until both columns exist', async()=>{
  const db=open();const migration=readFileSync(new URL('../drizzle/0000_vengeful_namorita.sql',import.meta.url),'utf8');db.native.exec(migration.replaceAll('--> statement-breakpoint','\n'));
  db.native.exec('CREATE TABLE __drizzle_migrations (hash TEXT,created_at INTEGER); ALTER TABLE PLANEJAMENTO ADD COLUMN CICLO INTEGER');
  const journal={entries:[{when:1},{when:2},{when:3}]};
  await recordAppliedAdditiveMigrations(db,journal);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM __drizzle_migrations')).n,0);
  db.native.exec('ALTER TABLE PLANEJAMENTO ADD COLUMN CATALOGO_VERSAO TEXT');
  await recordAppliedAdditiveMigrations(db,journal);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM __drizzle_migrations')).n,0);
  db.native.exec(readFileSync(new URL('../drizzle/0001_shiny_colonel_america.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','\n'));
  await recordAppliedAdditiveMigrations(db,journal);
  assert.equal((await db.getFirstAsync('SELECT MAX(created_at) AS n FROM __drizzle_migrations')).n,3);
});

test('report columns cannot skip unapplied earlier upgrades during journal recovery',async()=>{
 const db=open();db.native.exec(readFileSync(new URL('../drizzle/0000_vengeful_namorita.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','\n'));
 db.native.exec('CREATE TABLE __drizzle_migrations (hash TEXT,created_at INTEGER); ALTER TABLE PLANEJAMENTO ADD COLUMN BOLETIM_JSON TEXT; ALTER TABLE VISITA ADD COLUMN BOLETIM_JSON TEXT');
 const journal={entries:[{when:1},{when:2},{when:3},{when:4}]};
 await recordAppliedAdditiveMigrations(db,journal);
 assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM __drizzle_migrations')).n,0);
 db.native.exec(readFileSync(new URL('../drizzle/0001_shiny_colonel_america.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','\n'));
 await recordAppliedAdditiveMigrations(db,journal);
 assert.equal((await db.getFirstAsync('SELECT MAX(created_at) AS n FROM __drizzle_migrations')).n,2);
});

test('generated entity migration creates the offline schema and UUID defaults', async () => {
  const db = open();
  const journal=JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
  for(const entry of journal.entries) db.native.exec(readFileSync(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','\n'));
  await initializeDatabase(db, { legacy: false });
  const tables = db.native.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name);
  for (const table of [...TABLES, 'USUARIO', 'SYNC_META', 'SYNC_OUTBOX', 'VISITA_DRAFTS']) assert.ok(tables.includes(table), table);
  db.native.exec("INSERT INTO CIDADE(NOME) VALUES ('Teste')");
  const generated = db.native.prepare("SELECT ID FROM CIDADE WHERE NOME='Teste'").get().ID;
  assert.match(generated, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.ok(db.native.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='IDX_OUTBOX_READY'").get());
  const planningColumns=db.native.prepare('PRAGMA table_info(PLANEJAMENTO)').all().map(row=>row.name);
  assert.ok(planningColumns.includes('CICLO')&&planningColumns.includes('CATALOGO_VERSAO'));
});

const root = mkdtempSync(join(tmpdir(), "inteliagent-offline-"));
const handles = [];
after(() => {
  for (const db of handles) {
    try {
      db.native.close();
    } catch {}
  }
  assert.ok(
    resolve(root).startsWith(resolve(tmpdir()) + sep + "inteliagent-offline-"),
  );
  rmSync(root, { recursive: true, force: true });
});
function open(name = randomUUID() + ".db") {
  const file = join(root, name),
    native = new DatabaseSync(file);
  let serial = Promise.resolve();
  const bind = (params) =>
    Array.isArray(params)
      ? params.map((value) =>
          typeof value === "boolean" ? Number(value) : value,
        )
      : Object.fromEntries(
          Object.entries(params).map(([key, value]) => [
            key,
            typeof value === "boolean" ? Number(value) : value,
          ]),
        );
  const invoke = (sql, params, method) => {
    const values = bind(params ?? []),
      statement = native.prepare(sql);
    return Array.isArray(values)
      ? statement[method](...values)
      : statement[method](values);
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
    file,
    native,
    ...connection,
    transaction(work) {
      const result = serial.then(async () => {
        native.exec("BEGIN IMMEDIATE");
        try {
          const value = await work(connection);
          native.exec("COMMIT");
          return value;
        } catch (error) {
          native.exec("ROLLBACK");
          throw error;
        }
      });
      serial = result.catch(() => {});
      return result;
    },
  };
  handles.push(db);
  return db;
}
class Remote {
  constructor() {
    this.records = new Map();
    this.ledger = new Map();
    this.writes = 0;
    this.available = true;
    this.auth = true;
    this.afterCommit = null;
    this.failAfterCommit = false;
    this.rejected = new Set();
    this.pages = null;
    this.confirmed = 0;
  }
  online = async () => this.available;
  authorized = async () => this.auth;
  upload = async (batch) => {
    const applied = [],
      conflicts = [];
    for (const item of batch) {
      if (this.rejected.has(item.id)) {
        const error = new Error("validation");
        error.status = 400;
        throw error;
      }
      if (this.ledger.has(item.mutationId)) continue;
      const current = this.records.get(item.tabela + ":" + item.id);
      if ((current?.__version ?? 0) !== item.baseVersion)
        conflicts.push({
          mutationId: item.mutationId,
          serverVersion: current?.__version ?? 0,
          serverValues: current
            ? Object.fromEntries(
                Object.entries(current).filter(([key]) => key !== "__version"),
              )
            : { ID: item.id, SITUACAO: 0 },
        });
    }
    if (conflicts.length) {
      const error = new Error("conflict");
      error.status = 409;
      error.data = { conflicts };
      throw error;
    }
    for (const item of batch) {
      if (this.rejected.has(item.id)) {
        const error = new Error("validation");
        error.status = 400;
        throw error;
      }
      const known = this.ledger.get(item.mutationId);
      if (known) {
        applied.push(known);
        continue;
      }
      const key = item.tabela + ":" + item.id,
        current = this.records.get(key);
      if ((current?.__version ?? 0) !== item.baseVersion) {
        conflicts.push({
          mutationId: item.mutationId,
          serverVersion: current?.__version ?? 0,
          serverValues: current
            ? Object.fromEntries(
                Object.entries(current).filter(([key]) => key !== "__version"),
              )
            : { ID: item.id },
        });
        continue;
      }
      const version = (current?.__version ?? 0) + 1;
      this.records.set(key, { ...item.values, __version: version });
      this.writes++;
      const ack = { mutationId: item.mutationId, version };
      this.ledger.set(item.mutationId, ack);
      applied.push(ack);
    }
    if (this.afterCommit) {
      const hook = this.afterCommit;
      this.afterCommit = null;
      await hook();
    }
    if (this.failAfterCommit) {
      this.failAfterCommit = false;
      throw new Error("response lost");
    }
    return { applied, conflicts };
  };
  download = async ({ offset }) =>
    this.pages
      ? this.pages(offset)
      : {
          downloadId: "snapshot",
          nextOffset: offset + 500,
          consumerLoadsList: TABLES.map((table) => ({
            tableName: table,
            hasMore: false,
            rows: [...this.records]
              .filter(([key]) => key.startsWith(table + ":"))
              .map(([, value]) => value),
          })),
        };
  confirm = async () => {
    this.confirmed++;
  };
}
async function fixture(options = {}) {
  const db = options.db || open();
  await initializeDatabase(db);
  const remote = options.remote || new Remote();
  let clock = options.clock ?? 100000;
  const engine = new OfflineEngine({
    db,
    transport: remote,
    user: { id: 1, idCede: 1, permissions: {addVisits:true,reorderVisits:true} },
    uuid: randomUUID,
    now: () => clock,
    random: () => 0.5,
    ...options,
  });
  return {
    db,
    remote,
    engine,
    advance: (value) => {
      clock += value;
    },
  };
}
const plan = (id) => ({ ID: id, NOME: "Região", SITUACAO: 1 });

test('visit creation permission is independent, appends new visits and preserves fieldwork access after revocation', async () => {
 const {db,engine}=await fixture();const planId=randomUUID();
 await engine.transaction(tx=>tx.save('PLANEJAMENTO',plan(planId)));
 const visits=new Visits(engine);
 engine.user.permissions={addVisits:false,reorderVisits:true};
 await assert.rejects(()=>visits.save(newVisit({idPlanejamento:planId,nome:'Rua bloqueada'})),/permissão para adicionar/);
 assert.equal((await db.getAllAsync('SELECT * FROM VISITA')).length,0);
 engine.user.permissions={addVisits:true,reorderVisits:false};
 const first=await visits.save(newVisit({idPlanejamento:planId,nome:'Rua primeira',sequencia:50}));
 const second=await visits.save(newVisit({idPlanejamento:planId,nome:'Rua segunda',sequencia:1}));
 assert.deepEqual((await db.getAllAsync('SELECT SEQUENCIA FROM VISITA ORDER BY SEQUENCIA')).map(r=>r.SEQUENCIA),[1,2]);
 engine.user.permissions={addVisits:false,reorderVisits:false};
 await visits.save({...await visits.load(first),nome:'Rua primeira atualizada',sequencia:999});
 assert.equal((await db.getFirstAsync('SELECT SEQUENCIA FROM VISITA WHERE ID=?',[first])).SEQUENCIA,1);
 await assert.rejects(()=>visits.reorder(planId,[second,first]),/permissão para alterar/);
});

test('offline route reordering is atomic, preserves visit data and records durable mutations',async()=>{
 const {db,engine}=await fixture();const planId=randomUUID();
 await engine.transaction(tx=>tx.save('PLANEJAMENTO',plan(planId)));
 const visits=new Visits(engine),ids=[];
 for(const nome of ['Primeira','Segunda','Terceira'])ids.push(await visits.save(newVisit({idPlanejamento:planId,nome,numero:'123',boletim:{quarteirao:'12'}})));
 const before=await db.getAllAsync('SELECT * FROM VISITA ORDER BY ID');
 await assert.rejects(()=>visits.reorder(planId,[ids[0],ids[0],ids[2]]),/lista de visitas mudou/);
 assert.deepEqual(await db.getAllAsync('SELECT * FROM VISITA ORDER BY ID'),before);
 engine.user.permissions={addVisits:false,reorderVisits:true};
 await visits.reorder(planId,[...ids].reverse());
 assert.deepEqual((await db.getAllAsync('SELECT ID FROM VISITA ORDER BY SEQUENCIA')).map(r=>r.ID),[...ids].reverse());
 const after=await db.getAllAsync('SELECT * FROM VISITA ORDER BY ID');
 assert.deepEqual(after.map(({SEQUENCIA,...r})=>r),before.map(({SEQUENCIA,...r})=>r));
 const outbox=await db.getAllAsync("SELECT PAYLOAD_JSON FROM SYNC_OUTBOX WHERE TABLE_NAME='VISITA'");
 assert.equal(JSON.parse(outbox.find(r=>JSON.parse(r.PAYLOAD_JSON).ID===ids[0]).PAYLOAD_JSON).SEQUENCIA,3);
});

test('map markers keep the list order when a visit has no coordinates and escape address markup', () => {
  const html = routeMapHtml([
    { ID: 'a', NOME: 'Primeira', LATITUDE: -24.95, LONGITUDE: -53.45 },
    { ID: 'b', NOME: 'Sem posição', LATITUDE: null, LONGITUDE: null },
    { ID: 'c', NOME: '</script><script>injected()</script>', LATITUDE: -24.96, LONGITUDE: -53.46 },
  ]);
  const points = JSON.parse(html.match(/const points=(.*?);const map=/)[1]);
  assert.deepEqual(points.map(point => [point.id, point.index]), [['a', 1], ['c', 3]]);
  assert.equal(points[1].title, '</script><script>injected()</script>');
  assert.equal(html.includes('<script>injected()'), false);
});

test('CEP lookup validates inputs and keeps missing street names available for manual entry', async () => {
  let requested;
  const request = async url => { requested = url; return { ok: true, json: async () => ({ logradouro: 'Rua de teste', bairro: 'Centro', localidade: 'Cascavel', uf: 'PR' }) }; };
  assert.equal(formatPostalCode('85801000'), '85801-000');
  assert.equal((await lookupPostalAddress('85801-000', undefined, request)).street, 'Rua de teste');
  assert.equal(requested, 'https://viacep.com.br/ws/85801000/json/');
  await assert.rejects(lookupPostalAddress('123', undefined, request), /8 dígitos/);
  await assert.rejects(lookupPostalAddress('99999999', undefined, async () => ({ ok: true, json: async () => ({ erro: true }) })), /CEP não encontrado/);
  const general = await lookupPostalAddress('85801000', undefined, async () => ({ ok: true, json: async () => ({ localidade: 'Cascavel', uf: 'PR' }) }));
  assert.equal(general.street, '');
  assert.equal(general.city, 'Cascavel');
});

test('original N/R/F visit states retain date, coordinates and sequence when edited', async () => {
  const { db, engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction(tx => tx.save('PLANEJAMENTO', plan(planId)));
  const repository = new Visits(engine);
  const id = await repository.save(newVisit({ idPlanejamento: planId, nome: 'Rua original', numero: '42', situacaoVisita: 'N', primeiraVisita: '2026-10-29 10:30:00', segundaVisita: '2026-11-02 08:00:00', latitude: -24.9555, longitude: -53.4552 }));
  const saved = await repository.load(id);
  assert.equal(saved.situacaoVisita, 3);
  assert.equal(saved.sequencia, 1);
  assert.equal(saved.latitude, -24.9555);
  assert.equal(saved.segundaVisita, '2026-11-02 08:00:00');
  await repository.save({ ...saved, nome: 'Rua editada', situacaoVisita: 'R' });
  const edited = await repository.load(id);
  assert.equal(edited.situacaoVisita, 2);
  assert.equal(edited.sequencia, 1);
  assert.equal(edited.primeiraVisita, '2026-10-29 10:30:00');
  assert.equal(edited.longitude, -53.4552);
  const next = await repository.save({ idPlanejamento: planId, nome: 'Imóvel fechado', situacaoVisita: 'F' });
  assert.equal((await repository.load(next)).situacaoVisita, 1);
  assert.equal((await repository.load(next)).sequencia, 2);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM VISITA')).n, 2);
});

test('inspection quantities, return visits, property details and sample photos survive offline reopen and edits', async () => {
  const { db, engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction(tx => tx.save('PLANEJAMENTO', plan(planId)));
  const repository = new Visits(engine);
  const photo = 'data:image/jpeg;base64,/9j/2Q==';
  const id = await repository.save({idPlanejamento:planId,nome:'Ficha completa',tipoVisita:'R',lado:'E',tipoImovel:'Residencial',segundaVisita:'2026-11-02 08:00:00',itensInspecionados:[1,3],depositosInspecionados:{1:12,3:4},contemAmostra:true,amostra:{numeroInicio:1,numeroFinal:2,quantidade:2,imagens:[photo]}});
  let saved = await repository.load(id);
  assert.equal(saved.tipoVisita,'R'); assert.equal(saved.lado,'E'); assert.equal(saved.tipoImovel,'Residencial');
  assert.deepEqual(saved.depositosInspecionados,{1:12,3:4}); assert.deepEqual(saved.amostra.imagens,[photo]);
  await repository.save({...saved,segundaVisita:null,depositosInspecionados:{1:15,3:4}});
  saved = await repository.load(id);
  assert.equal(saved.segundaVisita,null); assert.equal(saved.depositosInspecionados[1],15);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM INSPECAO WHERE ID_VISITA=?',[id])).n,2);
  await assert.rejects(repository.save({...saved,amostra:{...saved.amostra,imagens:['https://external.invalid/image.jpg']}}),/JPEG/);
  await assert.rejects(repository.save({...saved,depositosInspecionados:{1:-1}}),/Depósitos/);
  assert.deepEqual((await repository.load(id)).amostra.imagens,[photo]);
});

test('focal and perifocal treatments survive save, reopen and edit without overwriting or duplicating each other', async () => {
  const { db, engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction(tx => tx.save('PLANEJAMENTO', plan(planId)));
  const repository = new Visits(engine);
  const id = await repository.save({ idPlanejamento: planId, nome: 'Imóvel com dois tratamentos', contemTratamento: true, tratamento: { depositosEliminados: 2, imoveisTratados: 1, focal: { ativo: true, tipo: 'L1', quantidadeCarga: 3, quantidadeTratamento: 4 }, perifocal: { ativo: true, tipo: 'A1', quantidadeCarga: 5, quantidadeTratamento: 6 } } });
  const saved = await repository.load(id);
  assert.equal(saved.tratamento.focal.tipo, 'L1');
  assert.equal(saved.tratamento.perifocal.quantidadeCarga, 5);
  assert.equal(saved.tratamento.depositosEliminados, 2);
  const before = await db.getAllAsync('SELECT ID FROM TRATAMENTO WHERE ID_VISITA=?', [id]);
  await repository.save({ ...saved, tratamento: { ...saved.tratamento, focal: { ...saved.tratamento.focal, quantidadeCarga: 8 } } });
  assert.deepEqual(await db.getAllAsync('SELECT ID FROM TRATAMENTO WHERE ID_VISITA=?', [id]), before);
  const edited = await repository.load(id);
  assert.equal(edited.tratamento.focal.quantidadeCarga, 8);
  assert.equal(edited.tratamento.perifocal.tipo, 'A1');
  await repository.save({ ...edited, tratamento: { ...edited.tratamento, perifocal: { ...edited.tratamento.perifocal, ativo: false } } });
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM TRATAMENTO WHERE ID_VISITA=? AND SITUACAO<>0', [id])).n, 1);
});

test('turning off every chemical modality does not resurrect an old treatment and retains elimination totals', async () => {
  const { db, engine } = await fixture();
  const planId = randomUUID();
  await engine.transaction(tx => tx.save('PLANEJAMENTO', plan(planId)));
  const repository = new Visits(engine);
  const id = await repository.save({ idPlanejamento: planId, nome: 'Sem produto químico', contemTratamento: true, tratamento: { depositosEliminados: 2, focal: { ativo: true, tipo: 'L1', quantidadeCarga: 3 } } });
  const saved = await repository.load(id);
  await repository.save({ ...saved, tratamento: { ...saved.tratamento, focal: { ...saved.tratamento.focal, ativo: false } } });
  const rows = await db.getAllAsync('SELECT * FROM TRATAMENTO WHERE ID_VISITA=? AND SITUACAO<>0', [id]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].TIPO, '');
  assert.equal(rows[0].DEPOSITOS_ELIMINADOS, 2);
  const cleared = await repository.load(id);
  await repository.save({ ...cleared, tratamento: { ...cleared.tratamento, depositosEliminados: 0, focal: { ativo: false } } });
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS n FROM TRATAMENTO WHERE ID_VISITA=? AND SITUACAO<>0', [id])).n, 0);
  assert.equal((await repository.load(id)).contemTratamento, false);
});

test("native Expo adapter returns callback values and serializes writes when the native transaction returns void", async () => {
  const events = [];
  const native = {
    runAsync: async () => events.push("write"),
    withExclusiveTransactionAsync: async (callback) => {
      events.push("begin");
      await callback({
        runAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          events.push("transaction");
        },
      });
      events.push("commit");
    },
  };
  const db = adaptDatabase(native);
  const first = db.transaction(async (tx) => {
    await tx.runAsync("sql");
    return "saved-id";
  });
  const second = db.runAsync("sql");
  assert.equal(await first, "saved-id");
  await second;
  assert.deepEqual(events, ["begin", "transaction", "commit", "write"]);
});

test("visit repository persists a recoverable draft then commits one aggregate without duplicate children", async () => {
  const { db, engine } = await fixture();
  const planId = randomUUID(),
    id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(planId)));
  const repository = new Visits(engine),
    visit = newVisit({
      id,
      idPlanejamento: planId,
      nome: "Rua das Flores",
      numero: "12",
      itensInspecionados: [1, 2],
      contemAmostra: true,
      amostra: { numeroInicio: 1, numeroFinal: 2, quantidade: 2 },
      contemTratamento: true,
      tratamento: { imoveisTratados: 1 },
    });
  await repository.drafts.save(visit);
  assert.equal(
    (await new VisitDrafts(db).list())[0].visit.nome,
    "Rua das Flores",
  );
  assert.equal((await repository.load(id)).numero, "12");
  await repository.save(visit);
  assert.equal(await repository.drafts.get(id), null);
  assert.equal(
    (
      await db.getFirstAsync(
        "SELECT COUNT(DISTINCT GROUP_ID) AS n FROM SYNC_OUTBOX WHERE AGGREGATE_KEY=?",
        [`VISITA:${id}`],
      )
    ).n,
    1,
  );
  await repository.save({
    ...visit,
    itensInspecionados: [2],
    contemAmostra: false,
  });
  assert.equal(
    (
      await db.getFirstAsync(
        "SELECT COUNT(*) AS n FROM TRATAMENTO WHERE ID_VISITA=?",
        [id],
      )
    ).n,
    1,
  );
  assert.equal(
    (
      await db.getFirstAsync(
        "SELECT COUNT(*) AS n FROM INSPECAO WHERE ID_VISITA=? AND SITUACAO=1",
        [id],
      )
    ).n,
    1,
  );
  assert.equal(
    (
      await db.getFirstAsync("SELECT SITUACAO FROM AMOSTRA WHERE ID_VISITA=?", [
        id,
      ])
    ).SITUACAO,
    0,
  );
  assert.equal((await repository.load(id)).segundaVisita, null);
});

test("failed visit validation preserves its draft and cannot enqueue partial child records", async () => {
  const { db, engine } = await fixture();
  const visit = newVisit({
      id: randomUUID(),
      idPlanejamento: randomUUID(),
      nome: "Casa",
    }),
    repository = new Visits(engine);
  await repository.drafts.save(visit);
  await assert.rejects(repository.save(visit), /Planejamento/);
  assert.equal((await engine.status()).pending, 0);
  assert.ok(await repository.drafts.get(visit.id));
  assert.equal(
    (await db.getFirstAsync("SELECT COUNT(*) AS n FROM VISITA")).n,
    0,
  );
});

test("legacy SQL adapter returns the actual UUID and commits its durable operation", async () => {
  const { db, engine } = await fixture();
  const id = await engine.transaction((tx) =>
    tx.execute(
      "INSERT INTO PLANEJAMENTO (NOME,SITUACAO) VALUES (?,?)",
      ["Casa", 1],
      "PLANEJAMENTO",
    ),
  );
  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.equal(
    (await db.getFirstAsync("SELECT ENTITY_ID FROM SYNC_OUTBOX")).ENTITY_ID,
    id,
  );
});

test("a conflict rolls back the complete visit aggregate on the remote side", async () => {
  const { engine, remote } = await fixture();
  const id = randomUUID(),
    child = randomUUID();
  remote.records.set(`VISITA:${id}`, {
    ID: id,
    NOME: "Outra equipe",
    SITUACAO: 1,
    __version: 2,
  });
  await engine.transaction(
    async (tx) => {
      await tx.save("VISITA", { ID: id, NOME: "Minha edição", SITUACAO: 1 });
      await tx.save("INSPECAO", {
        ID: child,
        ID_VISITA: id,
        TIPO: 1,
        SITUACAO: 1,
      });
    },
    { aggregateKey: `VISITA:${id}` },
  );
  await engine.sync();
  assert.equal((await engine.status()).conflicts, 2);
  assert.equal(remote.records.has(`INSPECAO:${child}`), false);
  const problem = (await engine.problems())[0];
  await engine.resolve(problem.MUTATION_ID, "local");
  await engine.sync();
  assert.equal(remote.records.get(`VISITA:${id}`).NOME, "Minha edição");
  assert.ok(remote.records.has(`INSPECAO:${child}`));
});

test("invalid acknowledgement rolls back all local acknowledgements and retries immutable operations", async () => {
  const { db, engine, remote, advance } = await fixture();
  const id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(id)));
  const original = remote.upload;
  remote.upload = async (batch) => {
    await original(batch);
    return { applied: [] };
  };
  await assert.rejects(engine.sync());
  assert.equal((await engine.status()).pending, 1);
  assert.equal(
    (await db.getFirstAsync("SELECT STATE FROM SYNC_OUTBOX")).STATE,
    "pending",
  );
  advance(5000);
  remote.upload = original;
  await engine.sync();
  assert.equal(remote.writes, 1);
});

test("expired server download resumes from a new snapshot without losing local writes", async () => {
  const { db, engine, remote } = await fixture();
  let calls = 0;
  await db.runAsync("INSERT INTO SYNC_META(KEY,VALUE) VALUES ('download',?)", [
    JSON.stringify({
      offset: 500,
      downloadId: "expired",
      completed: [],
      startedAt: 100000,
    }),
  ]);
  const download = remote.download;
  remote.download = async (args) => {
    calls++;
    if (args.downloadId === "expired") {
      const error = new Error("expired");
      error.status = 400;
      throw error;
    }
    assert.equal(args.offset, 0);
    return download(args);
  };
  await engine.sync();
  assert.equal(calls, 2);
  assert.equal(remote.confirmed, 1);
});

test("offline save commits locally without waiting for the network and coalesces unattempted edits", async () => {
  const { db, engine, remote } = await fixture();
  remote.available = false;
  const id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(id)));
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ID: id, NOME: "Última edição" }),
  );
  assert.equal(
    (await db.getFirstAsync("SELECT NOME FROM PLANEJAMENTO WHERE ID=?", [id]))
      .NOME,
    "Última edição",
  );
  assert.equal((await engine.status()).pending, 1);
  assert.equal(remote.writes, 0);
  assert.deepEqual(await engine.sync(), { offline: true });
});
test("a complete visit and all of its outbox entries roll back together", async () => {
  const { db, engine } = await fixture();
  const id = randomUUID();
  await assert.rejects(
    engine.transaction(async (tx) => {
      await tx.save("VISITA", { ID: id, NOME: "Casa", SITUACAO: 1 });
      await tx.save("INSPECAO", { ID: randomUUID(), ID_VISITA: id, TIPO: 1 });
      throw new Error("disk failure");
    }),
  );
  assert.equal(
    (await db.getFirstAsync("SELECT COUNT(*) AS n FROM VISITA")).n,
    0,
  );
  assert.equal((await engine.status()).pending, 0);
});
test("lost acknowledgement is retried with the same operation after closing and reopening SQLite", async () => {
  const { db, engine, remote, advance } = await fixture();
  const id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(id)));
  remote.failAfterCommit = true;
  await assert.rejects(engine.sync());
  assert.equal(remote.writes, 1);
  const before = await db.getFirstAsync(
    "SELECT MUTATION_ID,PAYLOAD_JSON FROM SYNC_OUTBOX",
  );
  engine.dispose();
  db.native.close();
  const reopened = open(db.file.slice(root.length + 1));
  const fresh = await fixture({ db: reopened, remote, clock: 200000 });
  const after = await reopened.getFirstAsync(
    "SELECT MUTATION_ID,PAYLOAD_JSON FROM SYNC_OUTBOX",
  );
  assert.deepEqual({ ...after }, { ...before });
  await fresh.engine.sync();
  assert.equal(remote.writes, 1);
  assert.equal((await fresh.engine.status()).pending, 0);
});
test("editing during an in-flight request creates a dependent immutable operation", async () => {
  const { db, engine, remote } = await fixture();
  const id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(id)));
  remote.afterCommit = () =>
    engine.transaction((tx) =>
      tx.save("PLANEJAMENTO", { ID: id, NOME: "Editado durante envio" }),
    );
  await engine.sync();
  assert.equal(remote.writes, 2);
  assert.equal(
    remote.records.get("PLANEJAMENTO:" + id).NOME,
    "Editado durante envio",
  );
  assert.equal((await engine.status()).pending, 0);
  assert.equal(
    (await db.getFirstAsync("SELECT SERVER_VERSION FROM SYNC_ENTITIES"))
      .SERVER_VERSION,
    2,
  );
});
test("outbox drains more than one server batch without losing records", async () => {
  const { engine, remote } = await fixture();
  for (let n = 0; n < 605; n++)
    await engine.transaction((tx) =>
      tx.save("PLANEJAMENTO", plan(randomUUID())),
    );
  await engine.sync();
  assert.equal(remote.writes, 605);
  assert.equal((await engine.status()).pending, 0);
});
test("concurrent sync triggers share one run", async () => {
  const { engine, remote } = await fixture();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(randomUUID())));
  const first = engine.sync(),
    second = engine.sync();
  assert.equal(first, second);
  await first;
  assert.equal(remote.writes, 1);
});
test("a conflict preserves the local edit until the user chooses a resolution", async () => {
  const { db, engine, remote } = await fixture();
  const id = randomUUID();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(id)));
  await engine.sync();
  remote.records.set("PLANEJAMENTO:" + id, {
    ...plan(id),
    NOME: "Outro dispositivo",
    __version: 2,
  });
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ID: id, NOME: "Minha edição" }),
  );
  await engine.sync();
  assert.equal((await engine.status()).conflicts, 1);
  assert.equal(
    (await db.getFirstAsync("SELECT NOME FROM PLANEJAMENTO")).NOME,
    "Minha edição",
  );
  const [conflict] = await engine.problems();
  await engine.resolve(conflict.MUTATION_ID, "local");
  await engine.sync();
  assert.equal(remote.records.get("PLANEJAMENTO:" + id).NOME, "Minha edição");
  assert.equal((await engine.status()).conflicts, 0);
});
test("choosing the server version explicitly replaces local conflicting changes", async () => {
  const { db, engine, remote } = await fixture();
  const id = randomUUID();
  remote.records.set("PLANEJAMENTO:" + id, {
    ...plan(id),
    NOME: "Servidor",
    __version: 3,
  });
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ...plan(id), NOME: "Local" }),
  );
  await engine.sync();
  const [conflict] = await engine.problems();
  await engine.resolve(conflict.MUTATION_ID, "server");
  assert.equal(
    (await db.getFirstAsync("SELECT NOME FROM PLANEJAMENTO")).NOME,
    "Servidor",
  );
  assert.equal((await engine.status()).pending, 0);
});
test("one rejected record does not block independent valid records", async () => {
  const { engine, remote } = await fixture();
  const invalid = randomUUID();
  remote.rejected.add(invalid);
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(invalid)));
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(randomUUID())));
  await engine.sync();
  assert.equal((await engine.status()).rejected, 1);
  assert.equal(remote.writes, 1);
});
test("expired server authorization never deletes pending local work", async () => {
  const { engine, remote } = await fixture();
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(randomUUID())));
  remote.auth = false;
  await assert.rejects(
    engine.sync(),
    (error) => error.code === "AUTH_REQUIRED",
  );
  assert.equal((await engine.status()).pending, 1);
});
test("pending local data is not overwritten by a download", async () => {
  const { db, engine, remote } = await fixture();
  const id = randomUUID();
  remote.records.set("PLANEJAMENTO:" + id, {
    ...plan(id),
    NOME: "Remoto",
    __version: 2,
  });
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ...plan(id), NOME: "Local" }),
  );
  await engine.pull();
  assert.equal(
    (await db.getFirstAsync("SELECT NOME FROM PLANEJAMENTO")).NOME,
    "Local",
  );
  assert.equal((await engine.status()).pending, 1);
});
test("invalid download rolls back its entire page and does not acknowledge it", async () => {
  const { db, engine, remote } = await fixture();
  remote.pages = () => ({
    downloadId: "s",
    nextOffset: 500,
    consumerLoadsList: [
      {
        tableName: "PLANEJAMENTO",
        hasMore: false,
        rows: [
          { ...plan(randomUUID()), __version: 1 },
          { ...plan(randomUUID()), __version: 0 },
        ],
      },
    ],
  });
  await assert.rejects(engine.pull());
  assert.equal(
    (await db.getFirstAsync("SELECT COUNT(*) AS n FROM PLANEJAMENTO")).n,
    0,
  );
  assert.equal(remote.confirmed, 0);
});
test("older snapshots cannot roll back an acknowledged newer version", async () => {
  const { db, engine, remote } = await fixture();
  const id = randomUUID();
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ...plan(id), NOME: "Nova" }),
  );
  await engine.sync();
  await engine.transaction((tx) =>
    tx.save("PLANEJAMENTO", { ID: id, NOME: "Mais nova" }),
  );
  await engine.sync();
  remote.records.set("PLANEJAMENTO:" + id, {
    ...plan(id),
    NOME: "Antiga",
    __version: 1,
  });
  await engine.pull();
  assert.equal(
    (await db.getFirstAsync("SELECT NOME FROM PLANEJAMENTO")).NOME,
    "Mais nova",
  );
});
test("account and sede isolation preserve the previous account outbox", async () => {
  const manager = new AccountDatabases({
    open: async (name) => open("account-" + name),
    backup: async (source, destination) =>
      backup(source.native, destination.file),
  });
  const first = await manager.activate({ id: 1, idCede: 1, nome: "A" }),
    engine = (await fixture({ db: first })).engine;
  await engine.transaction((tx) => tx.save("PLANEJAMENTO", plan(randomUUID())));
  const second = await manager.activate({ id: 2, idCede: 1, nome: "B" });
  assert.equal(
    (await second.getFirstAsync("SELECT COUNT(*) AS n FROM PLANEJAMENTO")).n,
    0,
  );
  assert.equal(
    (await first.getFirstAsync("SELECT COUNT(*) AS n FROM SYNC_OUTBOX")).n,
    1,
  );
  const otherSede = await manager.activate({ id: 1, idCede: 2, nome: "A" });
  assert.notEqual(otherSede.file, first.file);
});
test("legacy database is copied only to its owner and pending rows survive migration", async () => {
  const legacy = open("legacy.db");
  await initializeDatabase(legacy);
  await legacy.runAsync("INSERT INTO USUARIO(ID,ID_CEDE) VALUES(7,3)");
  const id = randomUUID();
  await legacy.runAsync("INSERT INTO PLANEJAMENTO(ID,NOME) VALUES(?,?)", [
    id,
    "Anterior",
  ]);
  await legacy.runAsync(
    "INSERT INTO TABLES_SINCRONYZE(TABELA,ID_REGISTRO) VALUES(?,?)",
    ["PLANEJAMENTO", id],
  );
  const manager = new AccountDatabases({
    open: async (name) =>
      name === "database.db" ? legacy : open("legacy-copy-" + name),
    backup: async (source, destination) =>
      backup(source.native, destination.file),
  });
  const migrated = await manager.activate({ id: 7, idCede: 3, nome: "Legado" });
  const { engine } = await fixture({ db: migrated });
  await engine.recoverLegacy();
  assert.equal((await engine.status()).pending, 1);
  assert.equal(
    (await migrated.getFirstAsync("SELECT NOME FROM PLANEJAMENTO")).NOME,
    "Anterior",
  );
  assert.equal(
    (await legacy.getFirstAsync("SELECT COUNT(*) AS n FROM TABLES_SINCRONYZE"))
      .n,
    1,
  );
});
test("offline session restores without network, expires, and detects clock rollback", async () => {
  const values = new Map();
  let now = 1000000;
  const session = new OfflineSession({
    store: {
      get: async (key) => values.get(key),
      set: async (key, value) => values.set(key, value),
      remove: async (key) => values.delete(key),
    },
    now: () => now,
    windowMs: 600000,
  });
  await session.save({
    id: 1,
    idCede: 1,
    senha: "never persist",
    token: "never persist",
      refreshToken: "never persist",
  });
  assert.equal((await session.restore()).id, 1);
  assert.ok(![...values.values()][0].includes("never persist"));
  now += 600001;
  assert.equal(await session.restore(), null);
  await session.save({ id: 1, idCede: 1 });
  now -= 400000;
  assert.equal(await session.restore(), null);
});
test("token expiry supports base64url and never assumes malformed tokens are valid", () => {
  const payload = Buffer.from(
    JSON.stringify({ exp: 123, sub: "usuário@exemplo.test" }),
  ).toString("base64url");
  assert.equal(tokenExpiresAt(`a.${payload}.c`), 123000);
  assert.equal(tokenExpiresAt("invalid"), 0);
});


test('visit list resumes drafts in their planning without duplicating completed records', async () => {
  const { engine, remote } = await fixture();
  await engine.transaction(tx => tx.save('PLANEJAMENTO',plan('plan')));
  await engine.transaction(tx => tx.save('PLANEJAMENTO', { ID:'other-plan',NOME:'Outra região',STATUS:2,SITUACAO:1 }));
  const visits = new Visits(engine);
  await visits.save(newVisit({ id:'existing',idPlanejamento:'plan',nome:'Rua original',numero:'12',situacaoVisita:3 }));
  await visits.save(newVisit({ id:'finished',idPlanejamento:'plan',nome:'Rua concluída',numero:'99',situacaoVisita:3 }));
  const drafts = new VisitDrafts(engine.db);
  await drafts.save(newVisit({ id:'existing',idPlanejamento:'plan',nome:'Rua corrigida',numero:'15' }));
  await drafts.save(newVisit({ id:'new-draft',idPlanejamento:'plan',nome:'Rua nova',numero:'8' }));
  await drafts.save(newVisit({ id:'other-draft',idPlanejamento:'other-plan',nome:'Outra rua' }));
  const rows = await getVisitOverview(engine.db,'plan');
  assert.equal(rows.length,3);
  assert.equal(rows.filter(row=>row.ID==='existing').length,1);
  assert.equal(rows.find(row=>row.ID==='existing').NOME,'Rua corrigida');
  assert.deepEqual(rows.map(row=>row.IN_PROGRESS),[1,1,0]);
  assert.equal((await getVisitOverview(engine.db,'plan','15')).length,1);
  assert.equal((await getVisitOverview(engine.db,'plan','',100,'draft')).length,2);
  assert.deepEqual((await getVisitOverview(engine.db,'plan','',100,'completed')).map(row=>row.ID),['finished']);
  assert.equal((await getVisitOverview(engine.db,'plan','',1)).length,1);
  assert.equal((await visits.load('existing')).nome,'Rua corrigida');
});

test('finishing a resumed form offline moves it to visits and uploads once when connectivity returns', async () => {
  const { engine, remote } = await fixture();
  await engine.transaction(tx => tx.save('PLANEJAMENTO',plan('plan')));
  remote.available=false;
  const visit=newVisit({ id:'resumed',idPlanejamento:'plan',nome:'Rua retomada',numero:'10',itensInspecionados:[1],depositosInspecionados:{1:2} });
  const repository=new Visits(engine);
  await repository.drafts.save(visit);
  assert.equal((await getVisitOverview(engine.db,'plan','',100,'draft')).length,1);
  await repository.save(await repository.load('resumed'));
  assert.equal((await getVisitOverview(engine.db,'plan','',100,'draft')).length,0);
  const rows=await getVisitOverview(engine.db,'plan');
  assert.equal(rows[0].IN_PROGRESS,0);
  assert.equal(rows[0].STATUS,3);
  await engine.sync();
  assert.ok((await engine.status()).pending>0);
  remote.available=true;
  await engine.sync();
  assert.equal((await engine.status()).pending,0);
  assert.equal(remote.records.get('VISITA:resumed').NOME,'Rua retomada');
  const writes=remote.writes;
  await engine.sync();
  assert.equal(remote.writes,writes);
});



test('visit flow skips clinical steps for closed or refused properties and guides open properties sequentially', () => {
  assert.deepEqual(visitStages(3).map(step=>step.page),['index','inspecao','amostra','tratamento','revisao']);
  for(const status of [1,2]) {
    assert.deepEqual(visitStages(status).map(step=>step.page),['index','revisao']);
    assert.equal(previousVisitPage('revisao',status),'index');
  }
  assert.equal(previousVisitPage('amostra',3),'inspecao');
  assert.equal(previousVisitPage('tratamento',3),'amostra');
  assert.equal(previousVisitPage('revisao',3),'tratamento');
  assert.equal(previousVisitPage('index',3),null);
  assert.ok(addressError({nome:'   '}));
});

test('draft restores its optional screen and data after reopening SQLite without sending an unfinished visit', async () => {
  const filename=randomUUID()+'.db';
  const {db,engine,remote}=await fixture({db:open(filename)});
  await engine.transaction(tx=>tx.save('PLANEJAMENTO',plan('resume-flow')));
  const repository=new Visits(engine);
  const draft=newVisit({id:'resume-screen',idPlanejamento:'resume-flow',nome:'Rua de campo',numero:'12',tipoImovel:'Residencial',boletim:{quarteirao:'12',ladoQuarteirao:'2',agenteNome:'Agente Teste'},__page:'amostra',__completed:['index','inspecao'],__inspectionAnswered:true,contemAmostra:true,amostra:{numeroInicio:10,numeroFinal:12,quantidade:3}});
  await repository.drafts.save(draft);
  db.native.close();
  const reopened=await fixture({db:open(filename),remote});
  const restored=await new Visits(reopened.engine).load(draft.id);
  assert.equal(resumedPage(restored),'amostra');
  assert.equal(restored.amostra.numeroInicio,10);
  assert.equal(restored.amostra.quantidade,3);
  assert.equal(resumedPage({...restored,situacaoVisita:1}),'revisao');
  assert.equal(resumedPage({...restored,nome:''}),'index');
  await reopened.engine.sync();
  assert.equal(remote.records.has('VISITA:resume-screen'),false);
});


test('report metadata survives draft, offline save, outbox and reopened visit',async()=>{
 const {db,engine}=await fixture();const planId=randomUUID();await engine.transaction(tx=>tx.save('PLANEJAMENTO',plan(planId)));
 const visits=new Visits(engine),boletim={quarteirao:'12',ladoQuarteirao:'2',horaEntrada:'08:30',agenteNome:'Agente de campo',focalGramas:'0,75',focal2:{tipo:'BTI',gramas:1.5,depositos:2}};
 const id=await visits.save(newVisit({idPlanejamento:planId,nome:'Rua Paran?',numero:'12',boletim}));
 assert.deepEqual((await visits.load(id)).boletim,boletim);
 const payloads=await db.getAllAsync("SELECT PAYLOAD_JSON FROM SYNC_OUTBOX WHERE TABLE_NAME='VISITA' AND ENTITY_ID=?",[id]);
 assert.deepEqual(JSON.parse(JSON.parse(payloads.at(-1).PAYLOAD_JSON).BOLETIM_JSON),boletim);
 const draft=new VisitDrafts(db);await draft.save({...await visits.load(id),boletim:{...boletim,sequenciaImovel:'3'}});
 assert.equal((await draft.get(id)).boletim.sequenciaImovel,'3');
});
