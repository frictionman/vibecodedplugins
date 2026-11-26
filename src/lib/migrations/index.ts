import type { Migration } from "./types";
import m001 from "./001_initial";

/**
 * Every migration, in order. To change the schema, add a new file named
 * NNN_short_name.ts exporting a Migration with the next id, and list it here.
 * Never edit a migration that has shipped: databases that already ran it won't run it again.
 */
export const migrations: Migration[] = [m001];
export type { Migration };
