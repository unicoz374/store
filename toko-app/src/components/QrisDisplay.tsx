"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menampilkan QRIS pembayaran. Beberapa gateway (Midtrans, Tripay) mengembalikan
 * qrString berupa URL gambar QR yang sudah jadi — tinggal <img>.
 * Gateway lain (Xendit, Duitku) mengembalikan qrString berupa payload EMV mentah
 * (string angka/karakter panjang) yang harus di-render jadi gambar QR di sisi client
 * memakai library 'qrcode'.
 */
export default function QrisDisplay({ qrString }: { qrString: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUrl] = useState(() => /^https?:\/\//.test(qrString));

  useEffect(() => {
    if (isUrl) return;
    let cancelled = false;

    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, qrString, { width: 220, margin: 1 }, (err: Error | null | undefined) => {
        if (err) console.error("Gagal render QR:", err);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [qrString, isUrl]);

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12, display: "inline-block", marginBottom: 16 }}>
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrString} alt="QRIS Pembayaran" width={220} height={220} />
      ) : (
        <canvas ref={canvasRef} width={220} height={220} />
      )}
    </div>
  );
}
