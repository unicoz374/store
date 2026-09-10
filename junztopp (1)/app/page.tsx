import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "@/components/FeedbackForm";

export const revalidate = 30;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("sort_order");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, image_url, category_id")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      {/* HERO */}
      <section className="rounded-xl2 bg-gradient-to-br from-brand to-accent-cyan p-10 text-white shadow-glow sm:p-16">
        <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
          Topup Game & Pulsa,
          <br />
          Cepat &amp; Terpercaya.
        </h1>
        <p className="mt-4 max-w-lg text-white/90">
          Transaksi tanpa perlu daftar akun. Daftar & login kalau mau, biar dapat diskon member
          setiap belanja.
        </p>
        <a
          href="#produk"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand hover:bg-white/90"
        >
          Lihat Produk
        </a>
      </section>

      {/* KATEGORI */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold">Kategori</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(categories || []).map((c) => (
            <div
              key={c.id}
              className="rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-5 text-center font-medium"
            >
              {c.name}
            </div>
          ))}
        </div>
      </section>

      {/* PRODUK */}
      <section id="produk" className="mt-12">
        <h2 className="font-display text-xl font-bold">Produk Populer</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {(products || []).map((p) => (
            <Link
              key={p.id}
              href={`/produk/${p.slug}`}
              className="group rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-4 transition hover:shadow-glow"
            >
              <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-brand-soft dark:bg-brand-softDark text-3xl">
                🎮
              </div>
              <p className="font-display font-semibold">{p.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted dark:text-ink-mutedDark">
                {p.description}
              </p>
            </Link>
          ))}
          {(!products || products.length === 0) && (
            <p className="col-span-full text-ink-muted dark:text-ink-mutedDark">
              Belum ada produk. Tambahkan lewat Supabase Table Editor > products.
            </p>
          )}
        </div>
      </section>

      {/* FEEDBACK */}
      <section className="mt-16">
        <h2 className="text-center font-display text-xl font-bold">Kritik & Saran</h2>
        <p className="mt-1 text-center text-sm text-ink-muted dark:text-ink-mutedDark">
          Masukan Anda membantu kami terus memperbaiki layanan.
        </p>
        <div className="mt-6">
          <FeedbackForm />
        </div>
      </section>
    </div>
  );
}
