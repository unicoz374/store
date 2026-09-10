import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import LiveChatWidget from "@/components/LiveChatWidget";
import { getSiteSettings } from "@/lib/siteSettings";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "JunzTopp — Topup Game & Pulsa Tercepat",
  description: "Topup game, pulsa, dan e-wallet cepat, aman, dan terpercaya bersama JunzTopp.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="id" className={settings.default_theme === "dark" ? "dark" : ""}>
      <head>
        {/* Mencegah "flash" tema salah sebelum React ter-hydrate:
            baca localStorage lebih dulu, baru pasang class dark/light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('junztopp-theme');
                if (t) document.documentElement.classList.toggle('dark', t === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${sora.variable} ${inter.variable}`}>
        {settings.maintenance_mode ? (
          <div className="flex min-h-screen items-center justify-center px-6 text-center">
            <div>
              <h1 className="font-display text-2xl font-bold">Sedang dalam pemeliharaan</h1>
              <p className="mt-2 text-ink-muted dark:text-ink-mutedDark">
                {settings.site_name} sedang kami perbarui. Silakan kembali lagi sebentar lagi.
              </p>
            </div>
          </div>
        ) : (
          <>
            {settings.announcement && (
              <div className="bg-brand px-4 py-2 text-center text-sm text-white">
                {settings.announcement}
              </div>
            )}
            <header className="sticky top-0 z-40 border-b border-borderc dark:border-borderc-dark bg-surface/80 dark:bg-surface-dark/80 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                <Link href="/" className="font-display text-xl font-bold text-brand">
                  {settings.site_name}
                </Link>
                <nav className="hidden gap-6 text-sm font-medium sm:flex">
                  <Link href="/">Beranda</Link>
                  <Link href="/riwayat">Riwayat</Link>
                  <Link href="/akun">Akun</Link>
                </nav>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link
                    href="/login"
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                  >
                    Masuk
                  </Link>
                </div>
              </div>
            </header>

            <main>{children}</main>

            <footer className="mt-16 border-t border-borderc dark:border-borderc-dark py-8 text-center text-sm text-ink-muted dark:text-ink-mutedDark">
              © {new Date().getFullYear()} {settings.site_name}. Semua transaksi diproses otomatis 24 jam.
            </footer>

            <LiveChatWidget />
          </>
        )}
      </body>
    </html>
  );
}
