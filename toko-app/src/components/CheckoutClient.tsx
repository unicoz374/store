"use client";

import { useEffect, useRef, useState } from "react";
import { getDeviceId } from "@/lib/device-id";
import QrisDisplay from "@/components/QrisDisplay";
import type { Order } from "@/lib/types";

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

interface Struk {
  orderId: string;
  produkNama: string;
  harga: number;
  paidAt: number;
  dataAkun: Record<string, string>;
}

export default function CheckoutClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [struk, setStruk] = useState<Struk | null>(null);
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll status order setiap 3 detik — begitu webhook gateway memproses pembayaran,
  // status berubah 'paid' di sini secara otomatis tanpa aksi manual apapun dari pembeli/admin.
  useEffect(() => {
    const deviceId = getDeviceId();

    async function poll() {
      const res = await fetch(`/api/order?orderId=${orderId}`);
      const json = await res.json();
      if (!res.ok) return;
      setOrder(json.order);

      if (json.order.status === "paid") {
        const strukRes = await fetch(`/api/check-stock?orderId=${orderId}&deviceId=${deviceId}`);
        const strukJson = await strukRes.json();
        if (strukJson.struk) {
          setStruk(strukJson.struk);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } else if (json.order.status === "expired" || json.order.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const tick = () => setSisaWaktu(Math.max(0, order.expiredAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order]);

  if (!order) {
    return <p style={{ color: "var(--text-muted)" }}>Memuat pesanan...</p>;
  }

  // ---- STRUK OTOMATIS ----
  if (struk) {
    return (
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--success-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--success)",
              fontSize: 20
            }}
          >
            ✓
          </span>
          <div>
            <h2 style={{ fontSize: 18 }}>Pembayaran berhasil</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Struk & detail akun sudah tersedia</p>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 18, marginBottom: 18 }}>
          <Row label="No. Pesanan" value={struk.orderId} />
          <Row label="Produk" value={struk.produkNama} />
          <Row label="Total dibayar" value={formatRupiah(struk.harga)} />
          <Row label="Waktu bayar" value={new Date(struk.paidAt).toLocaleString("id-ID")} />
        </div>

        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: 16
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10, fontWeight: 600 }}>
            DETAIL AKUN ANDA
          </p>
          {Object.entries(struk.dataAkun).map(([key, value]) => (
            <Row key={key} label={key} value={value} mono />
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 16 }}>
          Simpan struk ini. Anda juga bisa membukanya kembali lewat halaman{" "}
          <a href="/riwayat" style={{ color: "var(--accent-hover)" }}>
            Riwayat Pesanan
          </a>{" "}
          selama 30 hari.
        </p>
      </div>
    );
  }

  // ---- MENUNGGU PEMBAYARAN ----
  if (order.status === "expired" || order.status === "failed") {
    return (
      <div className="card" style={{ padding: 28, textAlign: "center" }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Pesanan {order.status === "expired" ? "kedaluwarsa" : "gagal"}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Silakan buat pesanan baru dari halaman produk.</p>
      </div>
    );
  }

  const menit = Math.floor(sisaWaktu / 60000);
  const detik = Math.floor((sisaWaktu % 60000) / 1000);

  return (
    <div className="card" style={{ padding: 28, textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{order.produkNama}</p>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>{formatRupiah(order.harga)}</h2>

      {order.qrString ? (
        <QrisDisplay qrString={order.qrString} />
      ) : order.paymentUrl ? (
        <a href={order.paymentUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginBottom: 16 }}>
          Buka halaman pembayaran
        </a>
      ) : null}

      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Scan QRIS di atas menggunakan e-wallet/m-banking apa saja</p>
      <p style={{ fontSize: 13, color: "var(--warning)", fontWeight: 600 }}>
        Selesaikan dalam {menit}:{detik.toString().padStart(2, "0")}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 18 }}>
        Halaman ini otomatis memperbarui status — jangan tutup, struk akan langsung muncul begitu pembayaran
        terverifikasi.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "5px 0" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "monospace" : "inherit", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
