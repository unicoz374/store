"use client";

import { useState } from "react";
import TabProduk from "./TabProduk";
import TabList from "./TabList";
import TabGateway from "./TabGateway";

type TabKey = "produk" | "list" | "gateway";

const TABS: { key: TabKey; label: string }[] = [
  { key: "produk", label: "Produk & Stok" },
  { key: "list", label: "Kategori (List)" },
  { key: "gateway", label: "Payment Gateway" }
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("produk");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 230,
          borderRight: "1px solid var(--border)",
          padding: "24px 16px",
          flexShrink: 0
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, padding: "0 8px 20px" }}>
          Admin Dashboard
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: tab === t.key ? "var(--accent-soft)" : "transparent",
                color: tab === t.key ? "var(--accent-hover)" : "var(--text-muted)",
                border: "none",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {tab === "produk" && <TabProduk />}
        {tab === "list" && <TabList />}
        {tab === "gateway" && <TabGateway />}
      </main>
    </div>
  );
}
