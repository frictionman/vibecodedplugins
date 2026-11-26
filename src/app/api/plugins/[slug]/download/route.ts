import { db } from "@/lib/db";
import { fileStream } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/plugins/[slug]/download">) {
  const { slug } = await ctx.params;
  const row = db.prepare("SELECT id, file_key, file_name FROM plugins WHERE slug = ? AND hidden = 0").get(slug) as
    | { id: number; file_key: string; file_name: string }
    | undefined;
  if (!row) return new Response("Not found", { status: 404 });
  const file = fileStream(row.file_key);
  if (!file) return new Response("File missing", { status: 404 });
  db.prepare("UPDATE plugins SET downloads = downloads + 1 WHERE id = ?").run(row.id);
  return new Response(file.stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${row.file_name}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
