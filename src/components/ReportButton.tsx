"use client";
import { useState } from "react";

const REASONS = [
  ["malware", "Malware or suspicious behaviour"],
  ["broken", "Doesn't work / crashes my DAW"],
  ["stolen", "Stolen or not theirs to share"],
  ["inappropriate", "Inappropriate content"],
  ["other", "Something else"],
] as const;

export function ReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | string>("idle");

  if (state === "done") {
    return <p className="px-2 text-sm text-muted">Thanks, report received. Plugins with several reports get hidden for review.</p>;
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-2 text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">
        ⚑ Report this plugin
      </button>
    );
  }
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const res = await fetch(`/api/plugins/${slug}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, details }),
        });
        const data = await res.json().catch(() => ({}));
        setState(res.ok ? "done" : data.error ?? "Something went wrong.");
      }}
    >
      <p className="font-semibold">What&apos;s wrong?</p>
      {REASONS.map(([value, label]) => (
        <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="accent-pink" />
          {label}
        </label>
      ))}
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details (optional)" className="field text-sm" rows={2} maxLength={1000} />
      {state !== "idle" && state !== "sending" && <p className="text-sm text-pink">{state}</p>}
      <div className="flex gap-2">
        <button disabled={!reason || state === "sending"} className="btn btn-pink !py-2 text-sm">
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-plain !py-2 text-sm !shadow-none">
          Cancel
        </button>
      </div>
    </form>
  );
}
