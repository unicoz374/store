"use client";

import { useState } from "react";

export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [resultMsg, setResultMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultMsg(
        data.wasCensored
          ? "Terima kasih! Pesan Anda mengandung kata yang kami sensor otomatis, namun tetap tersimpan dan akan kami tinjau."
          : "Terima kasih atas kritik & sarannya!"
      );
      setStatus("done");
      setName("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama (opsional)"
        className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3 outline-none"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={4}
        placeholder="Tulis kritik atau saran Anda untuk JunzTopp..."
        className="w-full rounded-lg border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark px-4 py-3 outline-none"
      />
      <p className="text-xs text-ink-muted dark:text-ink-mutedDark">
        Kata-kata kasar/tidak pantas akan otomatis disensor sistem.
      </p>
      <button
        disabled={status === "loading"}
        className="rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {status === "loading" ? "Mengirim..." : "Kirim Kritik & Saran"}
      </button>
      {status === "done" && <p className="text-sm text-green-600 dark:text-green-400">{resultMsg}</p>}
      {status === "error" && (
        <p className="text-sm text-red-500">Gagal mengirim, coba lagi ya.</p>
      )}
    </form>
  );
}
