"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DaftarPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16 text-center">
        <h1 className="font-display text-xl font-bold">Cek email Anda</h1>
        <p className="mt-2 text-ink-muted dark:text-ink-mutedDark">
          Kami sudah mengirim link konfirmasi ke {email}. Klik link tersebut untuk mengaktifkan akun.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-2xl font-bold">Daftar Akun JunzTopp</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-ink-mutedDark">
        Daftar untuk mendapatkan diskon member di setiap transaksi. Opsional — tanpa daftar Anda
        tetap bisa topup.
      </p>

      <form onSubmit={daftar} className="mt-6 space-y-3">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nama lengkap"
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
        />
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 karakter)"
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
