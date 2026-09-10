"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// Halaman ini HANYA muncul saat PAYMENT_GATEWAY_ACTIVE=mock (lihat
// lib/payment/mock.ts). Tujuannya supaya Anda bisa melihat & mencoba
// seluruh alur checkout (pilih produk -> bayar -> status berhasil) SEBELUM
// memasang API key payment gateway asli. TIDAK ADA transaksi uang beneran.
export default function MockCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("order") || "";
  const amount = Number(params.get("amount") || 0);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function simulasikanBayar() {
    setStatus("loading");
    await fetch("/api/payment/webhook?gateway=mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode }),
    });
    setStatus("done");
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16 text-center">
      <div className="card p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Mode Simulasi (belum ada gateway asli)
        </p>
        <h1 className="mt-2 font-display text-xl font-bold">Halaman Pembayaran</h1>

        <div className="my-6 flex h-40 w-40 mx-auto items-center justify-center rounded-xl2 bg-brand-soft dark:bg-brand-softDark text-5xl">
          🧾
        </div>

        <p className="text-sm text-ink-muted dark:text-ink-mutedDark">Kode Pesanan</p>
        <p className="font-display text-lg font-bold">{orderCode}</p>
        <p className="mt-2 text-sm text-ink-muted dark:text-ink-mutedDark">Total Bayar</p>
        <p className="font-display text-2xl font-bold text-brand">
          Rp{amount.toLocaleString("id-ID")}
        </p>

        {status !== "done" ? (
          <button onClick={simulasikanBayar} disabled={status === "loading"} className="btn-primary mt-6 w-full">
            {status === "loading" ? "Memproses..." : "Simulasikan Pembayaran Berhasil"}
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="font-medium text-accent-cyan">✓ Pembayaran (simulasi) berhasil!</p>
            <Link href="/riwayat" className="btn-secondary block w-full">
              Lihat Riwayat Pesanan
            </Link>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-muted dark:text-ink-mutedDark">
        Ganti <code>PAYMENT_GATEWAY_ACTIVE</code> di Vercel ke <code>midtrans</code> atau{" "}
        <code>transaksikita</code> untuk pembayaran sungguhan.
      </p>
    </div>
  );
}
