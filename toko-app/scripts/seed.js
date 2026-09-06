// Jalankan sekali di awal: node scripts/seed.js
// Membuat dokumen settings/paymentGateway default supaya endpoint order tidak error
// dengan pesan "belum dikonfigurasi" sebelum admin sempat mengisi kredensial gateway.
require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey
  })
});

const db = getFirestore();

async function seed() {
  const ref = db.collection("settings").doc("paymentGateway");
  const snap = await ref.get();

  if (snap.exists) {
    console.log("settings/paymentGateway sudah ada, tidak ditimpa.");
    return;
  }

  await ref.set({
    active: "midtrans",
    midtrans: { serverKey: "", clientKey: "", isProduction: false, enabled: false },
    tripay: { apiKey: "", privateKey: "", merchantCode: "", isProduction: false, enabled: false },
    xendit: { secretKey: "", webhookToken: "", enabled: false },
    duitku: { merchantCode: "", apiKey: "", isProduction: false, enabled: false }
  });

  console.log("Berhasil membuat settings/paymentGateway default.");
  console.log("Silakan login ke dashboard admin dan isi kredensial gateway pilihan Anda.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
