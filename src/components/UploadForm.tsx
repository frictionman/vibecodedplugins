"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, DAWS, MAX_IMAGE_BYTES, MAX_PLUGIN_BYTES, OSES } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { CopyText } from "./CopyText";

type Result = { slug: string; manageToken: string; formats: string[] };

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function pickFile(f: File | undefined | null) {
    setError("");
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".zip")) return setError("Zip up your plugin first (.zip).");
    if (f.size > MAX_PLUGIN_BYTES) return setError("Plugin zips can be at most 100 MB.");
    setFile(f);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Add your plugin zip.");
    const fd = new FormData(e.currentTarget);
    fd.set("file", file);
    if (shot) fd.set("screenshot", shot.file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/plugins");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(ev.loaded / ev.total);
    xhr.onload = () => {
      setProgress(null);
      let data: { error?: string } & Partial<Result> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.slug) {
        setResult(data as Result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(data.error ?? "Upload failed. Try again?");
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Network hiccup. Try again?");
    };
    setProgress(0);
    xhr.send(fd);
  }

  if (result) {
    const manageUrl = `${window.location.origin}/p/${result.slug}/manage#${result.manageToken}`;
    return (
      <div className="card pop-in mx-auto max-w-xl p-8 text-center shadow-[6px_6px_0_var(--ink)]">
        <div className="text-6xl" aria-hidden>🎉</div>
        <h2 className="mt-3 font-display text-3xl font-extrabold">It&apos;s live!</h2>
        <p className="mt-2 text-muted">
          We found {result.formats.join(", ")} inside your zip. Thanks for sharing.
        </p>
        <Link href={`/p/${result.slug}`} className="btn btn-primary mt-6">See your plugin →</Link>
        <div className="mt-8 rounded-2xl border-2 border-dashed border-pink p-4 text-left">
          <p className="text-sm font-bold">🔑 Save your secret manage link</p>
          <p className="mb-3 text-xs text-muted">It&apos;s the only way to delete this plugin later. We can&apos;t show it again.</p>
          <CopyText text={manageUrl} />
        </div>
      </div>
    );
  }

  const busy = progress !== null;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {/* left: files */}
      <div className="space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInput.current?.click()}
          className={`card flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-8 text-center transition-all ${
            drag ? "-rotate-1 bg-lime/40" : file ? "bg-lime/25" : "hover:bg-white/60"
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
        >
          <input ref={fileInput} type="file" accept=".zip,application/zip" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
          <div className="text-5xl" aria-hidden>{file ? "📦" : "🎛️"}</div>
          {file ? (
            <>
              <p className="font-display text-xl font-bold break-all">{file.name}</p>
              <p className="text-sm text-muted">{formatBytes(file.size)} · click to swap</p>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold">Drop your plugin .zip here</p>
              <p className="max-w-xs text-sm text-muted">
                Include your <b>.vst3</b>, <b>.component</b> (AU) and/or <b>.clap</b> files. We detect the formats
                automatically. Max 100 MB.
              </p>
            </>
          )}
        </div>

        <div>
          <span className="label">Screenshot <span className="font-normal text-muted">(optional, makes it pop)</span></span>
          <label className="card flex aspect-[22/13] cursor-pointer items-center justify-center overflow-hidden border-dashed text-sm text-muted hover:bg-white/60">
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.url} alt="Screenshot preview" className="h-full w-full object-cover" />
            ) : (
              <span>＋ PNG, JPG, WebP or GIF · up to 5 MB</span>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > MAX_IMAGE_BYTES) return setError("Screenshots can be at most 5 MB.");
                setShot({ file: f, url: URL.createObjectURL(f) });
              }}
            />
          </label>
        </div>
      </div>

      {/* right: details */}
      <div className="card space-y-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Plugin name" name="name" placeholder="Wobble Box" max={60} required />
          <Field label="Your name or handle" name="author" placeholder="@beatwizard" max={60} required />
        </div>
        <Field label="Tagline" name="tagline" placeholder="A wonky tape-wobble effect that makes everything sound like 1994" max={120} required />
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" required maxLength={5000} rows={5} className="field" placeholder="What does it do? How do you use it? Any quirks or known bugs?" />
        </div>

        <Pills label="Category" name="category" items={CATEGORIES} type="radio" />
        <Pills label="Works on" name="os" items={OSES} type="checkbox" />
        <Pills label="Tested in" name="daw" items={DAWS} type="checkbox" optional />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tags" name="tags" placeholder="lofi, tape, saturation" max={200} hint="comma separated" />
          <Field label="Version" name="version" placeholder="1.0.0" max={20} />
          <Field label="Vibe coded with" name="builtWith" placeholder="Claude, Cursor, JUCE…" max={60} hint="optional" />
          <Field label="Source code link" name="sourceUrl" placeholder="https://github.com/…" max={300} type="url" hint="optional" />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-4 text-sm">
          <input type="checkbox" name="agree" value="yes" required className="mt-0.5 h-4 w-4 accent-pink" />
          <span>
            I made this plugin (or have the right to share it), it&apos;s free, and it contains no malware, adware or
            anything sneaky. I&apos;ve read the <Link href="/guidelines" target="_blank" className="font-semibold underline">guidelines</Link>.
          </span>
        </label>

        {error && <p className="rounded-2xl bg-pink/15 px-4 py-3 text-sm font-semibold text-[#b0175c]" role="alert">{error}</p>}

        <button disabled={busy} className="btn btn-pink relative w-full overflow-hidden text-lg">
          {busy && <span className="absolute inset-y-0 left-0 bg-ink/20 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />}
          <span className="relative">
            {busy ? (progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Checking your zip…") : "Share it with the world ✦"}
          </span>
        </button>
      </div>
    </form>
  );
}

function Field({
  label, name, placeholder, max, required, hint, type = "text",
}: { label: string; name: string; placeholder?: string; max: number; required?: boolean; hint?: string; type?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {hint && <span className="font-normal text-muted">({hint})</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} maxLength={max} required={required} className="field" />
    </div>
  );
}

function Pills({
  label, name, items, type, optional,
}: { label: string; name: string; items: readonly string[]; type: "radio" | "checkbox"; optional?: boolean }) {
  return (
    <fieldset>
      <legend className="label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <label key={it} className="cursor-pointer">
            <input type={type} name={name} value={it} required={type === "radio" && i === 0} className="peer sr-only" />
            <span className="chip peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-pink hover:border-ink">{it}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
