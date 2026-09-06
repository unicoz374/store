import { NextResponse } from "next/server";
import { createAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

// Rate limiting sederhana berbasis memori (per instance server) untuk memperlambat
// brute-force password admin. CATATAN: pada hosting serverless (Vercel dsb) tiap
// invocation bisa dapat instance/memori berbeda sehingga proteksi ini tidak 100%
// konsisten — untuk produksi tetap disarankan tambah proteksi di level hosting
// (mis. Vercel WAF/rate limit, atau Cloudflare) sebagai lapisan tambahan.
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 5 * 60 * 1000; // 5 menit

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, blockedUntil: 0 };

  if (entry.blockedUntil > now) {
    const sisaMenit = Math.ceil((entry.blockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${sisaMenit} menit.` },
      { status: 429 }
    );
  }

  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + BLOCK_MS;
      entry.count = 0;
    }
    attempts.set(ip, entry);
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  attempts.delete(ip);

  const token = createAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 12, // 12 jam
    path: "/"
  });
  return res;
}
