"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/akun");
    router.refresh();
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-2xl font-bold">Masuk ke JunzTopp</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-ink-mutedDark">
        Login bersifat opsional — hanya untuk mendapatkan diskon member. Anda tetap bisa{" "}
        <Link href="/" className="text-brand underline">
          topup tanpa akun
        </Link>
        .
      </p>

      <form onSubmit={login} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <button
        onClick={loginWithGoogle}
        className="mt-3 w-full rounded-lg border border-borderc dark:border-borderc-dark py-3 font-medium hover:bg-brand-soft dark:hover:bg-brand-softDark"
      >
        Lanjutkan dengan Google
      </button>

      <p className="mt-4 text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-brand underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
