import type { SQLiteDatabase } from 'expo-sqlite';

export type SqlValue = string | number | boolean | null | Uint8Array;
export type SqlRow = Record<string, any>;
export interface SqlConnection {
  execAsync(sql: string): Promise<unknown>;
  runAsync(sql: string, params?: any): Promise<any>;
  getFirstAsync(sql: string, params?: any): Promise<SqlRow | null>;
  getAllAsync(sql: string, params?: any): Promise<SqlRow[]>;
}
export interface OfflineDatabase extends SqlConnection {
  [key: string]: any;
  native: SQLiteDatabase;
  transaction<T>(work: (tx: SqlConnection) => Promise<T>): Promise<T>;
}
export interface AccountProfile {
  id: number;
  idCede: number;
  nome?: string;
  email?: string;
  [key: string]: any;
}
