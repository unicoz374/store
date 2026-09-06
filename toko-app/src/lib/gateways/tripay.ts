import crypto from "crypto";
import type { GatewayAdapter, CreatePaymentParams, CreatePaymentResult } from "./types";
import type { PaymentGatewaySettings } from "../types";

export function createTripayAdapter(cfg: PaymentGatewaySettings["tripay"]): GatewayAdapter {
  const base = cfg.isProduction ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox";

  return {
    name: "tripay",

    async createPayment({ orderId, amount, produkNama, customerName }: CreatePaymentParams): Promise<CreatePaymentResult> {
      const merchantRef = orderId;
      const signature = crypto
        .createHmac("sha256", cfg.privateKey)
        .update(cfg.merchantCode + merchantRef + amount)
        .digest("hex");

      const res = await fetch(`${base}/transaction/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          method: "QRIS",
          merchant_ref: merchantRef,
          amount,
          customer_name: customerName || "Pembeli",
          customer_email: "pembeli@example.com",
          order_items: [{ sku: orderId, name: produkNama.slice(0, 50), price: amount, quantity: 1 }],
          signature
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal membuat pembayaran Tripay");

      const d = json.data;
      return {
        qrString: d.qr_url || null,
        paymentUrl: d.checkout_url || null,
        paymentRef: d.reference,
        raw: json
      };
    },

    verifyWebhookSignature(payload: any, headers: Headers): boolean {
      const callbackSignature = headers.get("x-callback-signature") || "";
      const expected = crypto
        .createHmac("sha256", cfg.privateKey)
        .update(JSON.stringify(payload))
        .digest("hex");
      return expected === callbackSignature;
    },

    parseWebhookStatus(payload: any) {
      let status: "paid" | "pending" | "failed" = "pending";
      if (payload.status === "PAID") status = "paid";
      else if (payload.status === "EXPIRED" || payload.status === "FAILED") status = "failed";
      return { orderId: payload.merchant_ref, status, ref: payload.reference };
    }
  };
}
