export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="18" fill="var(--lime)" stroke="var(--ink)" strokeWidth="2.5" />
      <g className="knob-spin">
        <circle cx="20" cy="20" r="10" fill="white" stroke="var(--ink)" strokeWidth="2.5" />
        <line x1="20" y1="20" x2="20" y2="12.5" stroke="var(--ink)" strokeWidth="2.8" strokeLinecap="round" />
      </g>
      <circle cx="8" cy="31" r="2" fill="var(--pink)" />
      <circle cx="32" cy="31" r="2" fill="var(--violet)" />
    </svg>
  );
}
