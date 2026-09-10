import crypto from "crypto";
import type {
  PaymentGateway,
  CreateTransactionInput,
  CreateTransactionResult,
  WebhookVerifyResult,
} from "./types";

// Dokumentasi resmi: https://docs.midtrans.com/docs/snap-snap-integration-guide
export const midtransGateway: PaymentGateway = {
  name: "midtrans",

  async createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = Buffer.from(`${serverKey}:`).toString("base64");

    const body = {
      transaction_details: {
        order_id: input.orderCode,
        gross_amount: Math.round(input.amount),
      },
      customer_details: {
        first_name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
      },
      item_details: [
        {
          id: input.orderCode,
          price: Math.round(input.amount),
          quantity: 1,
          name: input.itemName.slice(0, 50),
        },
      ],
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        gatewayReference: input.orderCode,
        errorMessage: data?.error_messages?.join(", ") || "Gagal membuat transaksi Midtrans.",
        raw: data,
      };
    }

    return {
      success: true,
      redirectUrl: data.redirect_url,
      token: data.token,
      gatewayReference: input.orderCode,
      raw: data,
    };
  },

  async verifyWebhook(payload: any): Promise<WebhookVerifyResult> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;

    // Validasi signature sesuai spesifikasi Midtrans, mencegah webhook palsu.
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    const isValid = expectedSignature === signature_key;

    let status: WebhookVerifyResult["status"] = "pending";
    if (transaction_status === "settlement" || transaction_status === "capture") {
      status = "paid";
    } else if (transaction_status === "expire") {
      status = "expired";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "failure"
    ) {
      status = "failed";
    }

    return {
      isValid,
      orderCode: order_id,
      status,
      paymentMethod: payload.payment_type,
      raw: payload,
    };
  },
};
