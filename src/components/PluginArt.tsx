import { CATEGORY_COLORS } from "@/lib/constants";
import { seed } from "@/lib/format";

/** Screenshot if there is one, otherwise generated "faceplate" art unique to the plugin. */
export function PluginArt({
  slug,
  name,
  category,
  screenshotKey,
  className = "",
}: {
  slug: string;
  name: string;
  category: string;
  screenshotKey: string | null;
  className?: string;
}) {
  if (screenshotKey) {
    const file = screenshotKey.split("/").pop();
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/screenshots/${file}`} alt={`${name} screenshot`} className={`h-full w-full object-cover ${className}`} />
    );
  }
  const s = seed(slug);
  const c = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Utility;
  const knobs = 2 + (s % 3);
  const angles = Array.from({ length: knobs }, (_, i) => -120 + ((s >> (i * 4)) % 240));
  const wave = Array.from({ length: 24 }, (_, i) => {
    const y = 50 + Math.sin(i * (0.5 + (s % 7) / 10) + (s % 13)) * (8 + (s % 9));
    return `${i === 0 ? "M" : "L"}${10 + i * 8.7},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 220 130" className={`h-full w-full ${className}`} role="img" aria-label={`${name} artwork`}>
      <rect width="220" height="130" fill={c.bg} />
      <path d={wave} fill="none" stroke={c.ink} strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {angles.map((a, i) => {
        const cx = 220 / (knobs + 1) * (i + 1);
        return (
          <g key={i} transform={`translate(${cx} 92)`}>
            <circle r="17" fill="white" stroke="var(--ink)" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="0" y2="-11" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a})`} />
          </g>
        );
      })}
      <circle cx="200" cy="18" r="5" fill={c.ink} />
    </svg>
  );
}
