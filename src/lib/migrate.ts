import type { DatabaseSync } from "node:sqlite";
import { migrations as allMigrations, type Migration } from "./migrations";

/**
 * Applies pending migrations in id order, each in its own transaction, and
 * records them in schema_migrations. Safe to call on every startup and from
 * several processes at once: BEGIN IMMEDIATE serialises writers and each
 * migration is re-checked inside the lock.
 */
export function migrate(db: DatabaseSync, migrations: Migration[] = allMigrations): number[] {
  migrations.forEach((m, i) => {
    if (m.id !== i + 1) throw new Error(`Migration ids must run 1, 2, 3… without gaps; found ${m.id} at position ${i + 1}.`);
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );
  `);
  const isApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?");
  const record = db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)");

  const applied: number[] = [];
  for (const m of migrations) {
    if (isApplied.get(m.id)) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!isApplied.get(m.id)) {
        db.exec(m.sql);
        record.run(m.id, m.name);
        applied.push(m.id);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${m.id} (${m.name}) failed: ${(err as Error).message}`, { cause: err });
    }
  }
  return applied;
}
