import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations.js';
import * as entities from '../db/entities';
import type { SQLiteDatabase } from 'expo-sqlite';
import { recordAppliedAdditiveMigrations } from './additiveMigrations';

export async function ensureGeneratedSchema(native: SQLiteDatabase): Promise<boolean> {
  const hasTables = await native.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='USUARIO'",
  );
  const hasJournal = await native.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'",
  );
  if (hasTables && !hasJournal) return false;
  if (hasJournal) await native.withExclusiveTransactionAsync(transaction => recordAppliedAdditiveMigrations(transaction,migrations.journal));
  await migrate(drizzle(native, { schema: entities }), migrations);
  return true;
}

export async function registerLegacySchema(native: SQLiteDatabase): Promise<void> {
  const created = migrations.journal.entries[0].when;
  await native.withExclusiveTransactionAsync(async transaction => {
    await transaction.execAsync(
      'CREATE TABLE IF NOT EXISTS __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)',
    );
    await transaction.runAsync(
      'INSERT INTO __drizzle_migrations (hash,created_at) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations)',
      ['legacy-import', created],
    );
    // initializeDatabase already applied the additive legacy upgrades.
    await recordAppliedAdditiveMigrations(transaction,migrations.journal);
  });
  await migrate(drizzle(native, { schema: entities }), migrations);
}
