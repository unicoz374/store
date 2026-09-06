"use client";

import { useEffect, useState } from "react";
import type { ProdukList } from "@/lib/types";

export default function TabList() {
  const [list, setList] = useState<ProdukList[]>([]);
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/list");
    const json = await res.json();
    setList(json.list || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setSaving(true);
    await fetch("/api/admin/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, deskripsi, urutan: list.length })
    });
    setNama("");
    setDeskripsi("");
    setSaving(false);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kategori ini? Produk di dalamnya tidak ikut terhapus.")) return;
    await fetch("/api/admin/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    refresh();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 22 }}>Kategori Produk (List)</h1>

      <form onSubmit={handleAdd} className="card" style={{ padding: 20, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label className="label">Nama Kategori</label>
          <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Netflix Premium" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Deskripsi (opsional)</label>
          <input className="input" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={saving}>
          + Tambah
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((l) => (
          <div key={l.id} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14.5 }}>{l.nama}</p>
              {l.deskripsi && <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{l.deskripsi}</p>}
            </div>
            <button className="btn btn-danger" onClick={() => handleDelete(l.id)}>
              Hapus
            </button>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: "var(--text-muted)" }}>Belum ada kategori.</p>}
      </div>
    </div>
  );
}
