import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase mengarahkan user kembali ke sini setelah login lewat Google/OAuth.
// Daftarkan URL ini di Supabase Dashboard > Authentication > URL Configuration
// > Redirect URLs, contoh: https://domain-anda.vercel.app/auth/callback
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/akun`);
}
