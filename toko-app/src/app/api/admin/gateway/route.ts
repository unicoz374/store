import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isAdminRequest } from "@/lib/admin-auth";
import type { PaymentGatewaySettings } from "@/lib/types";

const DEFAULT_SETTINGS: PaymentGatewaySettings = {
  active: "midtrans",
  midtrans: { serverKey: "", clientKey: "", isProduction: false, enabled: false },
  tripay: { apiKey: "", privateKey: "", merchantCode: "", isProduction: false, enabled: false },
  xendit: { secretKey: "", webhookToken: "", enabled: false },
  duitku: { merchantCode: "", apiKey: "", isProduction: false, enabled: false }
};

// ---- lihat settingpaymentgateway saat ini ----
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("settings").doc("paymentGateway").get();
  const settings = snap.exists ? (snap.data() as PaymentGatewaySettings) : DEFAULT_SETTINGS;
  return NextResponse.json({ settings });
}

// ---- settingpaymentgateway: ganti/ubah gateway aktif & kredensial ----
// Body bisa partial, contoh hanya ganti gateway aktif:
//   { active: "tripay" }
// atau update kredensial salah satu gateway:
//   { tripay: { apiKey: "...", privateKey: "...", merchantCode: "...", isProduction: true, enabled: true } }
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ref = adminDb.collection("settings").doc("paymentGateway");
  const snap = await ref.get();
  const current = snap.exists ? (snap.data() as PaymentGatewaySettings) : DEFAULT_SETTINGS;

  const updated: PaymentGatewaySettings = {
    ...current,
    ...body,
    midtrans: { ...current.midtrans, ...(body.midtrans || {}) },
    tripay: { ...current.tripay, ...(body.tripay || {}) },
    xendit: { ...current.xendit, ...(body.xendit || {}) },
    duitku: { ...current.duitku, ...(body.duitku || {}) }
  };

  await ref.set(updated);
  return NextResponse.json({ ok: true, settings: updated });
}
