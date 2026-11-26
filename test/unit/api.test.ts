import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as upload } from "@/app/api/plugins/route";
import { DELETE as remove } from "@/app/api/plugins/[slug]/route";
import { POST as report } from "@/app/api/plugins/[slug]/report/route";
import { db } from "@/lib/db";
import { hash } from "@/lib/ratelimit";
import { freshIp, makeZip, PNG, slugCtx, uploadForm } from "../helpers";

let zip: Uint8Array;
beforeAll(async () => {
  zip = await makeZip({ "Wobble.vst3/Contents/a": "x", "Wobble.clap": "x" });
});

const filesDir = () => path.join(process.env.DATA_DIR!, "files");

function post(fd: FormData, ip = freshIp()) {
  return upload(new Request("http://test/api/plugins", { method: "POST", body: fd, headers: { "x-forwarded-for": ip } }));
}

async function uploadOk(overrides = {}) {
  const res = await post(uploadForm(overrides, zip));
  expect(res.status).toBe(200);
  return (await res.json()) as { slug: string; manageToken: string; formats: string[] };
}

type Row = Record<string, unknown>;
const row = (slug: string) => db.prepare("SELECT * FROM plugins WHERE slug = ?").get(slug) as Row | undefined;

describe("POST /api/plugins (upload)", () => {
  it("stores the plugin, its zip and screenshot, and returns a manage token", async () => {
    const shot = new File([PNG as BlobPart], "shot.png", { type: "image/png" });
    const body = await uploadOk({ screenshot: shot, sourceUrl: "https://github.com/x/y" });
    expect(body.slug).toBe("wobble-box");
    expect(body.formats).toEqual(["VST3", "CLAP"]);
    expect(body.manageToken.length).toBeGreaterThan(20);

    const r = row(body.slug)!;
    expect(r).toMatchObject({ name: "Wobble Box", category: "Effect", hidden: 0, source_url: "https://github.com/x/y" });
    expect(JSON.parse(r.oses as string)).toEqual(["macOS", "Windows"]);
    expect(JSON.parse(r.tags as string)).toEqual(["lofi", "tape", "saturation"]);
    expect(r.manage_hash).toBe(hash(body.manageToken));
    expect(r.manage_hash).not.toBe(body.manageToken);
    expect(fs.existsSync(path.join(filesDir(), r.file_key as string))).toBe(true);
    expect(fs.existsSync(path.join(filesDir(), r.screenshot_key as string))).toBe(true);
    expect((r.screenshot_key as string).endsWith(".png")).toBe(true);
  });

  it("gives a second plugin with the same name a new slug", async () => {
    const a = await uploadOk({ name: "Same Name" });
    const b = await uploadOk({ name: "Same Name" });
    expect([a.slug, b.slug]).toEqual(["same-name", "same-name-2"]);
  });

  it("drops OS and DAW values that aren't on the list", async () => {
    const body = await uploadOk({ name: "Picky", os: ["Linux", "TempleOS"], daw: ["Reaper", "MyDAW"] });
    const r = row(body.slug)!;
    expect(JSON.parse(r.oses as string)).toEqual(["Linux"]);
    expect(JSON.parse(r.daws as string)).toEqual(["Reaper"]);
  });

  it.each([
    [{ name: "" }, "Give your plugin a name."],
    [{ tagline: null }, "Add a one-line tagline."],
    [{ category: "Kazoo" }, "Pick a category."],
    [{ os: [] }, "Pick at least one operating system."],
    [{ sourceUrl: "http://insecure.example" }, "The source link must start with https://"],
    [{ agree: null }, "Please confirm the uploader agreement."],
  ])("rejects %o", async (overrides, error) => {
    const res = await post(uploadForm(overrides, zip));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
  });

  it("rejects a missing file, a non-.zip name and a zip without plugins", async () => {
    let res = await post(uploadForm({}));
    expect((await res.json()).error).toBe("Attach your plugin as a .zip file.");

    res = await post(uploadForm({ file: new File([zip as BlobPart], "plugin.rar") }));
    expect((await res.json()).error).toBe("Plugins must be uploaded as a .zip file.");

    const empty = await makeZip({ "readme.txt": "x" });
    res = await post(uploadForm({ file: new File([empty as BlobPart], "x.zip") }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/didn't find/);
  });

  it("rejects a screenshot that isn't really an image and stores nothing", async () => {
    const before = db.prepare("SELECT COUNT(*) AS n FROM plugins").get();
    const fake = new File(["<svg onload=alert(1)>"], "shot.png", { type: "image/png" });
    const res = await post(uploadForm({ name: "Fake Shot", screenshot: fake }, zip));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Screenshots must be PNG, JPG, WebP or GIF.");
    expect(db.prepare("SELECT COUNT(*) AS n FROM plugins").get()).toEqual(before);
  });

  it("rejects an oversized request by its content-length", async () => {
    const res = await upload(
      new Request("http://test/api/plugins", {
        method: "POST",
        body: "x",
        headers: { "content-length": String(200 * 1024 * 1024), "x-forwarded-for": freshIp() },
      })
    );
    expect(res.status).toBe(413);
  });

  it("allows 5 uploads per IP per hour", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) expect((await post(uploadForm({ name: "" }), ip)).status).toBe(400);
    const res = await post(uploadForm({}, zip), ip);
    expect(res.status).toBe(429);
  });
});

