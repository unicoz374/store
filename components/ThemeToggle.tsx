"use client";

import { useEffect, useState } from "react";

// Tombol untuk mengganti tema situs antara "dark" (black) dan "light".
// Pilihan pengunjung disimpan di localStorage supaya tetap sama saat
// mereka kembali lagi, dan TIDAK mengubah pilihan default admin
// (default_theme di tabel site_settings) untuk pengunjung lain.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("junztopp-theme");
    const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("junztopp-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark transition hover:opacity-80"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
