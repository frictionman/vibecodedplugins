import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { DATA_DIR } from "./db";

/**
 * Minimal file storage. Files live on local disk under DATA_DIR/files.
 * Swap these three functions for an S3/R2 client to move storage off-box.
 */
const ROOT = path.join(DATA_DIR, "files");

function resolveKey(key: string) {
  if (!/^[a-z]+\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(key)) throw new Error("Bad storage key");
  return path.join(ROOT, key);
}

export async function putFile(key: string, data: Uint8Array) {
  const p = resolveKey(key);
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, data);
}

export function fileStream(key: string): { stream: ReadableStream; size: number } | null {
  const p = resolveKey(key);
  if (!fs.existsSync(p)) return null;
  const size = fs.statSync(p).size;
  return { stream: Readable.toWeb(fs.createReadStream(p)) as ReadableStream, size };
}

export async function deleteFile(key: string) {
  await fsp.rm(resolveKey(key), { force: true });
}
