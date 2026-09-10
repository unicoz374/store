import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/siteSettings";
import AdminSettingsForm from "./AdminSettingsForm";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/akun");

  const settings = await getSiteSettings();
  const admin = createAdminClient();
  const { data: feedback } = await admin
    .from("feedback")
    .select("name, message_filtered, was_censored, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-2xl font-bold">Panel Admin</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-ink-mutedDark">
        Ubah pengaturan situs kapan saja tanpa perlu deploy ulang. Untuk kelola produk, nominal,
        dan kode SKU Digiflazz, buka Supabase Dashboard &gt; Table Editor &gt; tabel{" "}
        <code>products</code> / <code>product_variants</code>.
      </p>

      <div className="mt-6">
        <AdminSettingsForm initial={settings} />
      </div>

      <h2 className="mt-10 font-display text-lg font-bold">Kritik & Saran Terbaru</h2>
      <div className="mt-3 space-y-2">
        {(feedback || []).map((f, i) => (
          <div
            key={i}
            className="rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-4 text-sm"
          >
            <p className="font-medium">
              {f.name} {f.was_censored && <span className="text-xs text-amber-500">(disensor)</span>}
            </p>
            <p>{f.message_filtered}</p>
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-mutedDark">
              {new Date(f.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
