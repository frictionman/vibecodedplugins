"use client";
import { useState } from "react";

export function CopyText({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`group w-full rounded-xl bg-cream px-3 py-2 text-left font-mono text-[11px] break-all hover:bg-lime/40 ${className}`}
      title="Copy"
    >
      {text}
      <span className="ml-2 font-sans font-semibold text-muted">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}
