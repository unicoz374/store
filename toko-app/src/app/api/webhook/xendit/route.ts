import { NextResponse } from "next/server";
import { getGatewayByName } from "@/lib/gateways";
import { fulfillOrder, failOrder } from "@/lib/fulfillment";

// Set URL ini di Xendit Dashboard > Settings > Webhooks
// Contoh: https://tokoanda.com/api/webhook/xendit
export async function POST(req: Request) {
  const payload = await req.json();

  const adapter = await getGatewayByName("xendit");

  if (!adapter.verifyWebhookSignature(payload, req.headers)) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 403 });
  }

  const { orderId, status, ref } = adapter.parseWebhookStatus(payload);

  if (status === "paid") {
    const result = await fulfillOrder(orderId, ref);
    return NextResponse.json(result);
  } else if (status === "failed") {
    await failOrder(orderId, "failed");
  }

  return NextResponse.json({ ok: true });
}
