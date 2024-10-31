import * as SQLite from 'expo-sqlite';
import { createSQLStatements } from './migrations/createDatabase';
import { alterSQLStatements } from './migrations/alterDatabase';
import { DATABASE_NAME } from '@root/constants/database';

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const runMigrations = async () => {
    createSQLStatements.forEach(async query => {
      if (query.trim()) {
        await db.execAsync(query.trim())
      }
    });

    alterSQLStatements.forEach(async query => {
      if (query.trim()) {
          await db.execAsync(query.trim())
      }
    });
};
