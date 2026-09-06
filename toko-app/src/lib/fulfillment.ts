import { adminDb } from "./firebase-admin";
import type { Order, StokItem } from "./types";

/**
 * Dipanggil oleh SEMUA webhook gateway (Midtrans/Tripay/Xendit/Duitku) ketika status = paid.
 * Ini jantung fitur "auto order": begitu pembayaran terverifikasi gateway,
 * sistem otomatis mengalokasikan 1 stok yang belum terjual ke order ini,
 * menandainya terjual, dan order berubah jadi 'paid' — pembeli lalu bisa
 * membuka struk & detail produk di halaman checkout/riwayat tanpa admin turun tangan.
 *
 * Idempotent: aman dipanggil berkali-kali (webhook kadang dikirim ulang oleh gateway).
 */
export async function fulfillOrder(orderId: string, paymentRef: string): Promise<{ ok: boolean; message: string }> {
  return adminDb.runTransaction(async (tx) => {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists) {
      return { ok: false, message: `Order ${orderId} tidak ditemukan` };
    }

    const order = orderSnap.data() as Order;

    // Idempotency guard: kalau sudah paid & sudah punya stokId, jangan alokasikan stok lagi
    if (order.status === "paid" && order.stokId) {
      return { ok: true, message: "Order sudah pernah difulfill sebelumnya (idempotent)" };
    }

    // Ambil 1 stok yang belum terjual untuk produk ini
    const stokQuery = await tx.get(
      adminDb.collection("stok").where("produkId", "==", order.produkId).where("terjual", "==", false).limit(1)
    );

    if (stokQuery.empty) {
      // Kasus langka: stok habis di antara waktu checkout & pembayaran sukses.
      // Order tetap ditandai paid supaya admin tahu harus refund/restock manual,
      // tapi stokId dibiarkan null sbg penanda "belum terkirim".
      tx.update(orderRef, { status: "paid", paidAt: Date.now(), paymentRef });
      return { ok: false, message: "Dibayar, tapi stok telah habis — perlu tindakan admin (refund/restock)" };
    }

    const stokDoc = stokQuery.docs[0];
    const stok = stokDoc.data() as StokItem;

    tx.update(stokDoc.ref, { terjual: true, orderId, soldAt: Date.now() });
    tx.update(orderRef, { status: "paid", paidAt: Date.now(), stokId: stok.id, paymentRef });

    return { ok: true, message: "Order berhasil difulfill otomatis, stok teralokasi" };
  });
}

/** Menandai order gagal/expired (dipanggil webhook saat status failed/expired) */
export async function failOrder(orderId: string, status: "failed" | "expired"): Promise<void> {
  const orderRef = adminDb.collection("orders").doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) return;
  const order = snap.data() as Order;
  if (order.status === "paid") return; // jangan timpa order yang sudah terlanjur paid
  await orderRef.update({ status });
}
