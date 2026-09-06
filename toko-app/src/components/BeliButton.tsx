"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDeviceId } from "@/lib/device-id";

export default function BeliButton({ produkId, stokTersedia }: { produkId: string; stokTersedia: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBeli() {
    setLoading(true);
    setError("");
    try {
      const deviceId = getDeviceId();
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produkId, deviceId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat pesanan");
      router.push(`/checkout/${json.order.id}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={stokTersedia === 0 || loading}
        onClick={handleBeli}
      >
        {loading ? "Menyiapkan pembayaran..." : stokTersedia === 0 ? "Stok habis" : "Beli sekarang"}
      </button>
      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</p>}
    </>
  );
}
