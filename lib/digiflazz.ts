import crypto from "crypto";

// Integrasi Digiflazz (https://digiflazz.com) — provider harga & eksekusi
// topup game/pulsa/PLN dsb. Dokumentasi resmi: https://developer.digiflazz.com
//
// CARA KERJA SIGNATURE DIGIFLAZZ (sesuai dokumentasi resmi mereka):
//   - Cek harga / cek saldo -> md5(username + api_key + "pricelist" atau "depo")
//   - Transaksi baru       -> md5(username + api_key + ref_id)
// Semua sudah ditangani di bawah, Anda hanya perlu mengisi
// DIGIFLAZZ_USERNAME dan DIGIFLAZZ_API_KEY di .env / Vercel env vars.

const BASE_URL = "https://api.digiflazz.com/v1";

function username() {
  return process.env.DIGIFLAZZ_USERNAME!;
}
function apiKey() {
  return process.env.DIGIFLAZZ_API_KEY!;
}
function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

export interface DigiflazzProduct {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

// Ambil daftar harga produk dari Digiflazz. Panggil ini secara berkala
// (mis. lewat cron/scheduled function) untuk menyinkronkan harga jual
// Anda di tabel `product_variants`, JANGAN memanggilnya langsung setiap
// kali pengunjung membuka halaman produk (supaya tidak boros kuota API).
export async function getDigiflazzPriceList(): Promise<DigiflazzProduct[]> {
  const sign = md5(`${username()}${apiKey()}pricelist`);

  const res = await fetch(`${BASE_URL}/price-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: "prepaid", username: username(), sign }),
  });

  const data = await res.json();
  if (!res.ok || !data?.data) {
    throw new Error(data?.message || "Gagal mengambil price list Digiflazz.");
  }
  return data.data as DigiflazzProduct[];
}

export interface DigiflazzTopupInput {
  buyerSkuCode: string; // kode produk Digiflazz, simpan di kolom products/product_variants Anda
  customerNo: string;   // User ID / nomor HP tujuan
  refId: string;        // WAJIB unik, pakai order_code pesanan Anda supaya tidak dobel-eksekusi
  testing?: boolean;    // true = mode sandbox Digiflazz
}

export interface DigiflazzTopupResult {
  success: boolean;
  refId: string;
  status: "pending" | "success" | "failed";
  sn?: string;          // serial number / bukti sukses dari provider game
  message: string;
  raw: unknown;
}

// Eksekusi topup ke Digiflazz. HANYA panggil ini SETELAH pembayaran
// terverifikasi "paid" lewat webhook payment gateway — jangan pernah
// dipanggil sebelum pembayaran masuk.
export async function createDigiflazzTransaction(
  input: DigiflazzTopupInput
): Promise<DigiflazzTopupResult> {
  const sign = md5(`${username()}${apiKey()}${input.refId}`);

  const res = await fetch(`${BASE_URL}/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username(),
      buyer_sku_code: input.buyerSkuCode,
      customer_no: input.customerNo,
      ref_id: input.refId,
      sign,
      testing: input.testing ?? process.env.DIGIFLAZZ_MODE === "development",
    }),
  });

  const data = await res.json();
  const d = data?.data;

  if (!res.ok || !d) {
    return {
      success: false,
      refId: input.refId,
      status: "failed",
      message: data?.message || "Gagal menghubungi Digiflazz.",
      raw: data,
    };
  }

  // rc "00" = sukses, "03"/"01" dsb bisa berarti pending tergantung produk.
  let status: DigiflazzTopupResult["status"] = "pending";
  if (d.rc === "00" || d.status === "Sukses") status = "success";
  else if (d.status === "Gagal") status = "failed";

  return {
    success: status !== "failed",
    refId: input.refId,
    status,
    sn: d.sn,
    message: d.message || d.status || "",
    raw: data,
  };
}

// Cek status transaksi yang sebelumnya berstatus "pending" (dipanggil
// oleh cron/endpoint pengecekan ulang, karena sebagian produk Digiflazz
// baru final beberapa menit setelah request awal).
export async function checkDigiflazzStatus(refId: string): Promise<DigiflazzTopupResult> {
  const sign = md5(`${username()}${apiKey()}${refId}`);
  const res = await fetch(`${BASE_URL}/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username(), ref_id: refId, sign, cmd: "status" }),
  });
  const data = await res.json();
  const d = data?.data;
  let status: DigiflazzTopupResult["status"] = "pending";
  if (d?.rc === "00" || d?.status === "Sukses") status = "success";
  else if (d?.status === "Gagal") status = "failed";
  return {
    success: status !== "failed",
    refId,
    status,
    sn: d?.sn,
    message: d?.message || d?.status || "",
    raw: data,
  };
}
