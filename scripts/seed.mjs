// Seeds a running dev server with demo plugins: `npm run dev` then `npm run seed`.
// The zips contain empty placeholder bundles, so they're for trying the site out only.
import JSZip from "jszip";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const demos = [
  { name: "Wobble Box", author: "tapehead", category: "Effect", tagline: "Wonky tape wobble that makes everything sound like a 1994 cassette.", tags: "lofi, tape, saturation", os: ["macOS", "Windows"], daw: ["Ableton Live", "FL Studio"], bundles: ["Wobble Box.vst3", "Wobble Box.component"], builtWith: "Claude + JUCE" },
  { name: "Glitter Pad", author: "softsynthsally", category: "Synth", tagline: "Shimmering supersaw pads with a sparkle knob. That's the whole plugin.", tags: "pads, ambient, supersaw", os: ["macOS", "Windows", "Linux"], daw: ["Bitwig", "Reaper"], bundles: ["Glitter Pad.vst3", "Glitter Pad.clap"], builtWith: "Cursor" },
  { name: "Kick Cannon", author: "808mafia", category: "Drums", tagline: "One knob kick designer. Turn right for more boom.", tags: "kick, 808, drums", os: ["Windows"], daw: ["FL Studio"], bundles: ["Kick Cannon.vst3"], builtWith: "Claude" },
  { name: "Chord Goblin", author: "midimonk", category: "MIDI", tagline: "Feeds on single notes, spits out jazzy chords.", tags: "chords, midi, generator", os: ["macOS"], daw: ["Logic Pro", "Ableton Live"], bundles: ["Chord Goblin.component", "Chord Goblin.clap"], builtWith: "Claude Code" },
  { name: "Tiny Meter", author: "gainstage", category: "Utility", tagline: "A very small, very honest LUFS meter.", tags: "metering, loudness, mixing", os: ["macOS", "Windows", "Linux"], daw: ["Reaper", "Cubase", "Studio One"], bundles: ["Tiny Meter.vst3", "Tiny Meter.clap", "Tiny Meter.component"], builtWith: "" },
  { name: "Crate Digger", author: "dustyfingers", category: "Sampler", tagline: "Drag in a loop, it chops it into 16 pads with vinyl crackle.", tags: "sampler, chops, lofi", os: ["macOS", "Windows"], daw: ["Ableton Live", "FL Studio", "Logic Pro"], bundles: ["Crate Digger.vst3"], builtWith: "Claude" },
];

for (const d of demos) {
  const zip = new JSZip();
  for (const b of d.bundles) zip.file(`${b}/Contents/README.txt`, "placeholder");
  const blob = new Blob([await zip.generateAsync({ type: "uint8array" })], { type: "application/zip" });
  const fd = new FormData();
  for (const k of ["name", "author", "category", "tagline", "tags", "builtWith"]) fd.set(k, d[k]);
  fd.set("description", `${d.tagline}\n\nThis is a demo listing created by the seed script.`);
  d.os.forEach((o) => fd.append("os", o));
  d.daw.forEach((o) => fd.append("daw", o));
  fd.set("agree", "yes");
  fd.set("file", blob, `${d.name}.zip`);
  const res = await fetch(`${BASE}/api/plugins`, { method: "POST", body: fd, headers: { "x-forwarded-for": `seed-${d.name}` } });
  console.log(d.name, res.status, await res.text());
}
