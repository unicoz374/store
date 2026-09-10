import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGatewayByName } from "@/lib/payment";
import { createDigiflazzTransaction } from "@/lib/digiflazz";

// URL webhook ini yang Anda daftarkan di dashboard masing-masing payment
// gateway, contoh:
//   Midtrans:      https://domain-anda.vercel.app/api/payment/webhook?gateway=midtrans
//   TransaksiKita: https://domain-anda.vercel.app/api/payment/webhook?gateway=transaksikita
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const gatewayName = searchParams.get("gateway") || process.env.PAYMENT_GATEWAY_ACTIVE || "midtrans";
  const gateway = getGatewayByName(gatewayName);

  if (!gateway) {
    return NextResponse.json({ error: "Gateway tidak dikenal." }, { status: 400 });
  }

  const payload = await req.json();
  const result = await gateway.verifyWebhook(payload, req.headers);

  if (!result.isValid) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_code", result.orderCode)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  // Cegah eksekusi topup dobel kalau webhook terkirim berkali-kali oleh gateway.
  if (order.status === "success" || order.status === "processing") {
    return NextResponse.json({ received: true, note: "Sudah diproses sebelumnya." });
  }

  await admin
    .from("orders")
    .update({
      status: result.status,
      payment_method: result.paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("order_code", result.orderCode);

  // Kalau pembayaran sukses, baru eksekusi topup ke Digiflazz.
  if (result.status === "paid") {
    const { data: variant } = await admin
      .from("product_variants")
      .select("id, digiflazz_sku") // pastikan kolom digiflazz_sku sudah diisi lewat /admin
      .eq("id", order.variant_id)
      .single();

    if (variant?.digiflazz_sku) {
      const topup = await createDigiflazzTransaction({
        buyerSkuCode: variant.digiflazz_sku,
        customerNo: order.target_server
          ? `${order.target_id}${order.target_server}`
          : order.target_id,
        refId: order.order_code,
      });

      await admin
        .from("orders")
        .update({
          status: topup.status === "success" ? "success" : topup.status === "failed" ? "failed" : "processing",
          raw_gateway_payload: { payment: payload, digiflazz: topup.raw },
        })
        .eq("order_code", order.order_code);
    }
  }

  return NextResponse.json({ received: true });
}
