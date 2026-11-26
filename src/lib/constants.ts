export const FORMATS = ["VST3", "AU", "CLAP"] as const;
export const OSES = ["macOS", "Windows", "Linux"] as const;
export const CATEGORIES = [
  "Synth",
  "Effect",
  "Drums",
  "Sampler",
  "MIDI",
  "Utility",
] as const;
export const DAWS = [
  "Ableton Live",
  "Logic Pro",
  "FL Studio",
  "Bitwig",
  "Reaper",
  "Cubase",
  "Studio One",
  "Pro Tools",
  "GarageBand",
] as const;

export type Format = (typeof FORMATS)[number];

export const MAX_PLUGIN_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const REPORTS_TO_HIDE = 3;

/** Playful color per category, used for chips and placeholder art. */
export const CATEGORY_COLORS: Record<string, { bg: string; ink: string }> = {
  Synth: { bg: "#ffd6e8", ink: "#b0175c" },
  Effect: { bg: "#d4f5e9", ink: "#0d7a55" },
  Drums: { bg: "#ffe6c7", ink: "#b25a00" },
  Sampler: { bg: "#e2dcff", ink: "#5b3fd1" },
  MIDI: { bg: "#d6ecff", ink: "#1662b0" },
  Utility: { bg: "#efeae0", ink: "#5c5345" },
};
