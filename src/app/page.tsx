import { Suspense } from "react";
import Link from "next/link";
import { searchPlugins, getStats, type Filters } from "@/lib/plugins";
import { CATEGORIES, DAWS, FORMATS, OSES } from "@/lib/constants";
import { PluginCard } from "@/components/PluginCard";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <section className="pt-10 pb-8 sm:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-pink" /> VST3 · AU · CLAP · always free
        </p>
        <h1 className="font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-tight sm:text-7xl">
          Free plugins,
          <br />
          made on a{" "}
          <span className="whitespace-nowrap">
          <span className="relative inline-block">
            <span className="relative z-10">vibe</span>
            <svg viewBox="0 0 120 20" className="absolute -bottom-1 left-0 z-0 w-full" aria-hidden preserveAspectRatio="none">
              <path d="M2 12 Q 15 2, 30 12 T 60 12 T 90 12 T 118 12" fill="none" stroke="var(--pink)" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
          .</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Synths, effects and oddities that people built with AI and a good idea. Download them for your DAW, or share
          your own.
        </p>
        <Suspense fallback={<p className="mt-4 h-5" />}>
          <Stats />
        </Suspense>
      </section>
      <Suspense fallback={<BrowseSkeleton />}>
        <Browse searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Stats() {
  const s = await getStats();
  if (s.plugins === 0) return <p className="mt-4 h-5" />;
  return (
    <p className="mt-4 text-sm font-semibold">
      {s.plugins} plugin{s.plugins === 1 ? "" : "s"} · {s.downloads.toLocaleString()} download{s.downloads === 1 ? "" : "s"}
    </p>
  );
}

const KEYS = ["q", "format", "os", "category", "daw", "tag", "sort"] as const;

async function Browse({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const f: Filters = {};
  for (const k of KEYS) {
    const v = sp[k];
    if (typeof v === "string" && v) (f as Record<string, string>)[k] = v.slice(0, 80);
  }
  const plugins = await searchPlugins(f);

  const href = (key: keyof Filters, value?: string) => {
    const next = new URLSearchParams();
    for (const k of KEYS) if (f[k] && k !== key) next.set(k, f[k] as string);
    if (value && f[key] !== value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/?${qs}` : "/";
  };
  const active = KEYS.some((k) => k !== "sort" && f[k]);

  return (
    <section className="pb-6">
      <form action="/" className="relative mb-5">
        {KEYS.filter((k) => k !== "q" && f[k]).map((k) => (
          <input key={k} type="hidden" name={k} value={f[k]} />
        ))}
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <input
          name="q"
          defaultValue={f.q}
          placeholder="Search for a reverb, a weird synth, a tag…"
          className="field !rounded-full !border-ink !py-4 !pl-12 !pr-32 text-lg shadow-[4px_4px_0_var(--ink)]"
          aria-label="Search plugins"
        />
        <button className="btn btn-pink absolute top-1/2 right-2 -translate-y-1/2 !py-2 !shadow-none" type="submit">
          Search
        </button>
      </form>

      <div className="mb-8 space-y-2.5">
        <FilterRow label="Type" items={CATEGORIES} current={f.category} hrefFor={(v) => href("category", v)} />
        <FilterRow label="Format" items={FORMATS} current={f.format} hrefFor={(v) => href("format", v)} />
        <FilterRow label="OS" items={OSES} current={f.os} hrefFor={(v) => href("os", v)} />
        <FilterRow label="DAW" items={DAWS} current={f.daw} hrefFor={(v) => href("daw", v)} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {plugins.length === 0 ? "No plugins" : `${plugins.length} plugin${plugins.length === 1 ? "" : "s"}`}
          {f.tag && (
            <>
              {" "}tagged <Link href={href("tag")} className="chip chip-on ml-1 !py-0.5">#{f.tag} ✕</Link>
            </>
          )}
          {active && (
            <Link href="/" className="ml-3 font-semibold text-ink underline underline-offset-2">
              Clear filters
            </Link>
          )}
        </p>
        <div className="flex rounded-full border-2 border-ink bg-white p-0.5 text-sm font-semibold">
          {(["new", "popular"] as const).map((s) => {
            const on = (f.sort ?? "new") === s;
            return (
              <Link
                key={s}
                href={href("sort", s === "new" ? undefined : s)}
                className={`rounded-full px-3 py-1 capitalize ${on ? "bg-ink text-cream" : ""}`}
                aria-current={on ? "true" : undefined}
              >
                {s}
              </Link>
            );
          })}
        </div>
      </div>

      {plugins.length === 0 ? (
        <Empty filtered={active} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((p, i) => (
            <PluginCard key={p.id} p={p} i={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterRow({
  label,
  items,
  current,
  hrefFor,
}: {
  label: string;
  items: readonly string[];
  current?: string;
  hrefFor: (v: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      <span className="w-16 shrink-0 text-xs font-bold tracking-wider text-muted uppercase">{label}</span>
      {items.map((it) => (
        <Link key={it} href={hrefFor(it)} className={`chip shrink-0 hover:border-ink ${current === it ? "chip-on" : ""}`}>
          {it}
        </Link>
      ))}
    </div>
  );
}

function Empty({ filtered }: { filtered: boolean }) {
  return (
    <div className="card flex flex-col items-center gap-3 border-dashed px-6 py-16 text-center">
      <div className="text-5xl" aria-hidden>
        🎛️
      </div>
      <h2 className="font-display text-2xl font-bold">
        {filtered ? "Nothing matches that vibe" : "The rack is empty"}
      </h2>
      <p className="max-w-sm text-muted">
        {filtered ? "Try fewer filters or a different search." : "Be the first to share a plugin you built."}
      </p>
      <Link href={filtered ? "/" : "/upload"} className="btn btn-primary mt-2">
        {filtered ? "Clear filters" : "Upload a plugin"}
      </Link>
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <section className="pb-6">
      <div className="mb-5 h-[62px] rounded-full border-2 border-ink bg-white" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card h-72 animate-pulse border-line" />
        ))}
      </div>
    </section>
  );
}
