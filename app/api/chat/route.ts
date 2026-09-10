import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Bot livechat berbasis aturan (rule-based), TIDAK memanggil AI eksternal
// (jadi tidak perlu API key tambahan/biaya). Menjawab 3 hal:
//   1. Cek status pesanan kalau pengunjung menyebut kode order (JZT-XXXXXX)
//   2. Pertanyaan umum (FAQ) seputar JunzTopp
//   3. Kalau tidak ketemu jawabannya -> arahkan ke WhatsApp Anda
//
// UNTUK MENAMBAH FAQ BARU: tambahkan objek baru di array FAQ di bawah.
const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WHATSAPP_LINK || "https://wa.me/agenstyzenid";

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["berapa lama", "lama proses", "kapan masuk", "kapan selesai", "durasi"],
    answer:
      "Untuk sebagian besar produk, topup diproses otomatis 1-5 menit setelah pembayaran berhasil dikonfirmasi. Jika lebih dari 30 menit belum masuk, kirimkan kode pesanan Anda (contoh: JZT-AB12CD) di sini agar saya cek statusnya.",
  },
  {
    keywords: ["belum masuk", "belum diterima", "belum dapat", "diamond belum"],
    answer:
      "Mohon maaf atas ketidaknyamanannya. Kirimkan kode pesanan Anda (format JZT-XXXXXX) supaya saya bisa cek status transaksinya langsung.",
  },
  {
    keywords: ["cara bayar", "metode pembayaran", "bisa bayar pakai"],
    answer:
      "Pembayaran bisa dilakukan lewat metode yang muncul di halaman checkout (QRIS/transfer/e-wallet, tergantung metode aktif saat ini). Setelah bayar, status pesanan akan otomatis berubah begitu pembayaran terverifikasi.",
  },
  {
    keywords: ["diskon", "member", "daftar", "keuntungan daftar"],
    answer:
      "Mendaftar akun itu opsional. Kalau Anda daftar & login, Anda otomatis mendapat diskon member di setiap transaksi. Tanpa daftar pun Anda tetap bisa topup sebagai tamu.",
  },
  {
    keywords: ["refund", "uang kembali", "batal"],
    answer:
      "Untuk pengajuan refund/pembatalan pesanan, mohon hubungi admin kami langsung lewat WhatsApp agar bisa dibantu lebih cepat: " +
      WHATSAPP_LINK,
  },
];

function findOrderCode(text: string): string | null {
  const match = text.toUpperCase().match(/JZT-[A-Z0-9]{4,10}/);
  return match ? match[0] : null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "menunggu pembayaran",
  paid: "pembayaran diterima, sedang diproses ke sistem topup",
  processing: "sedang diproses oleh sistem topup",
  success: "berhasil, item sudah dikirim ke akun tujuan",
  failed: "gagal — silakan hubungi admin untuk bantuan lebih lanjut",
  expired: "kedaluwarsa (waktu pembayaran habis)",
};

export async function POST(req: Request) {
  const { message } = await req.json();
  const text: string = (message || "").toLowerCase();

  // 1. Cek apakah pesan menyebut kode order
  const orderCode = findOrderCode(message || "");
  if (orderCode) {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("order_code, status, created_at")
      .eq("order_code", orderCode)
      .single();

    if (order) {
      const label = STATUS_LABEL[order.status] || order.status;
      return NextResponse.json({
        reply: `Pesanan ${order.order_code} saat ini berstatus: ${label}. Dibuat pada ${new Date(
          order.created_at
        ).toLocaleString("id-ID")}.`,
      });
    }
    return NextResponse.json({
      reply: `Kode pesanan ${orderCode} tidak ditemukan di sistem kami. Mohon pastikan kode sudah benar, atau hubungi admin di ${WHATSAPP_LINK}.`,
    });
  }

  // 2. Cocokkan dengan FAQ
  const faqMatch = FAQ.find((item) => item.keywords.some((kw) => text.includes(kw)));
  if (faqMatch) {
    return NextResponse.json({ reply: faqMatch.answer });
  }

  // 3. Tidak ketemu jawaban -> arahkan ke WhatsApp
  return NextResponse.json({
    reply: `Maaf, saya belum bisa menjawab pertanyaan itu secara otomatis. Silakan hubungi admin kami langsung lewat WhatsApp untuk dibantu: ${WHATSAPP_LINK}`,
  });
}
