import { TABLES, tableName, identifier } from "./schema.ts";
import type { OfflineDatabase, SqlConnection, AccountProfile } from './contracts';

const canonical = (value) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
const payloadBytes = (text) =>
  [...text].reduce(
    (size, char) =>
      size +
      (char.codePointAt(0) < 128
        ? 1
        : char.codePointAt(0) < 2048
          ? 2
          : char.codePointAt(0) < 65536
            ? 3
            : 4),
    0,
  );
export class AuthenticationRequired extends Error {
  code: string;
  constructor() {
    super(
      "Entre novamente para sincronizar. Seus dados locais foram preservados.",
    );
    this.code = "AUTH_REQUIRED";
  }
}

/** Durable transactional outbox. Network I/O never runs inside a SQLite transaction. */
export class OfflineEngine {
  db: OfflineDatabase;
  transport: any;
  user: AccountProfile;
  uuid: () => string;
  now: () => number;
  random: () => number;
  onChange: (event?: any) => void;
  batchSize: number;
  maxBytes: number;
  running: Promise<any> | null;
  disposed: boolean;
  abort: AbortController;
  columns: Map<string, Set<string>>;
  constructor({
    db,
    transport,
    user,
    uuid,
    now = Date.now,
    random = Math.random,
    onChange = () => {},
    batchSize = 100,
    maxBytes = 512 * 1024,
  }) {
    this.db = db;
    this.transport = transport;
    this.user = user;
    this.uuid = uuid;
    this.now = now;
    this.random = random;
    this.onChange = onChange;
    this.batchSize = batchSize;
    this.maxBytes = maxBytes;
    this.running = null;
    this.disposed = false;
    this.abort = new AbortController();
    this.columns = new Map();
  }
  checkActive() {
    if (this.disposed) throw new Error("Sessão de sincronização encerrada");
  }
  dispose() {
    this.disposed = true;
    this.abort.abort();
  }
  async allowedColumns(table, tx = this.db) {
    if (!this.columns.has(table))
      this.columns.set(
        table,
        new Set(
          (await tx.getAllAsync(`PRAGMA table_info(${table})`)).map((c) =>
            c.name.toUpperCase(),
          ),
        ),
      );
    return this.columns.get(table)!;
  }
  async putRow(tx, table, values) {
    const allowed = await this.allowedColumns(table, tx);
    const keys = Object.keys(values).filter((key) => allowed.has(key));
    if (!keys.includes("ID")) throw new Error("Registro sem ID");
    keys.forEach(identifier);
    await tx.runAsync(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")}) ON CONFLICT(ID) DO UPDATE SET ${keys
        .filter((key) => key !== "ID")
        .map((key) => `${key}=excluded.${key}`)
        .join(",")}`,
      keys.map((key) => values[key] ?? null),
    );
  }
  async enqueue(
    tx,
    table,
    values,
    { groupId = this.uuid(), aggregateKey = `${table}:${values.ID}` } = {},
  ) {
    tableName(table);
    this.checkActive();
    const id = String(values.ID),
      payload = canonical(values);
    const tail = await tx.getFirstAsync(
      "SELECT * FROM SYNC_OUTBOX WHERE TABLE_NAME=? AND ENTITY_ID=? AND STATE<>'rejected' ORDER BY SEQUENCE DESC LIMIT 1",
      [table, id],
    );
    if (tail?.STATE === "pending" && tail.ATTEMPTS === 0) {
      await tx.runAsync(
        "UPDATE SYNC_OUTBOX SET PAYLOAD_JSON=?,GROUP_ID=?,AGGREGATE_KEY=?,NEXT_ATTEMPT_AT=0,ERROR=NULL WHERE MUTATION_ID=?",
        [payload, groupId, aggregateKey, tail.MUTATION_ID],
      );
      return;
    }
    const base = await tx.getFirstAsync(
      "SELECT SERVER_VERSION FROM SYNC_ENTITIES WHERE TABLE_NAME=? AND ENTITY_ID=?",
      [table, id],
    );
    await tx.runAsync(
      "INSERT INTO SYNC_OUTBOX (MUTATION_ID,TABLE_NAME,ENTITY_ID,PAYLOAD_JSON,BASE_VERSION,DEPENDS_ON,CREATED_AT,GROUP_ID,AGGREGATE_KEY) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        this.uuid(),
        table,
        id,
        payload,
        tail ? null : (base?.SERVER_VERSION ?? 0),
        tail?.MUTATION_ID ?? null,
        this.now(),
        groupId,
        aggregateKey,
      ],
    );
  }
  async transaction(work, { aggregateKey }: {aggregateKey?: string} = {}) {
    this.checkActive();
    const groupId = this.uuid();
    const result = await this.db.transaction(async (tx) =>
      work({
        db: tx,
        save: async (table, values) => {
          table = tableName(table);
          await this.putRow(tx, table, values);
          const stored = await tx.getFirstAsync(
            `SELECT * FROM ${table} WHERE ID=?`,
            [values.ID],
          );
          await this.enqueue(tx, table, stored, {
            groupId,
            aggregateKey: aggregateKey || `${table}:${values.ID}`,
          });
          return values.ID;
        },
        execute: async (sql, params, table) => {
          table = tableName(table);
          const result = await tx.runAsync(sql, params);
          const row = await tx.getFirstAsync(
            `SELECT * FROM ${table} WHERE rowid=?`,
            [result.lastInsertRowId],
          );
          if (!row) throw new Error("Registro não encontrado após gravação");
          await this.enqueue(tx, table, row, {
            groupId,
            aggregateKey: aggregateKey || `${table}:${row.ID}`,
          });
          return row.ID;
        },
      }),
    );
    this.onChange({ local: true });
    return result;
  }
  async recoverLegacy() {
    await this.db.transaction(async (tx) => {
      const groups = new Map();
      const legacy = await tx.getAllAsync(
        "SELECT TABELA,ID_REGISTRO FROM TABLES_SINCRONYZE ORDER BY ID",
      );
      for (const item of legacy) {
        const table = tableName(item.TABELA),
          id = String(item.ID_REGISTRO);
        const present = await tx.getFirstAsync(
          "SELECT 1 AS FOUND FROM SYNC_OUTBOX WHERE TABLE_NAME=? AND ENTITY_ID=?",
          [table, id],
        );
        if (present) continue;
        const row = await tx.getFirstAsync(
          `SELECT * FROM ${table} WHERE ID=?`,
          [id],
        );
        if (row) {
          const aggregateKey = ["INSPECAO", "AMOSTRA", "TRATAMENTO"].includes(
            table,
          )
            ? `VISITA:${row.ID_VISITA}`
            : `${table}:${id}`;
          if (!groups.has(aggregateKey)) groups.set(aggregateKey, this.uuid());
          await this.enqueue(tx, table, row, {
            groupId: groups.get(aggregateKey),
            aggregateKey,
          });
          await tx.runAsync(
            "UPDATE SYNC_OUTBOX SET BASE_VERSION=NULL WHERE TABLE_NAME=? AND ENTITY_ID=?",
            [table, id],
          );
        }
      }
      await tx.runAsync("DELETE FROM TABLES_SINCRONYZE");
    });
  }
  async status() {
    const rows = await this.db.getAllAsync(
      "SELECT STATE,COUNT(*) AS COUNT,MIN(NEXT_ATTEMPT_AT) AS NEXT FROM SYNC_OUTBOX GROUP BY STATE",
    );
    const result = {
      pending: 0,
      conflicts: 0,
      rejected: 0,
      nextRetry: null,
      ready: 0,
    };
    for (const row of rows) {
      if (row.STATE === "conflict") result.conflicts += row.COUNT;
      else if (row.STATE === "rejected") result.rejected += row.COUNT;
      else {
        result.pending += row.COUNT;
        if (row.NEXT > this.now())
          result.nextRetry =
            result.nextRetry == null
              ? row.NEXT
              : Math.min(result.nextRetry, row.NEXT);
      }
    }
    const ready = await this.db.getAllAsync(
      "SELECT GROUP_ID FROM SYNC_OUTBOX GROUP BY GROUP_ID HAVING SUM(CASE WHEN STATE<>'pending' OR DEPENDS_ON IS NOT NULL OR NEXT_ATTEMPT_AT>? THEN 1 ELSE 0 END)=0",
      [this.now()],
    );
    result.ready = ready.length;
    return result;
  }
  async lease() {
    return this.db.transaction(async (tx) => {
      const groups = await tx.getAllAsync(
        `SELECT GROUP_ID,MIN(SEQUENCE) AS FIRST_ROW,MIN(CASE TABLE_NAME WHEN 'PLANEJAMENTO' THEN 0 WHEN 'VISITA' THEN 1 ELSE 2 END) AS PRIORITY FROM SYNC_OUTBOX GROUP BY GROUP_ID HAVING SUM(CASE WHEN STATE<>'pending' OR DEPENDS_ON IS NOT NULL OR NEXT_ATTEMPT_AT>? THEN 1 ELSE 0 END)=0 ORDER BY PRIORITY,FIRST_ROW LIMIT 100`,
        [this.now()],
      );
      const selected: Record<string, any>[] = [];
      let size = 2;
      for (const group of groups) {
        const rows = await tx.getAllAsync(
          "SELECT * FROM SYNC_OUTBOX WHERE GROUP_ID=? ORDER BY SEQUENCE",
          [group.GROUP_ID],
        );
        const bytes = rows.reduce(
          (total, row) => total + payloadBytes(row.PAYLOAD_JSON) + 200,
          0,
        );
        if (bytes > this.maxBytes || rows.length > 500) {
          await tx.runAsync(
            "UPDATE SYNC_OUTBOX SET STATE='rejected',ERROR=? WHERE GROUP_ID=?",
            [
              "O conjunto excede o limite de envio. Revise os dados.",
              group.GROUP_ID,
            ],
          );
          continue;
        }
        if (
          selected.length &&
          (size + bytes > this.maxBytes ||
            selected.length + rows.length > this.batchSize)
        )
          break;
        size += bytes;
        selected.push(...rows);
        await tx.runAsync(
          "UPDATE SYNC_OUTBOX SET STATE='inflight',ATTEMPTS=ATTEMPTS+1 WHERE GROUP_ID=?",
          [group.GROUP_ID],
        );
      }
      return selected;
    });
  }
  async retry(rows, error) {
    const retryAfter = Math.min(
      300000,
      Math.max(0, Number(error.retryAfterMs) || 0),
    );
    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        const delay = Math.min(
          300000,
          Math.max(
            retryAfter,
            Math.min(300000, 1000 * 2 ** Math.min(row.ATTEMPTS, 8)) *
              (0.8 + this.random() * 0.4),
          ),
        );
        await tx.runAsync(
          "UPDATE SYNC_OUTBOX SET STATE='pending',NEXT_ATTEMPT_AT=?,ERROR=? WHERE MUTATION_ID=?",
          [
            this.now() + Math.round(delay),
            "Falha de rede ou serviço indisponível. Nova tentativa programada.",
            row.MUTATION_ID,
          ],
        );
      }
    });
  }
  async applyAcknowledgement(rows, response) {
    const accepted = new Map<string, any>(
      (response.applied || []).map((item) => [item.mutationId, item]),
    );
    const conflicts = new Map<string, any>(
      (response.conflicts || []).map((item) => [item.mutationId, item]),
    );
    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        const ack = accepted.get(row.MUTATION_ID),
          conflict = conflicts.get(row.MUTATION_ID);
        if (ack) {
          if (!Number.isSafeInteger(ack.version) || ack.version < 1)
            throw new Error("Confirmação inválida");
          await tx.runAsync(
            "INSERT INTO SYNC_ENTITIES (TABLE_NAME,ENTITY_ID,SERVER_VERSION,SNAPSHOT_JSON) VALUES (?,?,?,?) ON CONFLICT(TABLE_NAME,ENTITY_ID) DO UPDATE SET SERVER_VERSION=MAX(SERVER_VERSION,excluded.SERVER_VERSION),SNAPSHOT_JSON=CASE WHEN excluded.SERVER_VERSION>=SERVER_VERSION THEN excluded.SNAPSHOT_JSON ELSE SNAPSHOT_JSON END",
            [row.TABLE_NAME, row.ENTITY_ID, ack.version, row.PAYLOAD_JSON],
          );
          await tx.runAsync(
            "UPDATE SYNC_OUTBOX SET BASE_VERSION=?,DEPENDS_ON=NULL WHERE DEPENDS_ON=?",
            [ack.version, row.MUTATION_ID],
          );
          await tx.runAsync("DELETE FROM SYNC_OUTBOX WHERE MUTATION_ID=?", [
            row.MUTATION_ID,
          ]);
          await tx.runAsync(
            "DELETE FROM SYNC_OUTBOX WHERE TABLE_NAME=? AND ENTITY_ID=? AND STATE='rejected' AND SEQUENCE<?",
            [row.TABLE_NAME, row.ENTITY_ID, row.SEQUENCE],
          );
        } else if (conflict) {
          await tx.runAsync(
            "UPDATE SYNC_OUTBOX SET STATE='conflict',SERVER_JSON=?,SERVER_VERSION=?,ERROR=? WHERE MUTATION_ID=?",
            [
              canonical(conflict.serverValues),
              conflict.serverVersion,
              "O registro foi alterado em outro dispositivo.",
              row.MUTATION_ID,
            ],
          );
        } else
          throw new Error(
            "O servidor não confirmou todos os registros do lote",
          );
      }
    });
    this.onChange();
  }
  async send(rows) {
    if (!rows.length) return;
    this.checkActive();
    try {
      const response = await this.transport.upload(
        rows.map((row) => ({
          id: row.ENTITY_ID,
          tabela: row.TABLE_NAME,
          values: JSON.parse(row.PAYLOAD_JSON),
          mutationId: row.MUTATION_ID,
          baseVersion: row.BASE_VERSION,
        })),
        this.abort.signal,
      );
      this.checkActive();
      await this.applyAcknowledgement(rows, response);
    } catch (error) {
      if (this.disposed) return;
      const status = error.status || error.response?.status;
      if (status === 401 || error.code === "AUTH_REQUIRED") {
        await this.db.runAsync(
          "UPDATE SYNC_OUTBOX SET STATE='pending',NEXT_ATTEMPT_AT=0 WHERE STATE='inflight'",
        );
        throw new AuthenticationRequired();
      }
      if ([400, 403, 404, 409, 413, 422].includes(status)) {
        const groups = [...new Set(rows.map((row) => row.GROUP_ID))];
        if (groups.length > 1) {
          const first = new Set(groups.slice(0, Math.ceil(groups.length / 2)));
          await this.send(rows.filter((row) => first.has(row.GROUP_ID)));
          await this.send(rows.filter((row) => !first.has(row.GROUP_ID)));
        } else if (status === 409) {
          const conflicts = new Map<string, any>(
            (
              error.data?.conflicts ||
              error.response?.data?.conflicts ||
              []
            ).map((item) => [item.mutationId, item]),
          );
          await this.db.transaction(async (tx) => {
            for (const row of rows) {
              const conflict = conflicts.get(row.MUTATION_ID);
              await tx.runAsync(
                "UPDATE SYNC_OUTBOX SET STATE='conflict',SERVER_JSON=?,SERVER_VERSION=?,ERROR=? WHERE MUTATION_ID=?",
                [
                  conflict ? canonical(conflict.serverValues) : null,
                  conflict?.serverVersion ?? null,
                  "Outra edição mudou este conjunto de dados.",
                  row.MUTATION_ID,
                ],
              );
            }
          });
        } else
          await this.db.runAsync(
            "UPDATE SYNC_OUTBOX SET STATE='rejected',ERROR=? WHERE GROUP_ID=?",
            [
              status === 403
                ? "Sem permissão para enviar este conjunto."
                : "O servidor rejeitou o conjunto. Revise os dados.",
              groups[0],
            ],
          );
      } else {
        await this.retry(rows, error);
        throw error;
      }
    }
  }
  async pull(full = false, restarted = false) {
    this.checkActive();
    full =
      full ||
      !!(await this.db.getFirstAsync(
        "SELECT VALUE FROM SYNC_META WHERE KEY='requires_full'",
      ));
    const bootstrap = await this.db.getFirstAsync(
      "SELECT VALUE FROM SYNC_META WHERE KEY='bootstrapped'",
    );
    let progress = await this.db.getFirstAsync(
      "SELECT VALUE FROM SYNC_META WHERE KEY='download'",
    );
    progress = progress ? JSON.parse(progress.VALUE) : null;
    if (full || (progress && this.now() - progress.startedAt > 240000))
      progress = null;
    let offset = progress?.offset || 0,
      downloadId = progress?.downloadId || "",
      completed = new Set(progress?.completed || []),
      startedAt = progress?.startedAt || this.now();
    let more;
    do {
      let data;
      try {
        data = await this.transport.download({
          userId: this.user.id,
          full: full || !bootstrap,
          offset,
          downloadId,
          signal: this.abort.signal,
        });
      } catch (error) {
        if (
          downloadId &&
          !restarted &&
          (error.status || error.response?.status) === 400
        ) {
          await this.db.runAsync("DELETE FROM SYNC_META WHERE KEY='download'");
          return this.pull(full, true);
        }
        throw error;
      }
      this.checkActive();
      more = false;
      await this.db.transaction(async (tx) => {
        for (const load of data.consumerLoadsList) {
          const table = tableName(load.tableName),
            dirty = new Set(
              (
                await tx.getAllAsync(
                  "SELECT DISTINCT ENTITY_ID FROM SYNC_OUTBOX WHERE TABLE_NAME=?",
                  [table],
                )
              ).map((row) => row.ENTITY_ID),
            );
          if (load.hasMore) more = true;
          else completed.add(table);
          for (const input of load.rows) {
            const { __version, ...row } = input;
            if (!Number.isSafeInteger(__version) || __version < 1)
              throw new Error("Versão de sincronização inválida");
            const previous = await tx.getFirstAsync(
              "SELECT SERVER_VERSION FROM SYNC_ENTITIES WHERE TABLE_NAME=? AND ENTITY_ID=?",
              [table, row.ID],
            );
            if (previous && previous.SERVER_VERSION > __version) continue;
            if (!dirty.has(row.ID)) await this.putRow(tx, table, row);
            await tx.runAsync(
              "INSERT INTO SYNC_ENTITIES (TABLE_NAME,ENTITY_ID,SERVER_VERSION,SNAPSHOT_JSON) VALUES (?,?,?,?) ON CONFLICT(TABLE_NAME,ENTITY_ID) DO UPDATE SET SERVER_VERSION=excluded.SERVER_VERSION,SNAPSHOT_JSON=excluded.SNAPSHOT_JSON",
              [table, row.ID, __version, canonical(row)],
            );
          }
        }
        await tx.runAsync(
          "INSERT INTO SYNC_META(KEY,VALUE) VALUES ('download',?) ON CONFLICT(KEY) DO UPDATE SET VALUE=excluded.VALUE",
          [
            JSON.stringify({
              offset: data.nextOffset,
              downloadId: data.downloadId,
              completed: [...completed],
              startedAt,
            }),
          ],
        );
        if (!more)
          await tx.runAsync(
            "INSERT INTO SYNC_META(KEY,VALUE) VALUES ('bootstrapped','1') ON CONFLICT(KEY) DO UPDATE SET VALUE='1'",
          );
      });
      offset = data.nextOffset;
      downloadId = data.downloadId;
    } while (more);
    await this.transport.confirm({
      userId: this.user.id,
      downloadId,
      tables: [...completed],
      signal: this.abort.signal,
    });
    await this.db.transaction(async (tx) => {
      await tx.runAsync("DELETE FROM SYNC_META WHERE KEY='download'");
      await tx.runAsync("DELETE FROM SYNC_META WHERE KEY='requires_full'");
      await tx.runAsync(
        "INSERT INTO SYNC_META(KEY,VALUE) VALUES ('last_sync',?) ON CONFLICT(KEY) DO UPDATE SET VALUE=excluded.VALUE",
        [String(this.now())],
      );
    });
    this.onChange();
  }
  sync({ full = false } = {}) {
    if (this.running) return this.running;
    this.running = (async () => {
      this.checkActive();
      if (!(await this.transport.online())) return { offline: true };
      if (!(await this.transport.authorized()))
        throw new AuthenticationRequired();
      let batches = 0;
      while (batches++ < 100) {
        const rows = await this.lease();
        if (!rows.length) break;
        await this.send(rows);
        this.checkActive();
      }
      await this.pull(full);
      return this.status();
    })().finally(() => {
      this.running = null;
      this.onChange();
    });
    return this.running;
  }
  async problems() {
    return this.db.getAllAsync(
      "SELECT * FROM SYNC_OUTBOX WHERE STATE IN ('conflict','rejected') ORDER BY SEQUENCE",
    );
  }
  async resolve(mutationId, choice) {
    this.checkActive();
    await this.db.transaction(async (tx) => {
      const item = await tx.getFirstAsync(
        "SELECT * FROM SYNC_OUTBOX WHERE MUTATION_ID=?",
        [mutationId],
      );
      if (!item) throw new Error("Pendência não encontrada");
      const related = await tx.getAllAsync(
        "SELECT * FROM SYNC_OUTBOX WHERE AGGREGATE_KEY=? ORDER BY SEQUENCE",
        [item.AGGREGATE_KEY],
      );
      const unique = [
        ...new Map(
          related.map((row) => [row.TABLE_NAME + ":" + row.ENTITY_ID, row]),
        ).values(),
      ];
      for (const row of related) {
        if (row.SERVER_JSON)
          await tx.runAsync(
            "INSERT INTO SYNC_ENTITIES(TABLE_NAME,ENTITY_ID,SERVER_VERSION,SNAPSHOT_JSON) VALUES(?,?,?,?) ON CONFLICT(TABLE_NAME,ENTITY_ID) DO UPDATE SET SERVER_VERSION=excluded.SERVER_VERSION,SNAPSHOT_JSON=excluded.SNAPSHOT_JSON",
            [
              row.TABLE_NAME,
              row.ENTITY_ID,
              row.SERVER_VERSION,
              row.SERVER_JSON,
            ],
          );
      }
      await tx.runAsync("DELETE FROM SYNC_OUTBOX WHERE AGGREGATE_KEY=?", [
        item.AGGREGATE_KEY,
      ]);
      const groupId = this.uuid();
      if (choice === "server")
        await tx.runAsync(
          "INSERT INTO SYNC_META(KEY,VALUE) VALUES ('requires_full','1') ON CONFLICT(KEY) DO UPDATE SET VALUE='1'",
        );
      for (const row of unique) {
        const local = await tx.getFirstAsync(
          `SELECT * FROM ${tableName(row.TABLE_NAME)} WHERE ID=?`,
          [row.ENTITY_ID],
        );
        if (choice === "server") {
          const shadow = await tx.getFirstAsync(
            "SELECT SNAPSHOT_JSON FROM SYNC_ENTITIES WHERE TABLE_NAME=? AND ENTITY_ID=?",
            [row.TABLE_NAME, row.ENTITY_ID],
          );
          await this.putRow(
            tx,
            row.TABLE_NAME,
            shadow
              ? JSON.parse(shadow.SNAPSHOT_JSON)
              : { ID: row.ENTITY_ID, SITUACAO: 0 },
          );
        } else if (choice === "local")
          await this.enqueue(tx, row.TABLE_NAME, local, {
            groupId,
            aggregateKey: item.AGGREGATE_KEY,
          });
        else throw new Error("Decisão inválida");
      }
    });
    this.onChange();
  }
}
