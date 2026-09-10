import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  success: "Berhasil",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};

export default async function RiwayatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("order_code, final_price, status, created_at, products(name), product_variants(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-2xl font-bold">Riwayat Pesanan</h1>

      <div className="mt-6 space-y-3">
        {(orders || []).map((o: any) => (
          <div
            key={o.order_code}
            className="flex items-center justify-between rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-4"
          >
            <div>
              <p className="font-medium">
                {o.products?.name} — {o.product_variants?.name}
              </p>
              <p className="text-xs text-ink-muted dark:text-ink-mutedDark">
                {o.order_code} · {new Date(o.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Rp{Number(o.final_price).toLocaleString("id-ID")}</p>
              <p className="text-xs">{STATUS_LABEL[o.status] || o.status}</p>
            </div>
          </div>
        ))}
        {(!orders || orders.length === 0) && (
          <p className="text-ink-muted dark:text-ink-mutedDark">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  );
}
