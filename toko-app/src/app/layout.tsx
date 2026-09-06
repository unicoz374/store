import type { Metadata } from "next";
import "./globals.css";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KanzStore";

export const metadata: Metadata = {
  title: `${STORE_NAME} — Akun Premium Serba Instan`,
  description: "Belanja akun digital premium, dikirim otomatis begitu pembayaran QRIS masuk."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
