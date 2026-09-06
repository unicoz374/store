// ============================================
// SKEMA DATA FIRESTORE
// ============================================
// Koleksi:
//   produk/{produkId}
//   stok/{stokId}            -> subkoleksi dari produk, field 'data' terenkripsi AES
//   list/{listId}             -> pengelompokan/kategori produk (fitur addlist/deletelist)
//   orders/{orderId}
//   settings/paymentGateway   -> dokumen tunggal, gateway aktif + kredensial per gateway
//   settings/admin            -> hash password admin (opsional override .env)

export type GatewayName = "midtrans" | "tripay" | "xendit" | "duitku";

export interface Produk {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string;
  harga: number;
  gambarUrl?: string;
  listId?: string | null; // relasi ke koleksi 'list' (kategori), opsional
  aktif: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StokItem {
  id: string;
  produkId: string;
  dataEncrypted: string; // hasil encryptStock({ email, password, twofa, catatan })
  terjual: boolean;
  orderId?: string | null;
  createdAt: number;
  soldAt?: number | null;
}

export interface ProdukList {
  id: string;
  nama: string; // contoh: "Netflix Premium", "Spotify Family"
  deskripsi?: string;
  urutan: number;
  createdAt: number;
}

export type OrderStatus = "pending" | "paid" | "expired" | "failed";

export interface Order {
  id: string; // dipakai sbg order reference ke payment gateway
  produkId: string;
  produkNama: string;
  harga: number;
  gateway: GatewayName;
  status: OrderStatus;
  deviceId: string; // fingerprint device pembeli, dasar riwayat per-device
  stokId?: string | null; // stok yang dialokasikan setelah paid
  paymentUrl?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  paymentRef?: string | null; // reference id dari gateway
  createdAt: number;
  expiredAt: number;
  paidAt?: number | null;
}

export interface PaymentGatewaySettings {
  active: GatewayName;
  midtrans: { serverKey: string; clientKey: string; isProduction: boolean; enabled: boolean };
  tripay: { apiKey: string; privateKey: string; merchantCode: string; isProduction: boolean; enabled: boolean };
  xendit: { secretKey: string; webhookToken: string; enabled: boolean };
  duitku: { merchantCode: string; apiKey: string; isProduction: boolean; enabled: boolean };
}

// Riwayat pesanan per-device, auto refresh / kadaluarsa 30 hari (30h = 30 hari sesuai istilah user)
export const RIWAYAT_EXPIRE_MS = 30 * 24 * 60 * 60 * 1000;
export const ORDER_EXPIRE_MS = 60 * 60 * 1000; // 1 jam batas waktu bayar
