import * as SQLite from "expo-sqlite";

import { adaptDatabase } from "./sqliteAdapter.ts";
import type { OfflineDatabase } from './contracts';
const handles = new Map<string, Promise<OfflineDatabase>>();
export const openDatabase = async (name) => {
  if (!handles.has(name))
    handles.set(name, SQLite.openDatabaseAsync(name).then(adaptDatabase) as Promise<OfflineDatabase>);
  return handles.get(name)!;
};
export const backupDatabase = (source, destination) =>
  SQLite.backupDatabaseAsync({
    sourceDatabase: source.native,
    destDatabase: destination.native,
  });
let active: OfflineDatabase | null = null;
export const setActiveDatabase = (db) => {
  active = db;
};
export const getActiveDatabase = () => {
  if (!active) throw new Error("Banco da conta ainda não foi inicializado");
  return active;
};
export const database: OfflineDatabase = new Proxy(
  {} as OfflineDatabase,
  {
    get: (_, key) => {
      if (key === "then") return undefined;
      if (typeof key !== 'string') return undefined;
      return (...args) => {
        const db = getActiveDatabase();
        const target = db[key] || db.native?.[key];
        return target.apply(db[key] ? db : db.native, args);
      };
    },
  },
);
