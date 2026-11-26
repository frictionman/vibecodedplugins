import JSZip from "jszip";

export async function makeZip(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [name, body] of Object.entries(files)) zip.file(name, body);
  return zip.generateAsync({ type: "uint8array" });
}

export const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

let ipCounter = 0;
/** A fresh client IP, so the in-memory rate limiter never carries over between tests. */
export function freshIp() {
  return `10.0.0.${++ipCounter}`;
}

export function uploadForm(overrides: Record<string, string | string[] | Blob | null> = {}, zip?: Uint8Array) {
  const fd = new FormData();
  const base: Record<string, string | string[] | Blob | null> = {
    name: "Wobble Box",
    tagline: "Wonky tape wobble",
    description: "Makes everything sound like 1994.",
    author: "tapehead",
    category: "Effect",
    os: ["macOS", "Windows"],
    daw: ["Ableton Live"],
    tags: "Lofi, tape!, saturation",
    agree: "yes",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) {
    if (v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else fd.set(k, v);
  }
  if (!("file" in overrides) && zip) fd.set("file", new File([zip as BlobPart], "wobble.zip", { type: "application/zip" }));
  return fd;
}

export function slugCtx<T extends string>(slug: T) {
  return { params: Promise.resolve({ slug }) };
}
