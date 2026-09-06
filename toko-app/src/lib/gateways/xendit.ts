import type { GatewayAdapter, CreatePaymentParams, CreatePaymentResult } from "./types";
import type { PaymentGatewaySettings } from "../types";

export function createXenditAdapter(cfg: PaymentGatewaySettings["xendit"]): GatewayAdapter {
  const authHeader = "Basic " + Buffer.from(`${cfg.secretKey}:`).toString("base64");

  return {
    name: "xendit",

    async createPayment({ orderId, amount, produkNama }: CreatePaymentParams): Promise<CreatePaymentResult> {
      const res = await fetch("https://api.xendit.co/qr_codes", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_id: orderId,
          type: "DYNAMIC",
          currency: "IDR",
          amount,
          metadata: { produk: produkNama }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal membuat pembayaran Xendit");

      return {
        qrString: json.qr_string || null,
        paymentUrl: null,
        paymentRef: json.id,
        raw: json
      };
    },

    verifyWebhookSignature(payload: any, headers: Headers): boolean {
      const token = headers.get("x-callback-token") || "";
      return token === cfg.webhookToken;
    },

    parseWebhookStatus(payload: any) {
      let status: "paid" | "pending" | "failed" = "pending";
      const s = payload.status || payload.data?.status;
      if (s === "SUCCEEDED" || s === "COMPLETED") status = "paid";
      else if (s === "EXPIRED" || s === "FAILED") status = "failed";
      return {
        orderId: payload.reference_id || payload.data?.reference_id,
        status,
        ref: payload.id || payload.data?.id
      };
    }
  };
}
