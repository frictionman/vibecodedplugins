"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

/** The manage token lives in the URL hash so it never reaches server logs. */
export function ManagePlugin({ slug }: { slug: string }) {
  const token = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash.slice(1),
    () => null
  );
  const [state, setState] = useState<"idle" | "confirm" | "deleting" | "deleted" | string>("idle");

  if (token === null) return null;

  return (
    <div className="card mx-auto my-12 max-w-lg p-8">
      <h1 className="font-display text-3xl font-extrabold">Manage your plugin</h1>
      {state === "deleted" ? (
        <>
          <p className="mt-3 text-muted">Deleted. The file and its page are gone.</p>
          <Link href="/" className="btn btn-primary mt-6">Back to browsing</Link>
        </>
      ) : !token ? (
        <p className="mt-3 text-muted">This link is missing its secret key. Use the full manage link you got after uploading.</p>
      ) : (
        <>
          <p className="mt-3 text-muted">
            This secret link lets you remove <Link className="font-semibold text-ink underline" href={`/p/${slug}`}>your plugin</Link>.
            To ship a new version for now, delete this one and upload again.
          </p>
          {state !== "idle" && state !== "confirm" && state !== "deleting" && <p className="mt-4 text-sm text-pink">{state}</p>}
          {state === "confirm" || state === "deleting" ? (
            <div className="mt-6 flex gap-2">
              <button
                disabled={state === "deleting"}
                className="btn btn-pink"
                onClick={async () => {
                  setState("deleting");
                  const res = await fetch(`/api/plugins/${slug}`, { method: "DELETE", headers: { "x-manage-token": token } });
                  const data = await res.json().catch(() => ({}));
                  setState(res.ok ? "deleted" : data.error ?? "Couldn't delete.");
                }}
              >
                {state === "deleting" ? "Deleting…" : "Yes, delete it forever"}
              </button>
              <button className="btn btn-plain" onClick={() => setState("idle")}>Keep it</button>
            </div>
          ) : (
            <button className="btn btn-plain mt-6" onClick={() => setState("confirm")}>Delete plugin</button>
          )}
        </>
      )}
    </div>
  );
}
