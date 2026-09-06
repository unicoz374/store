import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { encryptStock } from "@/lib/crypto-stok";
import type { StokItem } from "@/lib/types";

// ---- addstok ----
// Body: { produkId, items: [{ email, password, twofa, catatan }, ...] }
// Mendukung tambah banyak stok sekaligus (bulk), format bebas field selain email/password/2fa.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { produkId, items } = body;

  if (!produkId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "produkId dan items[] wajib diisi" }, { status: 400 });
  }

  const batch = adminDb.batch();
  const now = Date.now();
  const createdIds: string[] = [];

  for (const item of items) {
    // item bebas berisi field apapun: email, password, twofa, backupCode, catatan, dll
    const id = nanoid(12);
    const dataEncrypted = encryptStock(item);
    const stok: StokItem = {
      id,
      produkId,
      dataEncrypted,
      terjual: false,
      orderId: null,
      createdAt: now,
      soldAt: null
    };
    batch.set(adminDb.collection("stok").doc(id), stok);
    createdIds.push(id);
  }

  await batch.commit();
  return NextResponse.json({ ok: true, jumlahDitambahkan: createdIds.length });
}

// ---- lihat ringkasan stok per produk (TIDAK mengembalikan data terenkripsi ke admin list view demi keamanan tampilan;
//       admin bisa lihat detail satu-satu lewat endpoint terpisah bila perlu) ----
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const produkId = searchParams.get("produkId");
  if (!produkId) return NextResponse.json({ error: "produkId wajib diisi" }, { status: 400 });

  const snap = await adminDb.collection("stok").where("produkId", "==", produkId).get();
  const stok = snap.docs.map((d) => {
    const data = d.data() as StokItem;
    return { id: data.id, terjual: data.terjual, createdAt: data.createdAt, soldAt: data.soldAt };
  });

  const tersedia = stok.filter((s) => !s.terjual).length;
  return NextResponse.json({ stok, tersedia, total: stok.length });
}

// ---- deletestok ----
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  await adminDb.collection("stok").doc(id).delete();
  return NextResponse.json({ ok: true });
}
