import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const body = await req.json(); // { site_name, whatsapp_link, default_theme, maintenance_mode, announcement }
  const supabaseAdmin = createAdminClient();

  const updates = Object.entries(body).map(([key, value]) => ({ key, value }));
  const { error } = await supabaseAdmin.from("site_settings").upsert(updates);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
