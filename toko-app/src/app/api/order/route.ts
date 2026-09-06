import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveGateway } from "@/lib/gateways";
import type { Order, Produk, StokItem } from "@/lib/types";
import { ORDER_EXPIRE_MS } from "@/lib/types";

// Pengunjung memilih produk -> cek stok tersedia -> buat order pending -> minta QR/link ke gateway aktif
export async function POST(req: Request) {
  const { produkId, deviceId } = await req.json();

  if (!produkId || !deviceId) {
    return NextResponse.json({ error: "produkId dan deviceId wajib diisi" }, { status: 400 });
  }

  const produkSnap = await adminDb.collection("produk").doc(produkId).get();
  if (!produkSnap.exists) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }
  const produk = produkSnap.data() as Produk;
  if (!produk.aktif) {
    return NextResponse.json({ error: "Produk sedang tidak dijual" }, { status: 400 });
  }

  // Pastikan ada stok tersedia sebelum bikin order (mencegah pembeli bayar tapi stok habis)
  const stokSnap = await adminDb
    .collection("stok")
    .where("produkId", "==", produkId)
    .where("terjual", "==", false)
    .limit(1)
    .get();

  if (stokSnap.empty) {
    return NextResponse.json({ error: "Stok produk ini sedang habis" }, { status: 400 });
  }

  const orderId = `ORD${Date.now()}${nanoid(6).toUpperCase()}`;
  const now = Date.now();

  const { adapter, settings } = await getActiveGateway();
  const payment = await adapter.createPayment({
    orderId,
    amount: produk.harga,
    produkNama: produk.nama
  });

  const order: Order = {
    id: orderId,
    produkId,
    produkNama: produk.nama,
    harga: produk.harga,
    gateway: settings.active,
    status: "pending",
    deviceId,
    stokId: null,
    paymentUrl: payment.paymentUrl || null,
    qrString: payment.qrString || null,
    vaNumber: payment.vaNumber || null,
    paymentRef: payment.paymentRef,
    createdAt: now,
    expiredAt: now + ORDER_EXPIRE_MS,
    paidAt: null
  };

  await adminDb.collection("orders").doc(orderId).set(order);

  return NextResponse.json({ ok: true, order });
}

// Cek status order (dipakai halaman checkout utk polling sampai auto-terkonfirmasi)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId wajib diisi" }, { status: 400 });

  const snap = await adminDb.collection("orders").doc(orderId).get();
  if (!snap.exists) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ order: snap.data() });
}
