import { defineConfig } from 'drizzle-kit';
export default defineConfig({schema:'./src/db/entities.ts',out:'./drizzle',dialect:'sqlite',driver:'expo'});
