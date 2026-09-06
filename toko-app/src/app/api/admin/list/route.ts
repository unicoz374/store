import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { isAdminRequest } from "@/lib/admin-auth";
import type { ProdukList } from "@/lib/types";

// ---- addlist ----
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nama, deskripsi, urutan } = await req.json();
  if (!nama) return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });

  const id = nanoid(10);
  const list: ProdukList = {
    id,
    nama,
    deskripsi: deskripsi || "",
    urutan: typeof urutan === "number" ? urutan : 0,
    createdAt: Date.now()
  };

  await adminDb.collection("list").doc(id).set(list);
  return NextResponse.json({ ok: true, list });
}

// ---- daftar semua list ----
export async function GET(req: Request) {
  const snap = await adminDb.collection("list").orderBy("urutan", "asc").get();
  const list = snap.docs.map((d) => d.data());
  return NextResponse.json({ list });
}

// ---- deletelist ----
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  // Produk yang tergabung di list ini dilepas relasinya (bukan ikut terhapus)
  const produkSnap = await adminDb.collection("produk").where("listId", "==", id).get();
  const batch = adminDb.batch();
  produkSnap.docs.forEach((doc) => batch.update(doc.ref, { listId: null }));
  batch.delete(adminDb.collection("list").doc(id));
  await batch.commit();

  return NextResponse.json({ ok: true });
}
