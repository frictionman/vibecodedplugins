import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "vibecoded plugins: free VST3, AU & CLAP plugins", template: "%s · vibecoded plugins" },
  description: "Upload and discover free, vibe coded audio plugins for your DAW. VST3, AU and CLAP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="vibecoded plugins home">
            <Logo />
            <span className="font-display text-xl font-extrabold tracking-tight">
              vibecoded<span className="text-pink">.</span>plugins
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/guidelines" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white sm:block">
              Safety
            </Link>
            <Link href="/upload" className="btn btn-primary !px-4 !py-2 text-sm">
              <span aria-hidden>＋</span> Upload
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-5 py-10 text-sm text-muted">
          <div className="flex flex-col justify-between gap-3 border-t-2 border-dashed border-line pt-6 sm:flex-row">
            <p>
              Every plugin here is free and made by the community.{" "}
              <Link href="/guidelines" className="font-semibold text-ink underline decoration-pink decoration-2 underline-offset-2">
                Plugins are not reviewed
              </Link>
              , so scan downloads before you use them.
            </p>
            <p className="shrink-0">Made with good vibes ✦</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
