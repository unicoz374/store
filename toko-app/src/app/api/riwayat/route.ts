import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Order } from "@/lib/types";
import { RIWAYAT_EXPIRE_MS } from "@/lib/types";

/**
 * Riwayat pesanan per-device: setiap device (fingerprint disimpan di localStorage browser)
 * hanya bisa melihat riwayat order miliknya sendiri, dan otomatis "dilupakan" (tidak ditampilkan lagi)
 * setelah 30 hari sejak order dibuat — sesuai permintaan "otomatis refresh setiap 30 hari".
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) return NextResponse.json({ error: "deviceId wajib diisi" }, { status: 400 });

  const cutoff = Date.now() - RIWAYAT_EXPIRE_MS;

  const snap = await adminDb
    .collection("orders")
    .where("deviceId", "==", deviceId)
    .where("createdAt", ">=", cutoff)
    .orderBy("createdAt", "desc")
    .get();

  const orders = snap.docs.map((d) => {
    const o = d.data() as Order;
    // Jangan bocorkan paymentRef mentah gateway ke publik
    const { paymentRef, ...safe } = o;
    return safe;
  });

  return NextResponse.json({ orders });
}
