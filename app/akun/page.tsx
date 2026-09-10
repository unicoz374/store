import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function AkunPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, discount_percent, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-display text-2xl font-bold">Akun Saya</h1>
      <div className="mt-6 space-y-2 rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-6">
        <p>
          <span className="text-ink-muted dark:text-ink-mutedDark">Nama:</span>{" "}
          {profile?.full_name || "-"}
        </p>
        <p>
          <span className="text-ink-muted dark:text-ink-mutedDark">Email:</span> {profile?.email}
        </p>
        <p>
          <span className="text-ink-muted dark:text-ink-mutedDark">Diskon member:</span>{" "}
          {profile?.discount_percent ?? 0}%
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/riwayat" className="rounded-lg bg-brand px-5 py-3 text-white hover:bg-brand-hover">
          Lihat Riwayat Pesanan
        </Link>
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="rounded-lg border border-borderc dark:border-borderc-dark px-5 py-3"
          >
            Panel Admin
          </Link>
        )}
      </div>

      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
