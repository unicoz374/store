import crypto from "crypto";
import type { GatewayAdapter, CreatePaymentParams, CreatePaymentResult } from "./types";
import type { PaymentGatewaySettings } from "../types";

export function createDuitkuAdapter(cfg: PaymentGatewaySettings["duitku"]): GatewayAdapter {
  const base = cfg.isProduction
    ? "https://passport.duitku.com/webapi/api/merchant"
    : "https://sandbox.duitku.com/webapi/api/merchant";

  return {
    name: "duitku",

    async createPayment({ orderId, amount, produkNama }: CreatePaymentParams): Promise<CreatePaymentResult> {
      const signature = crypto
        .createHash("md5")
        .update(cfg.merchantCode + orderId + amount + cfg.apiKey)
        .digest("hex");

      const res = await fetch(`${base}/v2/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantCode: cfg.merchantCode,
          paymentAmount: amount,
          merchantOrderId: orderId,
          productDetails: produkNama.slice(0, 50),
          paymentMethod: "SP", // QRIS Shopeepay/QRIS umum
          signature
        })
      });
      const json = await res.json();
      if (json.statusCode && json.statusCode !== "00") {
        throw new Error(json.statusMessage || "Gagal membuat pembayaran Duitku");
      }

      return {
        qrString: json.qrString || null,
        paymentUrl: json.paymentUrl || null,
        paymentRef: json.reference,
        raw: json
      };
    },

    verifyWebhookSignature(payload: any): boolean {
      const expected = crypto
        .createHash("md5")
        .update(cfg.merchantCode + payload.amount + payload.merchantOrderId + cfg.apiKey)
        .digest("hex");
      return expected === payload.signature;
    },

    parseWebhookStatus(payload: any) {
      let status: "paid" | "pending" | "failed" = "pending";
      if (payload.resultCode === "00") status = "paid";
      else if (payload.resultCode === "01") status = "failed";
      return { orderId: payload.merchantOrderId, status, ref: payload.reference };
    }
  };
}
