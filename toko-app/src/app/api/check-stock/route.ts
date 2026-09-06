import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { decryptStock } from "@/lib/crypto-stok";
import type { Order, StokItem } from "@/lib/types";

/**
 * Endpoint "struk otomatis": frontend checkout melakukan polling ke sini.
 * Begitu webhook gateway sudah memproses pembayaran (fulfillOrder), order.status jadi 'paid'
 * dan stokId sudah teralokasi — endpoint ini akan mendekripsi data stok dan
 * mengembalikannya sebagai struk pembelian ke pembeli. Sebelum paid, data sensitif TIDAK PERNAH dikirim.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const deviceId = searchParams.get("deviceId");

  if (!orderId || !deviceId) {
    return NextResponse.json({ error: "orderId dan deviceId wajib diisi" }, { status: 400 });
  }

  const orderSnap = await adminDb.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }
  const order = orderSnap.data() as Order;

  // Proteksi dasar: hanya device yang membuat order ini yang bisa melihat struknya
  if (order.deviceId !== deviceId) {
    return NextResponse.json({ error: "Order ini bukan milik device Anda" }, { status: 403 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ status: order.status, message: "Pembayaran belum terkonfirmasi" });
  }

  if (!order.stokId) {
    return NextResponse.json({
      status: "paid",
      message: "Pembayaran berhasil, namun stok sedang diproses admin (stok sempat habis). Mohon tunggu atau hubungi CS."
    });
  }

  const stokSnap = await adminDb.collection("stok").doc(order.stokId).get();
  if (!stokSnap.exists) {
    return NextResponse.json({ error: "Data stok tidak ditemukan" }, { status: 404 });
  }
  const stok = stokSnap.data() as StokItem;
  const decrypted = decryptStock(stok.dataEncrypted);

  return NextResponse.json({
    status: "paid",
    struk: {
      orderId: order.id,
      produkNama: order.produkNama,
      harga: order.harga,
      paidAt: order.paidAt,
      dataAkun: decrypted // { email, password, twofa, catatan, ...field lain sesuai input admin }
    }
  });
}
