import { initializeDatabase } from "./schema.ts";
import type { OfflineDatabase, AccountProfile } from './contracts';

export function accountDatabaseName(profile) {
  if (
    !Number.isSafeInteger(profile.id) ||
    profile.id < 1 ||
    !Number.isSafeInteger(profile.idCede) ||
    profile.idCede < 1
  )
    throw new Error("Identidade local inválida");
  return `inteliagent-u${profile.id}-s${profile.idCede}.db`;
}

/** Each account/sede owns its file. Switching accounts never deletes an unsent outbox. */
export class AccountDatabases {
  open: (name: string) => Promise<OfflineDatabase>;
  backup: (source: OfflineDatabase, destination: OfflineDatabase) => Promise<any>;
  migrate: ((db: OfflineDatabase) => Promise<boolean>) | null;
  baseline: ((db: OfflineDatabase) => Promise<void>) | null;
  legacyName: string;
  handles: Map<string, OfflineDatabase>;
  constructor({ open, backup, migrate = null, baseline = null, legacyName = "database.db" }: {
    open: (name: string) => Promise<OfflineDatabase>;
    backup: (source: OfflineDatabase, destination: OfflineDatabase) => Promise<any>;
    migrate?: ((db: OfflineDatabase) => Promise<boolean>) | null;
    baseline?: ((db: OfflineDatabase) => Promise<void>) | null;
    legacyName?: string;
  }) {
    this.open = open;
    this.backup = backup;
    this.migrate = migrate;
    this.baseline = baseline;
    this.legacyName = legacyName;
    this.handles = new Map();
  }
  async activate(profile) {
    const name = accountDatabaseName(profile);
    let db = this.handles.get(name);
    if (!db) {
      db = await this.open(name);
      this.handles.set(name, db);
    }
    const exists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='SYNC_META'",
    );
    if (!exists) {
      const legacy = await this.open(this.legacyName);
      const hasUser = await legacy.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND upper(name)='USUARIO'",
      );
      const user = hasUser
        ? await legacy.getFirstAsync("SELECT ID,ID_CEDE FROM USUARIO LIMIT 1")
        : null;
      if (user?.ID === profile.id && user?.ID_CEDE === profile.idCede)
        await this.backup(legacy, db);
    }
    const managed = this.migrate ? await this.migrate(db) : false;
    await initializeDatabase(db, { legacy: !managed });
    if (!managed && this.baseline) await this.baseline(db);
    await db.transaction(async (tx) => {
      const current = await tx.getFirstAsync(
        "SELECT VALUE FROM SYNC_META WHERE KEY='account'",
      );
      const expected = `${profile.id}:${profile.idCede}`;
      if (current && current.VALUE !== expected)
        throw new Error("Banco pertence a outra conta");
      await tx.runAsync(
        "INSERT INTO SYNC_META(KEY,VALUE) VALUES ('account',?) ON CONFLICT(KEY) DO UPDATE SET VALUE=excluded.VALUE",
        [expected],
      );
      await tx.runAsync("DELETE FROM USUARIO");
      await tx.runAsync(
        "INSERT INTO USUARIO (ID,NOME,EMAIL,ID_CEDE,ID_IMAGEM_PERFIL_USUARIO,SITUACAO) VALUES (?,?,?,?,?,1)",
        [
          profile.id,
          profile.nome || "",
          profile.email || "",
          profile.idCede,
          profile.idImagemPerfilUsuario || null,
        ],
      );
    });
    return db;
  }
}
