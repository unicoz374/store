import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// PERINGATAN: hanya boleh dipakai di server (API routes / webhook),
// TIDAK BOLEH pernah diimpor di komponen "use client" karena memakai
// SUPABASE_SERVICE_ROLE_KEY yang bisa membaca/menulis semua data
// tanpa terikat RLS. Kalau bocor ke browser, keamanan database jebol.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
