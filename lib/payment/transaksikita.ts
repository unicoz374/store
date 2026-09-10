import crypto from "crypto";
import type {
  PaymentGateway,
  CreateTransactionInput,
  CreateTransactionResult,
  WebhookVerifyResult,
} from "./types";

// Adapter untuk TransaksiKita.com (https://transaksikita.com), payment gateway
// QRIS lokal Indonesia. Field & alur di bawah ini mengikuti SDK resmi mereka
// (PHP/Python SDK: project_id, public_key, secret_key, create_payment,
// check_status, verify_callback).
//
// PENTING - TOLONG DICEK ULANG SEBELUM PRODUKSI:
// SDK resmi TransaksiKita membungkus endpoint HTTP mentahnya, jadi nama
// endpoint REST persis (mis. "/v1/payments") di bawah ini adalah pola REST
// yang umum dipakai gateway sejenis, BUKAN dikutip langsung dari dokumentasi
// endpoint mereka. Sebelum dipakai transaksi sungguhan:
//  1. Buka dashboard TransaksiKita Anda > menu API/Dokumentasi.
//  2. Cocokkan nama endpoint, nama header autentikasi, dan format signature
//     callback di bawah ini dengan yang tertulis di dashboard Anda.
//  3. Jika berbeda, cukup ubah bagian yang ditandai "// SESUAIKAN" saja —
//     struktur adapter (PaymentGateway) tidak perlu diubah.

const BASE_URL = process.env.TRANSAKSIKITA_BASE_URL || "https://transaksikita.com";

export const transaksiKitaGateway: PaymentGateway = {
  name: "transaksikita",

  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    const projectId = process.env.TRANSAKSIKITA_MERCHANT_ID!; // project_id di dashboard
    const apiKey = process.env.TRANSAKSIKITA_API_KEY!; // secret_key di dashboard

    // SESUAIKAN: path endpoint create payment sesuai dashboard Anda.
    const res = await fetch(`${BASE_URL}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // SESUAIKAN: nama header autentikasi (bisa "Authorization: Bearer ..."
        // atau header khusus seperti di bawah, tergantung dashboard Anda).
        "X-Project-Id": projectId,
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        amount: Math.round(input.amount),
        customer_name: input.customerName,
        description: input.itemName,
        reference_id: input.orderCode,
        expired_minutes: 60,
        payment_method: "QRIS",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        gatewayReference: input.orderCode,
        errorMessage: data?.message || "Gagal membuat transaksi TransaksiKita.",
        raw: data,
      };
    }

    return {
      success: true,
      redirectUrl: data.checkout_full_url ?? data.data?.checkout_full_url,
      qrString: data.qris_payload ?? data.data?.qris_payload,
      gatewayReference: data.payment_id ?? data.data?.payment_id ?? input.orderCode,
      raw: data,
    };
  },

  async verifyWebhook(payload: any): Promise<WebhookVerifyResult> {
    const apiKey = process.env.TRANSAKSIKITA_API_KEY!;

    // SESUAIKAN: cara verifikasi signature callback TransaksiKita.
    // Contoh umum: HMAC-SHA256 dari body JSON memakai secret_key,
    // dikirim gateway lewat header "X-Signature". Ganti sesuai dashboard Anda.
    const receivedSignature = payload.signature;
    const expectedSignature = crypto
      .createHmac("sha256", apiKey)
      .update(JSON.stringify(payload.data ?? payload))
      .digest("hex");

    const isValid = receivedSignature ? receivedSignature === expectedSignature : false;

    const rawStatus = (payload.status || payload.data?.status || "").toLowerCase();
    let status: WebhookVerifyResult["status"] = "pending";
    if (rawStatus === "paid" || rawStatus === "success") status = "paid";
    else if (rawStatus === "expired") status = "expired";
    else if (rawStatus === "failed" || rawStatus === "cancelled") status = "failed";

    return {
      isValid,
      orderCode: payload.reference_id ?? payload.data?.reference_id,
      status,
      paymentMethod: "QRIS",
      raw: payload,
    };
  },
};