describe("POST /api/plugins/[slug]/report", () => {
  function send(slug: string, body: unknown, ip = freshIp()) {
    return report(
      new Request(`http://test/api/plugins/${slug}/report`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
      }),
      slugCtx(slug)
    );
  }

  it("validates the reason and the plugin", async () => {
    const { slug } = await uploadOk({ name: "Report Target" });
    expect((await send(slug, { reason: "meh" })).status).toBe(400);
    expect((await send(slug, {})).status).toBe(400);
    expect((await send("no-such-plugin", { reason: "broken" })).status).toBe(404);
  });

  it("counts one report per person and hides the plugin at 3", async () => {
    const { slug } = await uploadOk({ name: "Sketchy" });
    const ip = freshIp();
    expect((await send(slug, { reason: "malware", details: "x".repeat(5000) }, ip)).status).toBe(200);
    expect((await send(slug, { reason: "broken" }, ip)).status).toBe(200);
    expect(row(slug)).toMatchObject({ reports: 1, hidden: 0 });
    const saved = db.prepare("SELECT details FROM reports WHERE plugin_id = ?").get(row(slug)!.id as number) as { details: string };
    expect(saved.details).toHaveLength(1000);

    await send(slug, { reason: "malware" });
    expect(row(slug)).toMatchObject({ reports: 2, hidden: 0 });
    await send(slug, { reason: "stolen" });
    expect(row(slug)).toMatchObject({ reports: 3, hidden: 1 });
  });

  it("allows 10 reports per IP per hour", async () => {
    const ip = freshIp();
    for (let i = 0; i < 10; i++) expect((await send("nope", { reason: "x" }, ip)).status).toBe(400);
    expect((await send("nope", { reason: "x" }, ip)).status).toBe(429);
  });
});

describe("DELETE /api/plugins/[slug]", () => {
  function del(slug: string, token?: string) {
    return remove(
      new Request(`http://test/api/plugins/${slug}`, { method: "DELETE", headers: token ? { "x-manage-token": token } : {} }),
      slugCtx(slug)
    );
  }

  it("refuses a missing or wrong token and an unknown plugin", async () => {
    const { slug, manageToken } = await uploadOk({ name: "Keep Me" });
    expect((await del(slug)).status).toBe(403);
    expect((await del(slug, "wrong")).status).toBe(403);
    expect((await del("no-such-plugin", manageToken)).status).toBe(403);
    expect(row(slug)).toBeDefined();
  });

  it("deletes the row, its reports and its files with the right token", async () => {
    const shot = new File([PNG as BlobPart], "s.png");
    const { slug, manageToken } = await uploadOk({ name: "Delete Me", screenshot: shot });
    const r = row(slug)!;
    await report(
      new Request("http://test", { method: "POST", body: JSON.stringify({ reason: "broken" }), headers: { "x-forwarded-for": freshIp() } }),
      slugCtx(slug)
    );

    const res = await del(slug, manageToken);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(row(slug)).toBeUndefined();
    expect(db.prepare("SELECT COUNT(*) AS n FROM reports WHERE plugin_id = ?").get(r.id as number)).toEqual({ n: 0 });
    expect(fs.existsSync(path.join(filesDir(), r.file_key as string))).toBe(false);
    expect(fs.existsSync(path.join(filesDir(), r.screenshot_key as string))).toBe(false);
  });
});
