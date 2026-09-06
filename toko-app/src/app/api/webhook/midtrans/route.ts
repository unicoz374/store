import { NextResponse } from "next/server";
import { getGatewayByName } from "@/lib/gateways";
import { fulfillOrder, failOrder } from "@/lib/fulfillment";

// Set URL ini di Midtrans Dashboard > Settings > Configuration > Payment Notification URL
// Contoh: https://tokoanda.com/api/webhook/midtrans
export async function POST(req: Request) {
  const payload = await req.json();

  const adapter = await getGatewayByName("midtrans");

  if (!adapter.verifyWebhookSignature(payload, req.headers)) {
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  const { orderId, status, ref } = adapter.parseWebhookStatus(payload);

  if (status === "paid") {
    const result = await fulfillOrder(orderId, ref);
    return NextResponse.json(result);
  } else if (status === "failed") {
    await failOrder(orderId, "failed");
  }

  return NextResponse.json({ ok: true, status });
}
