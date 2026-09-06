import crypto from "crypto";
import type { GatewayAdapter, CreatePaymentParams, CreatePaymentResult } from "./types";
import type { PaymentGatewaySettings } from "../types";

export function createMidtransAdapter(cfg: PaymentGatewaySettings["midtrans"]): GatewayAdapter {
  const base = cfg.isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
  const authHeader = "Basic " + Buffer.from(`${cfg.serverKey}:`).toString("base64");

  return {
    name: "midtrans",

    async createPayment({ orderId, amount, produkNama }: CreatePaymentParams): Promise<CreatePaymentResult> {
      const res = await fetch(`${base}/charge`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          payment_type: "qris",
          transaction_details: { order_id: orderId, gross_amount: amount },
          item_details: [{ id: orderId, price: amount, quantity: 1, name: produkNama.slice(0, 50) }]
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.status_message || "Gagal membuat pembayaran Midtrans");

      const qrAction = (json.actions || []).find((a: any) => a.name === "generate-qr-code");

      return {
        qrString: qrAction?.url || null,
        paymentUrl: qrAction?.url || null,
        paymentRef: json.transaction_id,
        raw: json
      };
    },

    verifyWebhookSignature(payload: any): boolean {
      const { order_id, status_code, gross_amount, signature_key } = payload;
      const expected = crypto
        .createHash("sha512")
        .update(`${order_id}${status_code}${gross_amount}${cfg.serverKey}`)
        .digest("hex");
      return expected === signature_key;
    },

    parseWebhookStatus(payload: any) {
      const t = payload.transaction_status;
      let status: "paid" | "pending" | "failed" = "pending";
      if (t === "settlement" || t === "capture") status = "paid";
      else if (t === "expire" || t === "cancel" || t === "deny") status = "failed";
      return { orderId: payload.order_id, status, ref: payload.transaction_id };
    }
  };
}
