import Link from "next/link";
import type { Produk } from "@/lib/types";

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function ProductCard({ produk }: { produk: Produk }) {
  return (
    <Link
      href={`/produk/${produk.slug}`}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "border-color 0.15s ease, transform 0.15s ease"
      }}
    >
      <div
        style={{
          aspectRatio: "16/10",
          background: produk.gambarUrl
            ? `center/cover url(${produk.gambarUrl})`
            : "linear-gradient(135deg, #262b3a, #171a21)",
          display: "grid",
          placeItems: "center"
        }}
      >
        {!produk.gambarUrl && (
          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--border)" }}>
            {produk.nama.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>{produk.nama}</h3>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 14,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {produk.deskripsi}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--accent-hover)" }}>
            {formatRupiah(produk.harga)}
          </span>
          <span className="badge badge-success">Ready</span>
        </div>
      </div>
    </Link>
  );
}
