"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/siteSettings";

export default function AdminSettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Nama Situs</label>
        <input
          value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-base dark:bg-base-dark px-4 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Link WhatsApp Admin</label>
        <input
          value={form.whatsapp_link}
          onChange={(e) => setForm({ ...form, whatsapp_link: e.target.value })}
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-base dark:bg-base-dark px-4 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tema Default Pengunjung Baru</label>
        <select
          value={form.default_theme}
          onChange={(e) => setForm({ ...form, default_theme: e.target.value as "dark" | "light" })}
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-base dark:bg-base-dark px-4 py-2"
        >
          <option value="dark">Black (dark)</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Pengumuman (kosongkan jika tidak ada)</label>
        <input
          value={form.announcement}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-base dark:bg-base-dark px-4 py-2"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.maintenance_mode}
          onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
        />
        Mode maintenance (tutup situs sementara)
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
      {saved && <p className="text-sm text-green-500">Tersimpan! Perubahan langsung tampil di situs.</p>}
    </div>
  );
}
