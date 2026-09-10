import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Dipakai di komponen "use client" (form login, daftar, tombol logout, dsb).
export const createClient = () => createBrowserClient(supabaseUrl!, supabaseKey!);
