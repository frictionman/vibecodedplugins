import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

// Every test file gets its own empty data dir (sqlite db + stored files).
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcp-test-"));
process.env.DATA_DIR = dir;
delete (globalThis as { __vcpDb?: unknown }).__vcpDb;

afterAll(() => {
  const g = globalThis as { __vcpDb?: { close(): void } };
  g.__vcpDb?.close();
  delete g.__vcpDb;
  fs.rmSync(dir, { recursive: true, force: true });
});
