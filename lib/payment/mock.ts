import type {
  PaymentGateway,
  CreateTransactionInput,
  CreateTransactionResult,
  WebhookVerifyResult,
} from "./types";

// Dipakai saat PAYMENT_GATEWAY_ACTIVE=mock — supaya alur checkout tetap
// bisa dicoba (order tersimpan ke Supabase, halaman "menunggu pembayaran"
// muncul) SEBELUM Anda pasang API key Midtrans/TransaksiKita/Digiflazz asli.
// Status order otomatis jadi "paid" setelah 5 detik lewat halaman status,
// hanya untuk simulasi tampilan — TIDAK ADA transaksi uang sungguhan.
export const mockGateway: PaymentGateway = {
  name: "mock",

  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    return {
      success: true,
      redirectUrl: `/checkout/mock?order=${input.orderCode}&amount=${input.amount}`,
      gatewayReference: `MOCK-${input.orderCode}`,
      raw: { note: "Ini transaksi simulasi, ganti PAYMENT_GATEWAY_ACTIVE untuk pakai gateway asli." },
    };
  },

  async verifyWebhook(payload: any): Promise<WebhookVerifyResult> {
    return {
      isValid: true,
      orderCode: payload.orderCode,
      status: "paid",
      paymentMethod: "mock",
      raw: payload,
    };
  },
};
