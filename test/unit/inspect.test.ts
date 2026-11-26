import { describe, expect, it } from "vitest";
import { inspectPluginZip, sniffImage } from "@/lib/inspect";
import { makeZip, PNG } from "../helpers";

/** Writes a one-entry zip by hand, so the stored file name can be anything (JSZip would clean it). */
function rawZip(name: string) {
  const n = new TextEncoder().encode(name);
  const local = new Uint8Array(30 + n.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true);
  lv.setUint16(4, 10, true);
  lv.setUint16(26, n.length, true);
  local.set(n, 30);
  const central = new Uint8Array(46 + n.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint16(4, 20, true);
  cv.setUint16(6, 10, true);
  cv.setUint16(28, n.length, true);
  central.set(n, 46);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, local.length, true);
  const out = new Uint8Array(local.length + central.length + end.length);
  out.set(local, 0);
  out.set(central, local.length);
  out.set(end, local.length + central.length);
  return out;
}

describe("inspectPluginZip", () => {
  it("detects every format and lists the bundles", async () => {
    const zip = await makeZip({
      "Wobble.vst3/Contents/x86_64-win/Wobble.vst3": "bin",
      "Wobble.component/Contents/Info.plist": "plist",
      "Wobble.clap": "bin",
      "README.txt": "hi",
    });
    const res = await inspectPluginZip(zip);
    expect(res).toEqual({
      ok: true,
      formats: ["VST3", "AU", "CLAP"],
      bundles: expect.arrayContaining(["Wobble.vst3", "Wobble.component", "Wobble.clap"]),
    });
    if (res.ok) expect(res.bundles).toHaveLength(3);
  });

  it("finds bundles inside a folder and is case-insensitive", async () => {
    const res = await inspectPluginZip(await makeZip({ "My Plugin/Mac/Thing.VST3/Contents/a": "x" }));
    expect(res).toEqual({ ok: true, formats: ["VST3"], bundles: ["Thing.VST3"] });
  });

  it("ignores __MACOSX resource forks", async () => {
    const res = await inspectPluginZip(await makeZip({ "__MACOSX/Fake.clap": "x", "Real.vst3/a": "x" }));
    expect(res).toEqual({ ok: true, formats: ["VST3"], bundles: ["Real.vst3"] });
  });

  it("rejects a non-zip file by its magic bytes", async () => {
    const res = await inspectPluginZip(PNG);
    expect(res).toEqual({ ok: false, error: "That file isn't a .zip archive." });
  });

  it("rejects a corrupted zip", async () => {
    const bytes = new Uint8Array(64);
    bytes.set([0x50, 0x4b, 0x03, 0x04]);
    const res = await inspectPluginZip(bytes);
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining("corrupted") });
  });

  it("rejects a zip with no plugin bundle", async () => {
    const res = await inspectPluginZip(await makeZip({ "setup.exe": "x", "notes.txt": "y" }));
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining("didn't find") });
  });

  it("rejects an empty zip", async () => {
    const res = await inspectPluginZip(await makeZip({}));
    expect(res.ok).toBe(false);
  });

  it.each(["../evil.vst3/a", "ok/../../evil.vst3", "/etc/evil.vst3", "..\\evil.vst3\\a"])(
    "rejects the unsafe path %s",
    async (name) => {
      const res = await inspectPluginZip(rawZip(name));
      expect(res).toEqual({ ok: false, error: "That zip contains unsafe file paths." });
    }
  );

  it("rejects a zip with more than 5000 entries", async () => {
    const files: Record<string, string> = { "A.vst3/a": "x" };
    for (let i = 0; i < 5001; i++) files[`f${i}.txt`] = "";
    const res = await inspectPluginZip(await makeZip(files));
    expect(res).toEqual({ ok: false, error: "That zip has too many files in it." });
  });

  it("caps the bundle list at 20", async () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 25; i++) files[`P${i}.clap`] = "x";
    const res = await inspectPluginZip(await makeZip(files));
    expect(res.ok && res.bundles.length).toBe(20);
  });
});

describe("sniffImage", () => {
  const pad = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

  it("recognises PNG, JPG, GIF and WebP", () => {
    expect(sniffImage(PNG)).toBe("png");
    expect(sniffImage(pad(0xff, 0xd8, 0xff, 0xe0))).toBe("jpg");
    expect(sniffImage(pad(...new TextEncoder().encode("GIF89a")))).toBe("gif");
    expect(sniffImage(pad(...new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")))).toBe("webp");
  });

  it("rejects anything else", () => {
    expect(sniffImage(pad(...new TextEncoder().encode("<svg xmlns=")))).toBeNull();
    expect(sniffImage(pad(...new TextEncoder().encode("RIFF\0\0\0\0WAVEfmt ")))).toBeNull();
    expect(sniffImage(new Uint8Array(0))).toBeNull();
  });
});
