import "server-only";
import crypto from "node:crypto";

const hits = new Map<string, number[]>();

/** Tiny in-memory sliding window limiter. Good enough for a single server. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
