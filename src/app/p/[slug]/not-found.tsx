import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto my-16 max-w-md p-10 text-center">
      <div className="text-5xl" aria-hidden>🔇</div>
      <h1 className="mt-3 font-display text-2xl font-bold">This plugin went quiet</h1>
      <p className="mt-2 text-muted">It may have been removed or hidden after reports.</p>
      <Link href="/" className="btn btn-primary mt-6">Browse plugins</Link>
    </div>
  );
}
