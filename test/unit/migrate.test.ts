import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { migrate } from "@/lib/migrate";
import { migrations } from "@/lib/migrations";

const tables = (db: DatabaseSync) =>
  (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map(
    (r) => r.name
  );

describe("migrate", () => {
  it("creates the schema on an empty database and records each migration", () => {
    const db = new DatabaseSync(":memory:");
    expect(migrate(db)).toEqual(migrations.map((m) => m.id));
    expect(tables(db)).toEqual(["plugins", "reports", "schema_migrations"]);
    expect(db.prepare("SELECT id, name FROM schema_migrations").all()).toEqual([{ id: 1, name: "initial" }]);
  });

  it("does nothing the second time", () => {
    const db = new DatabaseSync(":memory:");
    migrate(db);
    expect(migrate(db)).toEqual([]);
  });

  it("adopts a database created by the old inline setup without losing rows", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(migrations[0].sql); // what db.ts used to run on every start
    db.exec(`INSERT INTO plugins (slug, name, tagline, description, author, category, formats, oses, daws, tags,
      file_key, file_name, file_size, sha256, bundles, manage_hash)
      VALUES ('a', 'A', 't', 'd', 'me', 'Synth', '[]', '[]', '[]', '[]', 'k', 'f', 1, 's', '[]', 'h')`);
    expect(migrate(db)).toEqual([1]);
    expect(db.prepare("SELECT COUNT(*) AS n FROM plugins").get()).toEqual({ n: 1 });
  });

  it("applies only the new migrations, in order", () => {
    const db = new DatabaseSync(":memory:");
    migrate(db);
    const next = [
      ...migrations,
      { id: migrations.length + 1, name: "add_likes", sql: "ALTER TABLE plugins ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;" },
    ];
    expect(migrate(db, next)).toEqual([migrations.length + 1]);
    const cols = (db.prepare("PRAGMA table_info(plugins)").all() as { name: string }[]).map((c) => c.name);
    expect(cols).toContain("likes");
  });

  it("rolls back a failing migration so it can be retried", () => {
    const db = new DatabaseSync(":memory:");
    migrate(db);
    const broken = [
      ...migrations,
      { id: 2, name: "broken", sql: "CREATE TABLE half_done (id INTEGER); SELECT * FROM no_such_table;" },
    ];
    expect(() => migrate(db, broken)).toThrow(/Migration 2 \(broken\) failed/);
    expect(tables(db)).not.toContain("half_done");
    expect(db.prepare("SELECT MAX(id) AS id FROM schema_migrations").get()).toEqual({ id: 1 });
  });

  it("refuses ids that skip or repeat", () => {
    const db = new DatabaseSync(":memory:");
    expect(() => migrate(db, [migrations[0], { id: 3, name: "x", sql: "" }])).toThrow(/without gaps/);
  });
});
