import Link from "next/link";

export const metadata = { title: "Safety & guidelines" };

const SECTIONS = [
  {
    emoji: "🛡️",
    title: "Downloading safely",
    points: [
      "Plugins are programs that run inside your DAW. Nothing here is reviewed by a human before it goes live.",
      "Scan every download with antivirus before installing it.",
      "Prefer plugins that link to their source code, so you (or someone) can check what they do.",
      "Compare the SHA-256 on the plugin page with your file to be sure it wasn't changed along the way.",
      "On macOS, unsigned plugins may be blocked by Gatekeeper. Only allow them if you trust the maker.",
    ],
  },
  {
    emoji: "📦",
    title: "Uploading",
    points: [
      "Upload a .zip with your .vst3, .component (AU) and/or .clap files inside. We detect the formats from the zip.",
      "Max 100 MB per plugin, 5 MB per screenshot, and 5 uploads per hour.",
      "Only share plugins you made or have the right to share. Everything here must be free.",
      "No installers, crypto miners, adware, telemetry you don't disclose, or anything else sneaky.",
      "You get a secret manage link after uploading. Keep it to delete your plugin later.",
    ],
  },
  {
    emoji: "⚑",
    title: "Reporting",
    points: [
      "Every plugin page has a Report button.",
      "A plugin that gets 3 reports from different people is hidden automatically until it's reviewed.",
    ],
  },
];

export default function Guidelines() {
  return (
    <div className="mx-auto max-w-2xl pt-8 pb-10">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Safety & guidelines</h1>
      <p className="mt-3 text-lg text-muted">Keep the vibes good. Here&apos;s how this place works.</p>
      <div className="mt-8 space-y-5">
        {SECTIONS.map((s) => (
          <section key={s.title} className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              <span aria-hidden>{s.emoji}</span> {s.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pink" /> {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        All plugins are provided as-is by their makers, with no warranty. Use at your own risk.{" "}
        <Link href="/" className="font-semibold text-ink underline">Back to browsing</Link>
      </p>
    </div>
  );
}
