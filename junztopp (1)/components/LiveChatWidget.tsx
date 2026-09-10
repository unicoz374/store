"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "bot"; text: string };

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Halo! Saya bot bantuan JunzTopp. Tanyakan status pesanan (sertakan kode JZT-XXXXXX) atau pertanyaan seputar website kami ya 🙂",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Maaf, terjadi kendala. Coba lagi sebentar ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark shadow-glow">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <span className="font-display font-semibold">Live Chat JunzTopp</span>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-xl2 bg-brand px-3 py-2 text-white"
                    : "mr-auto max-w-[80%] rounded-xl2 bg-brand-soft dark:bg-brand-softDark px-3 py-2 text-ink dark:text-ink-dark"
                }
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-ink-muted dark:text-ink-mutedDark">Mengetik...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 border-t border-borderc dark:border-borderc-dark p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Tulis pertanyaan..."
              className="flex-1 rounded-lg border border-borderc dark:border-borderc-dark bg-base dark:bg-base-dark px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={send}
              className="rounded-lg bg-brand px-3 py-2 text-sm text-white hover:bg-brand-hover"
            >
              Kirim
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-glow hover:bg-brand-hover"
        aria-label="Buka live chat"
      >
        💬
      </button>
    </div>
  );
}
