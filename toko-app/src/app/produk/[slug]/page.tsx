import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import type { Produk } from "@/lib/types";
import Navbar from "@/components/Navbar";
import BeliButton from "@/components/BeliButton";

// Sama seperti homepage: paksa render dinamis per-request supaya Next.js
// tidak mencoba menebak/prerender halaman produk saat build (build tidak tahu
// slug apa saja yang ada di Firestore, dan stok bisa berubah kapan saja).
export const dynamic = "force-dynamic";

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

async function getProdukBySlug(slug: string): Promise<Produk | null> {
  const snap = await adminDb.collection("produk").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Produk;
}

async function getStokTersedia(produkId: string): Promise<number> {
  const snap = await adminDb.collection("stok").where("produkId", "==", produkId).where("terjual", "==", false).get();
  return snap.size;
}

export default async function ProdukDetailPage({ params }: { params: { slug: string } }) {
  const produk = await getProdukBySlug(params.slug);
  if (!produk || !produk.aktif) notFound();

  const stokTersedia = await getStokTersedia(produk.id);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "48px 0 100px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 40 }}>
        <div>
          <div
            className="card"
            style={{
              aspectRatio: "16/9",
              marginBottom: 24,
              background: produk.gambarUrl
                ? `center/cover url(${produk.gambarUrl})`
                : "linear-gradient(135deg, #262b3a, #171a21)"
            }}
          />
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>{produk.nama}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {produk.deskripsi}
          </p>
        </div>

        <aside className="card" style={{ padding: 24, height: "fit-content", position: "sticky", top: 90 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Harga</span>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, margin: "6px 0 16px" }}>
            {formatRupiah(produk.harga)}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 20 }}>
            <span style={{ color: "var(--text-muted)" }}>Stok tersedia</span>
            <span className={stokTersedia > 0 ? "badge badge-success" : "badge badge-danger"}>
              {stokTersedia > 0 ? `${stokTersedia} akun siap kirim` : "Habis"}
            </span>
          </div>

          <BeliButton produkId={produk.id} stokTersedia={stokTersedia} />

          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.6 }}>
            Struk & detail akun otomatis tampil di halaman checkout begitu pembayaran QRIS Anda terverifikasi — tanpa
            menunggu konfirmasi admin.
          </p>
        </aside>
      </main>
    </>
  );
}
