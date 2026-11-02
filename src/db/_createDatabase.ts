// Databases are initialized per authenticated account by the offline runtime.
import { getActiveDatabase } from '../offline/database';
export const runMigrations=async()=>getActiveDatabase();
