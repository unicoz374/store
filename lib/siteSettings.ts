import { createClient } from "@/lib/supabase/server";

// Nilai default dipakai kalau baris di tabel site_settings belum ada
// (misal sesaat setelah deploy pertama sebelum schema.sql dijalankan).
const DEFAULTS = {
  site_name: process.env.NEXT_PUBLIC_SITE_NAME || "JunzTopp",
  whatsapp_link: process.env.NEXT_PUBLIC_WHATSAPP_LINK || "https://wa.me/agenstyzenid",
  default_theme: "dark" as "dark" | "light",
  maintenance_mode: false,
  announcement: "",
};

export type SiteSettings = typeof DEFAULTS;

// Dipanggil di Server Component (mis. app/layout.tsx, app/page.tsx) supaya
// admin bisa ubah nama situs / link WA / pengumuman lewat halaman /admin
// TANPA perlu redeploy ke Vercel — perubahan langsung tampil di halaman.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("key,value");

    const result = { ...DEFAULTS };
    for (const row of data || []) {
      if (row.key in result) {
        (result as any)[row.key] = row.value;
      }
    }
    return result;
  } catch {
    return DEFAULTS;
  }
}
