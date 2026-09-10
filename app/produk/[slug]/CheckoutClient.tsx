"use client";

import { useState } from "react";

type Variant = { id: string; name: string; sell_price: number };

export default function CheckoutClient({
  product,
  variants,
  isLoggedIn,
}: {
  product: { name: string; input_label: string; input_placeholder: string; needs_server_id: boolean };
  variants: Variant[];
  isLoggedIn: boolean;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id || "");
  const [targetId, setTargetId] = useState("");
  const [targetServer, setTargetServer] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestWhatsapp, setGuestWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setError("");
    if (!variantId || !targetId) {
      setError("Lengkapi pilihan nominal dan ID akun tujuan.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, targetId, targetServer, guestEmail, guestWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(`Pesanan dibuat: ${data.orderCode}. Silakan lanjutkan pembayaran QRIS yang tersedia.`);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Pilih Nominal</label>
        <div className="grid grid-cols-2 gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariantId(v.id)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                variantId === v.id
                  ? "border-brand bg-brand-soft dark:bg-brand-softDark"
                  : "border-borderc dark:border-borderc-dark"
              }`}
            >
              {v.name}
              <br />
              <span className="text-xs text-ink-muted dark:text-ink-mutedDark">
                Rp{v.sell_price.toLocaleString("id-ID")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{product.input_label}</label>
        <input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder={product.input_placeholder}
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
        />
      </div>

      {product.needs_server_id && (
        <div>
          <label className="mb-1 block text-sm font-medium">Server ID</label>
          <input
            value={targetServer}
            onChange={(e) => setTargetServer(e.target.value)}
            placeholder="Contoh: 1234"
            className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
          />
        </div>
      )}

      {!isLoggedIn && (
        <div className="rounded-lg border border-dashed border-borderc dark:border-borderc-dark p-4">
          <p className="mb-2 text-sm text-ink-muted dark:text-ink-mutedDark">
            Transaksi sebagai tamu — isi salah satu agar bisa kami hubungi:
          </p>
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="Email"
            className="mb-2 w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-2 text-sm"
          />
          <input
            value={guestWhatsapp}
            onChange={(e) => setGuestWhatsapp(e.target.value)}
            placeholder="Nomor WhatsApp"
            className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={checkout}
        disabled={loading}
        className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Bayar Sekarang"}
      </button>
    </div>
  );
}
