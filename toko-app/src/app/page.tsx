import { adminDb } from "@/lib/firebase-admin";
import type { Produk, ProdukList } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";

// PENTING: dibuat dinamis (bukan revalidate/ISR) supaya Next.js TIDAK mencoba
// mengambil data dari Firestore saat proses build ("next build" / "Export").
// Halaman ini akan selalu di-render fresh setiap ada request masuk — cocok
// untuk etalase toko yang datanya (stok/produk) berubah setiap saat oleh admin.
export const dynamic = "force-dynamic";

async function getData(): Promise<{ produk: Produk[]; list: ProdukList[] }> {
  try {
    const [produkSnap, listSnap] = await Promise.all([
      adminDb.collection("produk").where("aktif", "==", true).orderBy("createdAt", "desc").get(),
      adminDb.collection("list").orderBy("urutan", "asc").get()
    ]);

    const produk = produkSnap.docs.map((d) => d.data() as Produk);
    const list = listSnap.docs.map((d) => d.data() as ProdukList);
    return { produk, list };
  } catch (err) {
    // Jangan sampai halaman utama ikut down kalau Firestore sempat bermasalah
    // (mis. index belum selesai dibuat, koneksi terputus sesaat, dll).
    // Error tetap dicatat di log server (terlihat di Vercel > Functions > Logs) untuk debugging.
    console.error("[HomePage] Gagal mengambil data produk:", err);
    return { produk: [], list: [] };
  }
}

export default async function HomePage() {
  const { produk, list } = await getData();

  const tanpaList = produk.filter((p) => !p.listId);
  const grouped = list.map((l) => ({ list: l, produk: produk.filter((p) => p.listId === l.id) }));

  return (
    <>
      <Navbar />
      <main>
        <section style={{ padding: "72px 0 40px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <h1 style={{ fontSize: 40, maxWidth: 560, marginBottom: 14 }}>
              Akun premium, terkirim otomatis begitu QRIS Anda dipindai.
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15.5, maxWidth: 480 }}>
              Pilih produk, bayar dengan gateway apapun yang tersedia, dan struk beserta detail akun langsung tampil —
              tanpa menunggu admin.
            </p>
          </div>
        </section>

        <section className="container" style={{ padding: "40px 0 80px" }}>
          {produk.length === 0 && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px 0" }}>
              Belum ada produk tersedia saat ini.
            </p>
          )}

          {grouped.map(
            (g) =>
              g.produk.length > 0 && (
                <div key={g.list.id} style={{ marginBottom: 44 }}>
                  <h2 style={{ fontSize: 20, marginBottom: 18 }}>{g.list.nama}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
                    {g.produk.map((p) => (
                      <ProductCard key={p.id} produk={p} />
                    ))}
                  </div>
                </div>
              )
          )}

          {tanpaList.length > 0 && (
            <div>
              {grouped.some((g) => g.produk.length > 0) && <h2 style={{ fontSize: 20, marginBottom: 18 }}>Lainnya</h2>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
                {tanpaList.map((p) => (
                  <ProductCard key={p.id} produk={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
