// Firebase Admin SDK — HANYA jalan di server (API routes / server actions).
// Punya akses penuh (bypass Security Rules). JANGAN pernah import file ini dari komponen client.
//
// PENTING: inisialisasi dibuat LAZY (baru benar-benar connect saat pertama kali dipakai
// di dalam request handler), BUKAN saat file ini di-import. Next.js/Vercel menjalankan
// "collect page data" saat build yang meng-import semua module route — kalau cert()
// dipanggil langsung di top-level, build akan gagal jika env var belum terbaca di tahap
// build tersebut (error umum: "Failed to collect page data for /api/...").
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _db: Firestore | null = null;

function buildAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      "Firebase Admin belum dikonfigurasi: pastikan FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, " +
        "dan FIREBASE_ADMIN_PRIVATE_KEY sudah diisi di Environment Variables (.env lokal atau Vercel Project Settings)."
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey
    })
  });
}

function getAdminAppLazy(): App {
  if (!_app) _app = buildAdminApp();
  return _app;
}

function getAdminDbLazy(): Firestore {
  if (!_db) _db = getFirestore(getAdminAppLazy());
  return _db;
}

// Proxy: dari luar tetap terlihat & dipakai seperti objek Firestore biasa
// (adminDb.collection(...).doc(...).get() dst — TIDAK ada kode lain yang perlu diubah),
// tapi getAdminDbLazy() (yang memanggil cert()) baru benar-benar jalan pada
// akses pertama, yaitu saat ada request masuk — bukan saat file di-import waktu build.
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDbLazy();
    const value = Reflect.get(db as object, prop, db);
    return typeof value === "function" ? value.bind(db) : value;
  }
});

export const adminApp: App = new Proxy({} as App, {
  get(_target, prop) {
    const app = getAdminAppLazy();
    const value = Reflect.get(app as object, prop, app);
    return typeof value === "function" ? value.bind(app) : value;
  }
});
