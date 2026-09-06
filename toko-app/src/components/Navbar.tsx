"use client";

import Link from "next/link";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KanzStore";

export default function Navbar() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "rgba(15,17,21,0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 40
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "var(--accent)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 15,
              color: "#fff"
            }}
          >
            K
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{STORE_NAME}</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ fontSize: 14.5, fontWeight: 500, color: "var(--text-muted)" }}>
            Produk
          </Link>
          <Link href="/riwayat" style={{ fontSize: 14.5, fontWeight: 500, color: "var(--text-muted)" }}>
            Riwayat Pesanan
          </Link>
        </nav>
      </div>
    </header>
  );
}
