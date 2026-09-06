import { adminDb } from "@/lib/firebase-admin";
import type { Produk, ProdukList } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";

export const revalidate = 30; // etalase auto-refresh tiap 30 detik

async function getData() {
  const [produkSnap, listSnap] = await Promise.all([
    adminDb.collection("produk").where("aktif", "==", true).orderBy("createdAt", "desc").get(),
    adminDb.collection("list").orderBy("urutan", "asc").get()
  ]);

  const produk = produkSnap.docs.map((d) => d.data() as Produk);
  const list = listSnap.docs.map((d) => d.data() as ProdukList);
  return { produk, list };
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
