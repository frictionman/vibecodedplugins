import "server-only";
import JSZip from "jszip";
import type { Format } from "./constants";

/**
 * Looks inside an uploaded zip without extracting it, finds plugin bundles,
 * and derives the formats from what is actually there.
 */
export async function inspectPluginZip(data: Uint8Array): Promise<
  { ok: true; formats: Format[]; bundles: string[] } | { ok: false; error: string }
> {
  // "PK\x03\x04" local file header, or "PK\x05\x06" for an empty archive
  if (!(data[0] === 0x50 && data[1] === 0x4b && (data[2] === 0x03 || data[2] === 0x05))) {
    return { ok: false, error: "That file isn't a .zip archive." };
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    return { ok: false, error: "We couldn't read that zip. Is it corrupted?" };
  }
  const names = Object.keys(zip.files);
  if (names.length > 5000) return { ok: false, error: "That zip has too many files in it." };

  const bundles = new Map<string, Format>();
  for (const [key, entry] of Object.entries(zip.files)) {
    // JSZip cleans "../" out of names; check the original name the archive really carries
    const raw = (entry as unknown as { unsafeOriginalName?: string }).unsafeOriginalName ?? key;
    const name = raw.replace(/\\/g, "/");
    if (name.startsWith("__MACOSX/")) continue;
    if (name.split("/").includes("..") || name.startsWith("/")) {
      return { ok: false, error: "That zip contains unsafe file paths." };
    }
    const m = name.match(/^(.*?[^/]+\.(vst3|component|clap))(\/|$)/i);
    if (m) {
      const ext = m[2].toLowerCase();
      bundles.set(m[1].split("/").pop()!, ext === "vst3" ? "VST3" : ext === "component" ? "AU" : "CLAP");
    }
  }
  if (bundles.size === 0) {
    return {
      ok: false,
      error: "We didn't find a .vst3, .component (AU) or .clap plugin inside that zip.",
    };
  }
  const formats = (["VST3", "AU", "CLAP"] as const).filter((f) => [...bundles.values()].includes(f));
  return { ok: true, formats: [...formats], bundles: [...bundles.keys()].slice(0, 20) };
}

export function sniffImage(data: Uint8Array): "png" | "jpg" | "webp" | "gif" | null {
  const b = data;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "webp";
  return null;
}
