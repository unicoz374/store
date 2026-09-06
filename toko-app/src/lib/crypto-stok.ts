// Enkripsi/dekripsi data stok sensitif (email, password, 2FA, cookie, dll)
// Data HANYA didekripsi di server, sesaat sebelum dikirim ke pembeli yang sudah verified paid.
// Field ini TIDAK PERNAH boleh dikirim ke client dalam bentuk terenkripsi ataupun plain
// kecuali lewat endpoint /api/check-stock yang sudah memvalidasi status order = paid.
import CryptoJS from "crypto-js";

const RAW_KEY = process.env.STOCK_ENCRYPTION_KEY || "";

if (!RAW_KEY && typeof window === "undefined") {
  console.warn("[crypto-stok] STOCK_ENCRYPTION_KEY belum diatur di .env — stok TIDAK aman!");
}

/**
 * Enkripsi objek stok (misal { email, password, twofa, note }) menjadi 1 string cipher.
 */
export function encryptStock(data: Record<string, string>): string {
  const json = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json, RAW_KEY).toString();
}

/**
 * Dekripsi string cipher kembali menjadi objek stok.
 * Lempar error jika key salah / data korup — tangani di pemanggil.
 */
export function decryptStock(cipherText: string): Record<string, string> {
  const bytes = CryptoJS.AES.decrypt(cipherText, RAW_KEY);
  const json = bytes.toString(CryptoJS.enc.Utf8);
  if (!json) throw new Error("Gagal dekripsi stok — key salah atau data korup");
  return JSON.parse(json);
}
