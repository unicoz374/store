// Setiap browser/device pembeli punya deviceId unik yang disimpan di localStorage.
// Ini dipakai untuk fitur "riwayat pesanan" agar tiap device hanya melihat riwayatnya sendiri,
// tanpa perlu sistem akun/login untuk pengunjung.
import { nanoid } from "nanoid";

const KEY = "toko_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = nanoid(24);
    localStorage.setItem(KEY, id);
  }
  return id;
}
