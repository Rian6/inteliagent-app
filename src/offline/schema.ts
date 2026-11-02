import { createSQLStatements } from "../db/migrations/createDatabase.ts";

export const TABLES = [
  "PLANEJAMENTO",
  "VISITA",
  "INSPECAO",
  "AMOSTRA",
  "TRATAMENTO",
];
export const tableName = (value) => {
  const name = String(value).toUpperCase();
  if (!TABLES.includes(name))
    throw new Error("Tabela de sincronização inválida");
  return name;
};
export const identifier = (value) => {
  if (!/^[A-Z][A-Z0-9_]*$/.test(value))
    throw new Error("Identificador inválido");
  return value;
};

export async function initializeDatabase(db, { legacy = true } = {}) {
  await db.execAsync(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;",
  );
  await db.transaction(async (tx) => {
    if (legacy) {
    for (const sql of createSQLStatements) await tx.execAsync(sql);
    const columns = new Set(
      (await tx.getAllAsync("PRAGMA table_info(VISITA)")).map((column) =>
        column.name.toUpperCase(),
      ),
    );
    for (const [name, type] of [
      ["CEP", "TEXT"],
      ["NOME", "TEXT"],
      ["NUMERO", "TEXT"],
      ["COMPLEMENTO", "TEXT"],
    ]) {
      if (!columns.has(name))
        await tx.execAsync(`ALTER TABLE VISITA ADD COLUMN ${name} ${type}`);
    }
    await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS SYNC_META (KEY TEXT PRIMARY KEY, VALUE TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS VISITA_DRAFTS (ID TEXT PRIMARY KEY, PLAN_ID TEXT, PAYLOAD_JSON TEXT NOT NULL, UPDATED_AT INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS SYNC_ENTITIES (
        TABLE_NAME TEXT NOT NULL, ENTITY_ID TEXT NOT NULL, SERVER_VERSION INTEGER NOT NULL,
        SNAPSHOT_JSON TEXT NOT NULL, PRIMARY KEY(TABLE_NAME, ENTITY_ID)
      );
      CREATE TABLE IF NOT EXISTS SYNC_OUTBOX (
        SEQUENCE INTEGER PRIMARY KEY AUTOINCREMENT, MUTATION_ID TEXT NOT NULL UNIQUE,
        GROUP_ID TEXT NOT NULL, AGGREGATE_KEY TEXT NOT NULL,
        TABLE_NAME TEXT NOT NULL, ENTITY_ID TEXT NOT NULL, PAYLOAD_JSON TEXT NOT NULL,
        BASE_VERSION INTEGER, DEPENDS_ON TEXT, STATE TEXT NOT NULL DEFAULT 'pending',
        ATTEMPTS INTEGER NOT NULL DEFAULT 0, NEXT_ATTEMPT_AT INTEGER NOT NULL DEFAULT 0,
        ERROR TEXT, SERVER_JSON TEXT, SERVER_VERSION INTEGER, CREATED_AT INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_OUTBOX_READY ON SYNC_OUTBOX(STATE,NEXT_ATTEMPT_AT,SEQUENCE);
      CREATE INDEX IF NOT EXISTS IDX_OUTBOX_ENTITY ON SYNC_OUTBOX(TABLE_NAME,ENTITY_ID,SEQUENCE);
      CREATE INDEX IF NOT EXISTS IDX_OUTBOX_DEPENDS ON SYNC_OUTBOX(DEPENDS_ON);
      CREATE INDEX IF NOT EXISTS IDX_VISITA_PLAN ON VISITA(ID_PLANEJAMENTO,SEQUENCIA);
      CREATE INDEX IF NOT EXISTS IDX_INSPECAO_VISITA ON INSPECAO(ID_VISITA);
      CREATE INDEX IF NOT EXISTS IDX_AMOSTRA_VISITA ON AMOSTRA(ID_VISITA);
      CREATE INDEX IF NOT EXISTS IDX_TRATAMENTO_VISITA ON TRATAMENTO(ID_VISITA);
      PRAGMA user_version=5;
    `);
    const outboxColumns = new Set(
      (await tx.getAllAsync("PRAGMA table_info(SYNC_OUTBOX)")).map(
        (column) => column.name,
      ),
    );
    if (!outboxColumns.has("GROUP_ID"))
      await tx.execAsync(
        "ALTER TABLE SYNC_OUTBOX ADD COLUMN GROUP_ID TEXT NOT NULL DEFAULT 'legacy'",
      );
    if (!outboxColumns.has("AGGREGATE_KEY"))
      await tx.execAsync(
        "ALTER TABLE SYNC_OUTBOX ADD COLUMN AGGREGATE_KEY TEXT NOT NULL DEFAULT 'legacy'",
      );
    await tx.runAsync(
      "UPDATE SYNC_OUTBOX SET GROUP_ID=MUTATION_ID,AGGREGATE_KEY=TABLE_NAME||':'||ENTITY_ID WHERE AGGREGATE_KEY='legacy'",
    );
    await tx.execAsync(
      "CREATE INDEX IF NOT EXISTS IDX_OUTBOX_GROUP ON SYNC_OUTBOX(GROUP_ID); CREATE INDEX IF NOT EXISTS IDX_OUTBOX_AGGREGATE ON SYNC_OUTBOX(AGGREGATE_KEY);",
    );
    }
    // Also upgrade imported legacy databases; never recreate account data.
    if (legacy) for (const [table, name] of [['VISITA','LADO'], ['VISITA','TIPO_IMOVEL'], ['AMOSTRA','IMAGENS_JSON'], ['PLANEJAMENTO','CATALOGO_VERSAO'], ['PLANEJAMENTO','CICLO'], ['PLANEJAMENTO','BOLETIM_JSON'], ['VISITA','BOLETIM_JSON']]) {
      const columns = await tx.getAllAsync(`PRAGMA table_info(${table})`);
      if (!columns.some(column => column.name.toUpperCase() === name)) await tx.execAsync(`ALTER TABLE ${table} ADD COLUMN ${name} ${name==='CICLO'?'INTEGER':'TEXT'}`);
    }
    await tx.execAsync('PRAGMA user_version=7');
    // A process may have died after delivery. Retain the original operation ID and payload.
    await tx.runAsync(
      "UPDATE SYNC_OUTBOX SET STATE='pending',NEXT_ATTEMPT_AT=0 WHERE STATE='inflight'",
    );
  });
}
