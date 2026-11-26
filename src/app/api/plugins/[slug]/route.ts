import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { hash } from "@/lib/ratelimit";

/** Delete a plugin with the secret manage token handed out at upload time. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/plugins/[slug]">) {
  const { slug } = await ctx.params;
  const token = req.headers.get("x-manage-token") ?? "";
  const row = db.prepare("SELECT id, manage_hash, file_key, screenshot_key FROM plugins WHERE slug = ?").get(slug) as
    | { id: number; manage_hash: string; file_key: string; screenshot_key: string | null }
    | undefined;
  if (!row || !token || hash(token) !== row.manage_hash) {
    return Response.json({ error: "That manage link isn't valid for this plugin." }, { status: 403 });
  }
  db.prepare("DELETE FROM reports WHERE plugin_id = ?").run(row.id);
  db.prepare("DELETE FROM plugins WHERE id = ?").run(row.id);
  await deleteFile(row.file_key);
  if (row.screenshot_key) await deleteFile(row.screenshot_key);
  return Response.json({ ok: true });
}
