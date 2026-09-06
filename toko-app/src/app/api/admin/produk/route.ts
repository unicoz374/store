import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { isAdminRequest } from "@/lib/admin-auth";
import type { Produk } from "@/lib/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ---- addproduk ----
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { nama, deskripsi, harga, gambarUrl, listId } = body;

  if (!nama || !harga) {
    return NextResponse.json({ error: "Nama dan harga wajib diisi" }, { status: 400 });
  }

  const id = nanoid(10);
  const now = Date.now();
  const produk: Produk = {
    id,
    nama,
    slug: `${slugify(nama)}-${id.slice(0, 5)}`,
    deskripsi: deskripsi || "",
    harga: Number(harga),
    gambarUrl: gambarUrl || "",
    listId: listId || null,
    aktif: true,
    createdAt: now,
    updatedAt: now
  };

  await adminDb.collection("produk").doc(id).set(produk);
  return NextResponse.json({ ok: true, produk });
}

// ---- daftar produk (dipakai dashboard admin utk menampilkan tabel) ----
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("produk").orderBy("createdAt", "desc").get();
  const produk = snap.docs.map((d) => d.data());
  return NextResponse.json({ produk });
}

// ---- deleteproduk ----
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  // Hapus juga seluruh stok terkait produk ini
  const stokSnap = await adminDb.collection("stok").where("produkId", "==", id).get();
  const batch = adminDb.batch();
  stokSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(adminDb.collection("produk").doc(id));
  await batch.commit();

  return NextResponse.json({ ok: true });
}
