import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveGateway } from "@/lib/payment";

function generateOrderCode() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `JZT-${rand}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { variantId, targetId, targetServer, guestEmail, guestWhatsapp } = body;

  if (!variantId || !targetId) {
    return NextResponse.json({ error: "Data pesanan tidak lengkap." }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Kalau bukan member (guest), wajib isi email/WA supaya bisa dihubungi.
  if (!user && !guestEmail && !guestWhatsapp) {
    return NextResponse.json(
      { error: "Isi email atau nomor WhatsApp untuk transaksi sebagai tamu." },
      { status: 400 }
    );
  }

  // Ambil harga variant + info produk dari database (JANGAN percaya harga dari client!)
  const { data: variant } = await admin
    .from("product_variants")
    .select("id, name, sell_price, product_id, products(name)")
    .eq("id", variantId)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  // Hitung diskon member dari profil (default 0 untuk guest).
  let discountPercent = 0;
  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("discount_percent")
      .eq("id", user.id)
      .single();
    discountPercent = profile?.discount_percent ?? 0;
  }

  const price = Number(variant.sell_price);
  const discountApplied = Math.round((price * discountPercent) / 100);
  const finalPrice = price - discountApplied;
  const orderCode = generateOrderCode();
  const productName = (variant as any).products?.name ?? "Produk";

  const { error: insertError } = await admin.from("orders").insert({
    order_code: orderCode,
    user_id: user?.id ?? null,
    guest_email: guestEmail ?? null,
    guest_whatsapp: guestWhatsapp ?? null,
    product_id: variant.product_id,
    variant_id: variant.id,
    target_id: targetId,
    target_server: targetServer ?? null,
    price,
    discount_applied: discountApplied,
    final_price: finalPrice,
    payment_gateway: process.env.PAYMENT_GATEWAY_ACTIVE || "midtrans",
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const gateway = getActiveGateway();
  const result = await gateway.createTransaction({
    orderCode,
    amount: finalPrice,
    customerName: user?.user_metadata?.full_name || "Pelanggan JunzTopp",
    customerEmail: user?.email || guestEmail,
    customerPhone: guestWhatsapp,
    itemName: `${productName} - ${variant.name}`,
  });

  await admin
    .from("orders")
    .update({ payment_reference: result.gatewayReference, raw_gateway_payload: result.raw })
    .eq("order_code", orderCode);

  if (!result.success) {
    return NextResponse.json({ error: result.errorMessage }, { status: 502 });
  }

  return NextResponse.json({
    orderCode,
    redirectUrl: result.redirectUrl,
    qrString: result.qrString,
    token: result.token,
  });
}
