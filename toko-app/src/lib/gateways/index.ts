import { adminDb } from "../firebase-admin";
import type { PaymentGatewaySettings, GatewayName } from "../types";
import type { GatewayAdapter } from "./types";
import { createMidtransAdapter } from "./midtrans";
import { createTripayAdapter } from "./tripay";
import { createXenditAdapter } from "./xendit";
import { createDuitkuAdapter } from "./duitku";

/**
 * Ambil settings payment gateway dari Firestore (settings/paymentGateway).
 * Ini yang membuat fitur admin "settingpaymentgateway" bisa ganti-ganti gateway
 * tanpa redeploy — cukup update dokumen Firestore lewat dashboard admin.
 */
export async function getGatewaySettings(): Promise<PaymentGatewaySettings> {
  const snap = await adminDb.collection("settings").doc("paymentGateway").get();
  if (!snap.exists) {
    throw new Error("Settings payment gateway belum dikonfigurasi. Atur dulu di dashboard admin.");
  }
  return snap.data() as PaymentGatewaySettings;
}

export function buildAdapter(name: GatewayName, settings: PaymentGatewaySettings): GatewayAdapter {
  switch (name) {
    case "midtrans":
      return createMidtransAdapter(settings.midtrans);
    case "tripay":
      return createTripayAdapter(settings.tripay);
    case "xendit":
      return createXenditAdapter(settings.xendit);
    case "duitku":
      return createDuitkuAdapter(settings.duitku);
    default:
      throw new Error(`Gateway '${name}' tidak dikenal`);
  }
}

/** Ambil adapter gateway yang sedang AKTIF (dipilih admin di dashboard) */
export async function getActiveGateway(): Promise<{ adapter: GatewayAdapter; settings: PaymentGatewaySettings }> {
  const settings = await getGatewaySettings();
  const adapter = buildAdapter(settings.active, settings);
  return { adapter, settings };
}

/** Ambil adapter gateway TERTENTU (dipakai webhook, karena tiap gateway punya URL webhook sendiri) */
export async function getGatewayByName(name: GatewayName): Promise<GatewayAdapter> {
  const settings = await getGatewaySettings();
  return buildAdapter(name, settings);
}
