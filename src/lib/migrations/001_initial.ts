import type { Migration } from "./types";

/**
 * Baseline schema. Uses IF NOT EXISTS so databases created before migrations
 * existed (by the old inline setup in db.ts) adopt it without changes.
 */
const migration: Migration = {
  id: 1,
  name: "initial",
  sql: `
    CREATE TABLE IF NOT EXISTS plugins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      tagline       TEXT NOT NULL,
      description   TEXT NOT NULL,
      author        TEXT NOT NULL,
      category      TEXT NOT NULL,
      version       TEXT NOT NULL DEFAULT '1.0.0',
      built_with    TEXT NOT NULL DEFAULT '',
      source_url    TEXT NOT NULL DEFAULT '',
      formats       TEXT NOT NULL,  -- JSON array, detected from the archive
      oses          TEXT NOT NULL,  -- JSON array
      daws          TEXT NOT NULL,  -- JSON array
      tags          TEXT NOT NULL,  -- JSON array
      file_key      TEXT NOT NULL,
      file_name     TEXT NOT NULL,
      file_size     INTEGER NOT NULL,
      sha256        TEXT NOT NULL,
      bundles       TEXT NOT NULL,  -- JSON array of plugin bundle names found in the zip
      screenshot_key TEXT,
      manage_hash   TEXT NOT NULL,
      downloads     INTEGER NOT NULL DEFAULT 0,
      reports       INTEGER NOT NULL DEFAULT 0,
      hidden        INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id  INTEGER NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
      reason     TEXT NOT NULL,
      details    TEXT NOT NULL DEFAULT '',
      ip_hash    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      UNIQUE (plugin_id, ip_hash)
    );
  `,
};

export default migration;
