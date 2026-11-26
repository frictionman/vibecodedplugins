import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "./migrate";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const globalForDb = globalThis as unknown as { __vcpDb?: DatabaseSync };

function open() {
  const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));
  // next build loads this module in several workers at once; wait for the lock instead of failing
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA journal_mode = WAL;");
  migrate(db);
  return db;
}

export const db = globalForDb.__vcpDb ?? (globalForDb.__vcpDb = open());
export { DATA_DIR };
