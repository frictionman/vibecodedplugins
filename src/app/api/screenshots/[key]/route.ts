import { fileStream } from "@/lib/storage";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export async function GET(_req: Request, ctx: RouteContext<"/api/screenshots/[key]">) {
  const { key } = await ctx.params;
  const m = key.match(/^([a-f0-9]{32})\.(png|jpg|webp|gif)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const file = fileStream(`screenshots/${key}`);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.stream, {
    headers: {
      "Content-Type": TYPES[m[2]],
      "Content-Length": String(file.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
