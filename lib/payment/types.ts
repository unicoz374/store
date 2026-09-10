// Kontrak yang harus dipenuhi SEMUA payment gateway, apa pun namanya
// (Midtrans, TransaksiKita, atau gateway lain di masa depan).
// Dengan begini, menambah gateway baru = tinggal buat 1 file baru
// yang mengimplementasikan interface ini, tanpa mengubah kode lain.

export interface CreateTransactionInput {
  orderCode: string;       // kode unik pesanan, mis: JZT-AB12CD
  amount: number;          // nominal yang harus dibayar (setelah diskon)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  itemName: string;        // nama produk, mis: "Mobile Legends - 86 Diamond"
}

export interface CreateTransactionResult {
  success: boolean;
  // Untuk gateway yang memakai halaman/redirect pembayaran (mis. Midtrans Snap):
  redirectUrl?: string;
  // Untuk gateway yang langsung memberi token/QR:
  token?: string;
  qrString?: string;
  // Referensi transaksi di sisi gateway, disimpan ke kolom payment_reference:
  gatewayReference: string;
  raw?: unknown;           // payload asli, disimpan untuk keperluan audit/debug
  errorMessage?: string;
}

export interface WebhookVerifyResult {
  isValid: boolean;
  orderCode: string;
  // Status dinormalisasi ke status internal JunzTopp, bukan istilah gateway:
  status: "pending" | "paid" | "failed" | "expired";
  paymentMethod?: string;
  raw?: unknown;
}

export interface PaymentGateway {
  name: string;
  createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult>;
  verifyWebhook(payload: any, headers: Headers): Promise<WebhookVerifyResult>;
}
