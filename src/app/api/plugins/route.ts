import crypto from "node:crypto";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { inspectPluginZip, sniffImage } from "@/lib/inspect";
import { slugify } from "@/lib/plugins";
import { clientIp, hash, rateLimit } from "@/lib/ratelimit";
import { CATEGORIES, DAWS, MAX_IMAGE_BYTES, MAX_PLUGIN_BYTES, OSES } from "@/lib/constants";

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

function str(fd: FormData, key: string, max: number) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function list(fd: FormData, key: string, allowed?: readonly string[]) {
  const vals = fd.getAll(key).filter((v): v is string => typeof v === "string");
  return [...new Set(vals.map((v) => v.trim()).filter((v) => (allowed ? allowed.includes(v) : v)))];
}

export async function POST(req: Request) {
  if (!rateLimit(`upload:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return bad("Whoa, slow down! You can upload 5 plugins per hour.", 429);
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_PLUGIN_BYTES + MAX_IMAGE_BYTES + 1024 * 1024) return bad("That upload is too big.", 413);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return bad("Couldn't read the upload.");
  }

  const name = str(fd, "name", 60);
  const tagline = str(fd, "tagline", 120);
  const description = str(fd, "description", 5000);
  const author = str(fd, "author", 60);
  const category = str(fd, "category", 20);
  const version = str(fd, "version", 20) || "1.0.0";
  const builtWith = str(fd, "builtWith", 60);
  const sourceUrl = str(fd, "sourceUrl", 300);
  const oses = list(fd, "os", OSES);
  const daws = list(fd, "daw", DAWS);
  const tags = str(fd, "tags", 200)
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").slice(0, 24))
    .filter(Boolean)
    .slice(0, 8);

  if (!name) return bad("Give your plugin a name.");
  if (!tagline) return bad("Add a one-line tagline.");
  if (!description) return bad("Add a description.");
  if (!author) return bad("Tell people who made it.");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return bad("Pick a category.");
  if (oses.length === 0) return bad("Pick at least one operating system.");
  if (sourceUrl && !/^https:\/\/[^\s]+$/.test(sourceUrl)) return bad("The source link must start with https://");
  if (fd.get("agree") !== "yes") return bad("Please confirm the uploader agreement.");

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return bad("Attach your plugin as a .zip file.");
  if (!file.name.toLowerCase().endsWith(".zip")) return bad("Plugins must be uploaded as a .zip file.");
  if (file.size > MAX_PLUGIN_BYTES) return bad("Plugin zips can be at most 100 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inspected = await inspectPluginZip(bytes);
  if (!inspected.ok) return bad(inspected.error);

  let screenshot: { bytes: Uint8Array; ext: string } | null = null;
  const shot = fd.get("screenshot");
  if (shot instanceof File && shot.size > 0) {
    if (shot.size > MAX_IMAGE_BYTES) return bad("Screenshots can be at most 5 MB.");
    const sb = new Uint8Array(await shot.arrayBuffer());
    const ext = sniffImage(sb);
    if (!ext) return bad("Screenshots must be PNG, JPG, WebP or GIF.");
    screenshot = { bytes: sb, ext };
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const fileKey = `plugins/${id}.zip`;
  const screenshotKey = screenshot ? `screenshots/${id}.${screenshot.ext}` : null;
  await putFile(fileKey, bytes);
  if (screenshot && screenshotKey) await putFile(screenshotKey, screenshot.bytes);

  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const manageToken = crypto.randomBytes(24).toString("base64url");
  const slug = slugify(name);
  const safeFileName = `${slug}-${version.replace(/[^a-zA-Z0-9.]/g, "")}.zip`;

  db.prepare(
    `INSERT INTO plugins (slug, name, tagline, description, author, category, version, built_with, source_url,
      formats, oses, daws, tags, file_key, file_name, file_size, sha256, bundles, screenshot_key, manage_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    slug, name, tagline, description, author, category, version, builtWith, sourceUrl,
    JSON.stringify(inspected.formats), JSON.stringify(oses), JSON.stringify(daws), JSON.stringify(tags),
    fileKey, safeFileName, bytes.byteLength, sha256, JSON.stringify(inspected.bundles), screenshotKey,
    hash(manageToken)
  );

  return Response.json({ slug, manageToken, formats: inspected.formats });
}
