import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Dipakai di Server Components / Route Handlers untuk membaca sesi login user
// (RLS tetap aktif — hanya memakai publishable key, bukan service role).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Bisa diabaikan jika dipanggil dari Server Component murni (read-only) —
          // middleware.ts sudah menangani refresh session di setiap request.
        }
      },
    },
  });
}
