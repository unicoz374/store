"use client";

import { useEffect, useState } from "react";
import type { Produk, ProdukList } from "@/lib/types";

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function TabProduk() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [list, setList] = useState<ProdukList[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [showFormProduk, setShowFormProduk] = useState(false);

  async function refresh() {
    const [pRes, lRes] = await Promise.all([fetch("/api/admin/produk"), fetch("/api/admin/list")]);
    const pJson = await pRes.json();
    const lJson = await lRes.json();
    setProduk(pJson.produk || []);
    setList(lJson.list || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDeleteProduk(id: string) {
    if (!confirm("Hapus produk ini beserta seluruh stoknya?")) return;
    await fetch("/api/admin/produk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setSelectedProduk(null);
    refresh();
  }

  if (selectedProduk) {
    return (
      <StokManager
        produk={selectedProduk}
        onBack={() => setSelectedProduk(null)}
        onDeleteProduk={() => handleDeleteProduk(selectedProduk.id)}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 20 }}>Produk & Stok</h1>
        <button className="btn btn-primary" onClick={() => setShowFormProduk(true)}>
          + Tambah Produk
        </button>
      </div>

      {showFormProduk && (
        <FormProduk list={list} onClose={() => setShowFormProduk(false)} onSaved={() => { setShowFormProduk(false); refresh(); }} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {produk.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: 14.5 }}>{p.nama}</p>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{formatRupiah(p.harga)}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedProduk(p)}>
                Kelola Stok
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteProduk(p.id)}>
                Hapus
              </button>
            </div>
          </div>
        ))}
        {produk.length === 0 && <p style={{ color: "var(--text-muted)" }}>Belum ada produk.</p>}
      </div>
    </div>
  );
}

function FormProduk({ list, onClose, onSaved }: { list: ProdukList[]; onClose: () => void; onSaved: () => void }) {
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [harga, setHarga] = useState("");
  const [gambarUrl, setGambarUrl] = useState("");
  const [listId, setListId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/produk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, deskripsi, harga: Number(harga), gambarUrl, listId: listId || null })
    });
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label className="label">Nama Produk</label>
          <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} required />
        </div>
        <div>
          <label className="label">Harga (Rp)</label>
          <input className="input" type="number" value={harga} onChange={(e) => setHarga(e.target.value)} required />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Deskripsi</label>
        <textarea className="input" rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div>
          <label className="label">URL Gambar (opsional)</label>
          <input className="input" value={gambarUrl} onChange={(e) => setGambarUrl(e.target.value)} />
        </div>
        <div>
          <label className="label">Kategori/List (opsional)</label>
          <select className="input" value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Tanpa kategori</option>
            {list.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Batal
        </button>
      </div>
    </form>
  );
}

function StokManager({ produk, onBack, onDeleteProduk }: { produk: Produk; onBack: () => void; onDeleteProduk: () => void }) {
  const [stok, setStok] = useState<{ id: string; terjual: boolean; createdAt: number }[]>([]);
  const [tersedia, setTersedia] = useState(0);
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/admin/stok?produkId=${produk.id}`);
    const json = await res.json();
    setStok(json.stok || []);
    setTersedia(json.tersedia || 0);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produk.id]);

  // Format input bulk: satu baris per akun, field dipisah koma.
  // Contoh baris: email@mail.com, password123, 2FA-CODE, catatan bebas
  async function handleAddStok() {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const items = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        email: parts[0] || "",
        password: parts[1] || "",
        twofa: parts[2] || "",
        catatan: parts.slice(3).join(", ") || ""
      };
    });

    setSaving(true);
    await fetch("/api/admin/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produkId: produk.id, items })
    });
    setBulkText("");
    setSaving(false);
    refresh();
  }

  async function handleDeleteStok(id: string) {
    await fetch("/api/admin/stok", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    refresh();
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>
        ← Kembali
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>{produk.nama}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {tersedia} stok tersedia dari {stok.length} total
          </p>
        </div>
        <button className="btn btn-danger" onClick={onDeleteProduk}>
          Hapus Produk Ini
        </button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <label className="label">
          Tambah Stok (addstok) — format per baris: <code>email, password, kode2fa, catatan</code>
        </label>
        <textarea
          className="input"
          rows={5}
          placeholder={"contoh1@mail.com, pass123, JBSWY3DPEHPK, akun original\ncontoh2@mail.com, pass456, , -"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 13, marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={handleAddStok} disabled={saving}>
          {saving ? "Menyimpan & mengenkripsi..." : "Tambah Stok"}
        </button>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Setiap baris = 1 akun, disimpan terenkripsi (AES) di Firestore. Field bebas — kosongkan yang tidak perlu.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stok.map((s) => (
          <div
            key={s.id}
            className="card"
            style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={s.terjual ? "badge badge-danger" : "badge badge-success"}>
                {s.terjual ? "Terjual" : "Tersedia"}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "monospace" }}>{s.id}</span>
            </div>
            {!s.terjual && (
              <button className="btn btn-danger" onClick={() => handleDeleteStok(s.id)}>
                Hapus
              </button>
            )}
          </div>
        ))}
        {stok.length === 0 && <p style={{ color: "var(--text-muted)" }}>Belum ada stok.</p>}
      </div>
    </div>
  );
}
