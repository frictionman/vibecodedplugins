import { UploadForm } from "@/components/UploadForm";

export const metadata = { title: "Upload a plugin" };

export default function UploadPage() {
  return (
    <div className="pt-8 pb-10">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Share a plugin</h1>
      <p className="mt-2 mb-8 max-w-xl text-muted">
        Built something fun with AI? Zip it up, add a few details, and it&apos;s free for everyone. No account needed.
      </p>
      <UploadForm />
    </div>
  );
}
