import type { PaymentGateway } from "./types";
import { midtransGateway } from "./midtrans";
import { transaksiKitaGateway } from "./transaksikita";
import { mockGateway } from "./mock";

// Daftar SEMUA gateway yang tersedia di kode. Untuk menambah gateway baru:
//   1. Buat file baru di lib/payment/nama-gateway.ts yang mengimplementasikan
//      interface PaymentGateway (lihat types.ts) — contoh: lihat midtrans.ts.
//   2. Import & daftarkan di sini.
//   3. Tambahkan namanya ke pilihan PAYMENT_GATEWAY_ACTIVE di .env / Vercel.
// "mock" dipakai untuk mencoba tampilan & alur checkout SEBELUM Anda pasang
// API key Midtrans/TransaksiKita asli — tidak ada transaksi uang sungguhan.
const GATEWAYS: Record<string, PaymentGateway> = {
  midtrans: midtransGateway,
  transaksikita: transaksiKitaGateway,
  mock: mockGateway,
};

// Gateway yang sedang aktif dipakai situs, ditentukan lewat environment
// variable PAYMENT_GATEWAY_ACTIVE (bisa diubah kapan saja tanpa ubah kode,
// tinggal ganti value-nya di Vercel > Settings > Environment Variables,
// lalu redeploy).
export function getActiveGateway(): PaymentGateway {
  const key = process.env.PAYMENT_GATEWAY_ACTIVE || "mock";
  const gateway = GATEWAYS[key];
  if (!gateway) {
    throw new Error(
      `Gateway "${key}" tidak dikenal. Pilihan yang tersedia: ${Object.keys(GATEWAYS).join(", ")}`
    );
  }
  return gateway;
}

export function getGatewayByName(name: string): PaymentGateway | undefined {
  return GATEWAYS[name];
}
