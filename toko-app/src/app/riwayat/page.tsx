"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getDeviceId } from "@/lib/device-id";
import type { Order } from "@/lib/types";

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  paid: { text: "Berhasil", cls: "badge-success" },
  pending: { text: "Menunggu bayar", cls: "badge-warning" },
  expired: { text: "Kedaluwarsa", cls: "badge-danger" },
  failed: { text: "Gagal", cls: "badge-danger" }
};

export default function RiwayatPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch(`/api/riwayat?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then((json) => setOrders(json.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "48px 0 100px", maxWidth: 680 }}>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Riwayat Pesanan</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 28 }}>
          Riwayat ini khusus untuk device/browser ini, dan otomatis hilang setelah 30 hari.
        </p>

        {loading && <p style={{ color: "var(--text-muted)" }}>Memuat...</p>}
        {!loading && orders.length === 0 && (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px 0" }}>
            Belum ada riwayat pesanan dari device ini.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((o) => {
            const s = STATUS_LABEL[o.status];
            return (
              <Link
                key={o.id}
                href={`/checkout/${o.id}`}
                className="card"
                style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{o.produkNama}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {o.id} · {new Date(o.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, marginBottom: 6 }}>{formatRupiah(o.harga)}</p>
                  <span className={`badge ${s?.cls || "badge-warning"}`}>{s?.text || o.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
