import { db } from "@/lib/db";
import { clientIp, hash, rateLimit } from "@/lib/ratelimit";
import { REPORTS_TO_HIDE } from "@/lib/constants";

const REASONS = ["malware", "broken", "stolen", "inappropriate", "other"];

export async function POST(req: Request, ctx: RouteContext<"/api/plugins/[slug]/report">) {
  const { slug } = await ctx.params;
  const ip = clientIp(req);
  if (!rateLimit(`report:${ip}`, 10, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many reports, try again later." }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { reason?: string; details?: string };
  if (!body.reason || !REASONS.includes(body.reason)) {
    return Response.json({ error: "Pick a reason." }, { status: 400 });
  }
  const plugin = db.prepare("SELECT id FROM plugins WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!plugin) return Response.json({ error: "Not found" }, { status: 404 });

  const res = db
    .prepare("INSERT OR IGNORE INTO reports (plugin_id, reason, details, ip_hash) VALUES (?, ?, ?, ?)")
    .run(plugin.id, body.reason, String(body.details ?? "").slice(0, 1000), hash(`${ip}:${slug}`));
  if (res.changes > 0) {
    db.prepare(
      "UPDATE plugins SET reports = reports + 1, hidden = CASE WHEN reports + 1 >= ? THEN 1 ELSE hidden END WHERE id = ?"
    ).run(REPORTS_TO_HIDE, plugin.id);
  }
  return Response.json({ ok: true });
}
