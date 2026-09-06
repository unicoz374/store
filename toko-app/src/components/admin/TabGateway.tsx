"use client";

import { useEffect, useState } from "react";
import type { PaymentGatewaySettings, GatewayName } from "@/lib/types";

const EMPTY: PaymentGatewaySettings = {
  active: "midtrans",
  midtrans: { serverKey: "", clientKey: "", isProduction: false, enabled: false },
  tripay: { apiKey: "", privateKey: "", merchantCode: "", isProduction: false, enabled: false },
  xendit: { secretKey: "", webhookToken: "", enabled: false },
  duitku: { merchantCode: "", apiKey: "", isProduction: false, enabled: false }
};

const GATEWAY_LABEL: Record<GatewayName, string> = {
  midtrans: "Midtrans",
  tripay: "Tripay",
  xendit: "Xendit",
  duitku: "Duitku"
};

export default function TabGateway() {
  const [settings, setSettings] = useState<PaymentGatewaySettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/gateway");
    const json = await res.json();
    if (json.settings) setSettings(json.settings);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/gateway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function update<K extends keyof PaymentGatewaySettings>(key: K, value: PaymentGatewaySettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Memuat pengaturan...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 6 }}>Payment Gateway</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22 }}>
        Aktifkan satu gateway sebagai penerima pembayaran utama. Kredensial tiap gateway tersimpan terpisah, jadi Anda
        bisa isi semuanya lalu tinggal pindah "aktif" kapan saja tanpa isi ulang.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <label className="label">Gateway Aktif (dipakai untuk order baru)</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(Object.keys(GATEWAY_LABEL) as GatewayName[]).map((g) => (
            <button
              key={g}
              onClick={() => update("active", g)}
              className={settings.active === g ? "btn btn-primary" : "btn btn-ghost"}
            >
              {GATEWAY_LABEL[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Midtrans */}
      <GatewaySection title="Midtrans">
        <Field label="Server Key" value={settings.midtrans.serverKey} onChange={(v) => update("midtrans", { ...settings.midtrans, serverKey: v })} />
        <Field label="Client Key" value={settings.midtrans.clientKey} onChange={(v) => update("midtrans", { ...settings.midtrans, clientKey: v })} />
        <Toggle label="Mode Produksi" checked={settings.midtrans.isProduction} onChange={(v) => update("midtrans", { ...settings.midtrans, isProduction: v })} />
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Webhook URL: <code>{"{domain-anda}"}/api/webhook/midtrans</code>
        </p>
      </GatewaySection>

      {/* Tripay */}
      <GatewaySection title="Tripay">
        <Field label="API Key" value={settings.tripay.apiKey} onChange={(v) => update("tripay", { ...settings.tripay, apiKey: v })} />
        <Field label="Private Key" value={settings.tripay.privateKey} onChange={(v) => update("tripay", { ...settings.tripay, privateKey: v })} />
        <Field label="Merchant Code" value={settings.tripay.merchantCode} onChange={(v) => update("tripay", { ...settings.tripay, merchantCode: v })} />
        <Toggle label="Mode Produksi" checked={settings.tripay.isProduction} onChange={(v) => update("tripay", { ...settings.tripay, isProduction: v })} />
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Kalback URL: <code>{"{domain-anda}"}/api/webhook/tripay</code>
        </p>
      </GatewaySection>

      {/* Xendit */}
      <GatewaySection title="Xendit">
        <Field label="Secret Key" value={settings.xendit.secretKey} onChange={(v) => update("xendit", { ...settings.xendit, secretKey: v })} />
        <Field label="Webhook Verification Token" value={settings.xendit.webhookToken} onChange={(v) => update("xendit", { ...settings.xendit, webhookToken: v })} />
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Webhook URL: <code>{"{domain-anda}"}/api/webhook/xendit</code>
        </p>
      </GatewaySection>

      {/* Duitku */}
      <GatewaySection title="Duitku">
        <Field label="Merchant Code" value={settings.duitku.merchantCode} onChange={(v) => update("duitku", { ...settings.duitku, merchantCode: v })} />
        <Field label="API Key" value={settings.duitku.apiKey} onChange={(v) => update("duitku", { ...settings.duitku, apiKey: v })} />
        <Toggle label="Mode Produksi" checked={settings.duitku.isProduction} onChange={(v) => update("duitku", { ...settings.duitku, isProduction: v })} />
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Callback URL: <code>{"{domain-anda}"}/api/webhook/duitku</code>
        </p>
      </GatewaySection>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan Semua Pengaturan"}
      </button>
    </div>
  );
}

function GatewaySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--text-muted)" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
