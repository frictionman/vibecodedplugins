import "server-only";
import { io } from "next/cache";
import { db } from "./db";

export type Plugin = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  category: string;
  version: string;
  builtWith: string;
  sourceUrl: string;
  formats: string[];
  oses: string[];
  daws: string[];
  tags: string[];
  fileName: string;
  fileSize: number;
  sha256: string;
  bundles: string[];
  screenshotKey: string | null;
  downloads: number;
  createdAt: string;
};

type Row = Record<string, unknown>;

function toPlugin(r: Row): Plugin {
  return {
    id: r.id as number,
    slug: r.slug as string,
    name: r.name as string,
    tagline: r.tagline as string,
    description: r.description as string,
    author: r.author as string,
    category: r.category as string,
    version: r.version as string,
    builtWith: r.built_with as string,
    sourceUrl: r.source_url as string,
    formats: JSON.parse(r.formats as string),
    oses: JSON.parse(r.oses as string),
    daws: JSON.parse(r.daws as string),
    tags: JSON.parse(r.tags as string),
    fileName: r.file_name as string,
    fileSize: r.file_size as number,
    sha256: r.sha256 as string,
    bundles: JSON.parse(r.bundles as string),
    screenshotKey: (r.screenshot_key as string | null) ?? null,
    downloads: r.downloads as number,
    createdAt: r.created_at as string,
  };
}

export type Filters = {
  q?: string;
  format?: string;
  os?: string;
  category?: string;
  daw?: string;
  tag?: string;
  sort?: "new" | "popular";
};

export async function searchPlugins(f: Filters): Promise<Plugin[]> {
  await io(); // synchronous DB driver: keep reads out of the prerendered shell
  const where: string[] = ["hidden = 0"];
  const args: string[] = [];
  if (f.q) {
    where.push("(name LIKE ? OR tagline LIKE ? OR description LIKE ? OR author LIKE ? OR tags LIKE ?)");
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    args.push(like, like, like, like, like);
  }
  for (const [col, val] of [
    ["formats", f.format],
    ["oses", f.os],
    ["daws", f.daw],
    ["tags", f.tag],
  ] as const) {
    if (val) {
      where.push(`EXISTS (SELECT 1 FROM json_each(${col}) WHERE value = ?)`);
      args.push(val);
    }
  }
  if (f.category) {
    where.push("category = ?");
    args.push(f.category);
  }
  const order = f.sort === "popular" ? "downloads DESC, id DESC" : "id DESC";
  const rows = db
    .prepare(`SELECT * FROM plugins WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 120`)
    .all(...args) as Row[];
  return rows.map(toPlugin);
}

export async function getPlugin(slug: string): Promise<Plugin | null> {
  await io();
  const r = db.prepare("SELECT * FROM plugins WHERE slug = ? AND hidden = 0").get(slug) as Row | undefined;
  return r ? toPlugin(r) : null;
}

export async function getStats() {
  await io();
  return db
    .prepare("SELECT COUNT(*) AS plugins, COALESCE(SUM(downloads),0) AS downloads FROM plugins WHERE hidden = 0")
    .get() as { plugins: number; downloads: number };
}

export function slugify(name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "plugin";
  let slug = base;
  for (let i = 2; db.prepare("SELECT 1 FROM plugins WHERE slug = ?").get(slug); i++) slug = `${base}-${i}`;
  return slug;
}
