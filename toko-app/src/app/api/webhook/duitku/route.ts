import { NextResponse } from "next/server";
import { getGatewayByName } from "@/lib/gateways";
import { fulfillOrder, failOrder } from "@/lib/fulfillment";

// Set URL ini di Duitku Merchant Portal > Callback URL
// Contoh: https://tokoanda.com/api/webhook/duitku
// Catatan: Duitku umumnya kirim callback sbg application/x-www-form-urlencoded
export async function POST(req: Request) {
  const form = await req.formData();
  const payload: Record<string, string> = {};
  form.forEach((value, key) => (payload[key] = String(value)));

  const adapter = await getGatewayByName("duitku");

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

  return NextResponse.json({ ok: true });
}
