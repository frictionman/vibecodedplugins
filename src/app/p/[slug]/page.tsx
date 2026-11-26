import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlugin } from "@/lib/plugins";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { PluginArt } from "@/components/PluginArt";
import { ReportButton } from "@/components/ReportButton";
import { CopyText } from "@/components/CopyText";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPlugin(slug);
  return p ? { title: p.name, description: p.tagline } : { title: "Plugin not found" };
}

export default function PluginPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <div className="pt-6 pb-10">
      <Link href="/" className="mb-6 inline-flex text-sm font-semibold text-muted hover:text-ink">
        ← All plugins
      </Link>
      <Suspense fallback={<div className="card h-96 animate-pulse border-line" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: { params: PageProps<"/p/[slug]">["params"] }) {
  const { slug } = await params;
  const p = await getPlugin(slug);
  if (!p) notFound();
  const c = CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.Utility;

  return (
    <article className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="card aspect-[22/13] overflow-hidden shadow-[6px_6px_0_var(--ink)]">
          <PluginArt slug={p.slug} name={p.name} category={p.category} screenshotKey={p.screenshotKey} />
        </div>
        <section>
          <h2 className="mb-2 font-display text-xl font-bold">About</h2>
          <div className="whitespace-pre-line leading-relaxed text-ink/85">{p.description}</div>
        </section>
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="chip hover:border-ink">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <div className="card p-6">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: c.bg, color: c.ink }}>
            {p.category}
          </span>
          <h1 className="mt-3 font-display text-4xl leading-none font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-2 text-muted">{p.tagline}</p>
          <p className="mt-3 text-sm">
            by <span className="font-semibold">{p.author}</span>
            {p.builtWith && <span className="text-muted"> · vibe coded with {p.builtWith}</span>}
          </p>

          <a href={`/api/plugins/${p.slug}/download`} className="btn btn-primary mt-5 w-full text-lg" download>
            ↓ Download free <span className="font-normal opacity-70">({formatBytes(p.fileSize)})</span>
          </a>
          <p className="mt-3 rounded-2xl bg-cream px-3 py-2 text-xs leading-relaxed text-muted">
            ⚠︎ Community upload, not reviewed. Scan it with antivirus and only run plugins from makers you trust.{" "}
            <Link href="/guidelines" className="font-semibold text-ink underline">
              Safety tips
            </Link>
          </p>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted">Formats</dt>
            <dd className="flex flex-wrap gap-1">
              {p.formats.map((f) => (
                <span key={f} className="rounded-md border border-ink px-1.5 font-mono text-xs leading-5 font-semibold">
                  {f}
                </span>
              ))}
            </dd>
            <dt className="text-muted">OS</dt>
            <dd>{p.oses.join(", ")}</dd>
            {p.daws.length > 0 && (
              <>
                <dt className="text-muted">Tested in</dt>
                <dd>{p.daws.join(", ")}</dd>
              </>
            )}
            <dt className="text-muted">Version</dt>
            <dd>{p.version}</dd>
            <dt className="text-muted">Added</dt>
            <dd>{formatDate(p.createdAt)}</dd>
            <dt className="text-muted">Downloads</dt>
            <dd>{p.downloads.toLocaleString()}</dd>
            {p.sourceUrl && (
              <>
                <dt className="text-muted">Source</dt>
                <dd className="truncate">
                  <a href={p.sourceUrl} rel="nofollow noopener noreferrer" target="_blank" className="font-semibold underline">
                    {p.sourceUrl.replace(/^https:\/\//, "")}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>

        <details className="card group p-5 text-sm">
          <summary className="cursor-pointer list-none font-semibold">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span> What&apos;s in the zip
          </summary>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {p.bundles.map((b) => (
              <li key={b}>📦 {b}</li>
            ))}
          </ul>
          <p className="mt-4 mb-1 text-xs text-muted">SHA-256 (to verify your download)</p>
          <CopyText text={p.sha256} />
        </details>

        <ReportButton slug={p.slug} />
      </aside>
    </article>
  );
}
