import Link from "next/link";
import type { Plugin } from "@/lib/plugins";
import { CATEGORY_COLORS } from "@/lib/constants";
import { PluginArt } from "./PluginArt";

export function PluginCard({ p, i = 0 }: { p: Plugin; i?: number }) {
  const c = CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.Utility;
  return (
    <Link
      href={`/p/${p.slug}`}
      className="card group pop-in flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:-rotate-[0.6deg] hover:shadow-[6px_6px_0_var(--ink)]"
      style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
    >
      <div className="aspect-[22/13] overflow-hidden border-b-2 border-ink">
        <PluginArt slug={p.slug} name={p.name} category={p.category} screenshotKey={p.screenshotKey} className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight font-bold">{p.name}</h3>
          <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: c.bg, color: c.ink }}>
            {p.category}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted">{p.tagline}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          <div className="flex gap-1">
            {p.formats.map((f) => (
              <span key={f} className="rounded-md border border-ink px-1.5 py-0.5 font-mono font-semibold">
                {f}
              </span>
            ))}
          </div>
          <span className="text-muted">
            by <span className="font-semibold text-ink">{p.author}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
