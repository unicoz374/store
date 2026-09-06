# Toko Digital Store — Next.js + Firebase + Multi Payment Gateway

Website toko akun digital dengan auto-order, terinspirasi dari kanztoko.my.id. Dibangun dengan Next.js (App Router),
Firebase Firestore sebagai database, dan mendukung 4 payment gateway (Midtrans, Tripay, Xendit, Duitku) yang bisa
dipilih/diganti dari dashboard admin tanpa redeploy.

## Daftar isi
1. [Fitur](#fitur)
2. [Arsitektur singkat](#arsitektur-singkat)
3. [Setup Firebase](#1-setup-firebase)
4. [Setup environment variables](#2-setup-environment-variables)
5. [Install & jalankan lokal](#3-install--jalankan-lokal)
6. [Setup tiap payment gateway](#4-setup-payment-gateway)
7. [Deploy ke Vercel](#5-deploy-ke-vercel)
8. [Mengamankan halaman admin](#6-mengamankan-halaman-admin)
9. [Alur auto order (cara kerja)](#alur-auto-order-cara-kerja)
10. [Catatan keamanan](#catatan-keamanan)
11. [Hal yang perlu Anda sesuaikan sebelum produksi](#hal-yang-perlu-anda-sesuaikan-sebelum-produksi)

---

## Fitur

**Admin (halaman tersembunyi, path rahasia + password):**
- `addproduk` — tambah produk baru
- `deleteproduk` — hapus produk (otomatis ikut hapus semua stoknya)
- `addstok` — tambah stok dalam format bebas (email, password, 2FA, catatan), disimpan **terenkripsi AES**
- `deletestok` — hapus 1 item stok
- `addlist` / `deletelist` — kelola kategori/pengelompokan produk
- `settingpaymentgateway` — pilih gateway aktif & isi/ubah kredensial 4 gateway

**Pengunjung:**
- Akses & lihat produk (etalase + detail)
- **Auto order**: setelah transfer/scan QRIS, sistem otomatis mendeteksi pembayaran lewat webhook gateway,
  mengalokasikan 1 stok, dan menampilkan struk + detail akun tanpa campur tangan admin
- **Riwayat per-device**: riwayat pesanan disimpan berdasarkan fingerprint browser (localStorage), jadi tiap
  device punya riwayat sendiri-sendiri, otomatis tidak ditampilkan lagi setelah 30 hari

## Arsitektur singkat

```
Pengunjung
   |  1. Pilih produk -> POST /api/order
   v
Next.js API (Admin SDK) -- cek stok tersedia -- buat dokumen Order (pending)
   |                                          -- panggil gateway aktif -> dapat QR/link bayar
   v
Halaman /checkout/[orderId]  (polling /api/order tiap 3 detik)
   |
   |  2. Pembeli scan QRIS & bayar lewat e-wallet/bank apapun
   v
Payment Gateway (Midtrans/Tripay/Xendit/Duitku)
   |  3. Kirim webhook ke /api/webhook/{gateway}
   v
fulfillOrder() -> transaksi Firestore:
   - alokasikan 1 stok belum terjual -> tandai terjual
   - order.status = "paid"
   v
Halaman checkout mendeteksi status "paid" -> GET /api/check-stock
   -> server dekripsi stok -> kirim struk ke pembeli (HANYA jika device cocok & status paid)
```

Semua akses baca/tulis Firestore lewat **Firebase Admin SDK di server** (API routes), bukan client SDK langsung —
supaya kredensial dan data stok tidak pernah bisa diakses langsung dari browser. Lihat `firestore.rules`.

## 1. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Firestore Database** (mode production)
3. Ambil config client: **Project Settings -> General -> Your apps -> Web app** -> salin ke `NEXT_PUBLIC_FIREBASE_*`
4. Ambil service account: **Project Settings -> Service Accounts -> Generate new private key** -> unduh JSON,
   salin `project_id`, `client_email`, `private_key` ke `FIREBASE_ADMIN_*`
5. Deploy security rules & indexes:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## 2. Setup environment variables

```bash
cp .env.example .env
```

Isi semua variabel di `.env`. Poin penting:
- `STOCK_ENCRYPTION_KEY` — string acak (disarankan 32+ karakter), dipakai enkripsi AES data stok. **Jangan pernah
  ganti key ini setelah ada stok tersimpan**, karena data lama tidak akan bisa didekripsi lagi.
- `JWT_SECRET` — string acak panjang untuk session admin.
- `ADMIN_PASSWORD` — password login dashboard admin.
- `ADMIN_SECRET_PATH` — hanya untuk dokumentasi Anda sendiri; **path folder admin harus di-rename manual** (lihat
  bagian 6 di bawah), env var ini tidak dibaca otomatis oleh Next.js karena keterbatasan App Router.

## 3. Install & jalankan lokal

```bash
npm install
npm run seed      # buat dokumen default settings/paymentGateway di Firestore
npm run dev
```

Buka `http://localhost:3000` untuk etalase, dan `http://localhost:3000/admin-22c484081cc4` untuk dashboard admin
(ganti sesuai nama folder yang Anda pakai — lihat bagian 6).

## 4. Setup payment gateway

Isi kredensial di dashboard admin (tab **Payment Gateway**), lalu daftarkan URL webhook berikut di masing-masing
panel merchant gateway:

| Gateway  | Tempat setting webhook                              | URL webhook                                   |
|----------|------------------------------------------------------|------------------------------------------------|
| Midtrans | Settings -> Configuration -> Payment Notification URL | `https://domainanda.com/api/webhook/midtrans` |
| Tripay   | Merchant Panel -> Kalback URL                         | `https://domainanda.com/api/webhook/tripay`   |
| Xendit   | Settings -> Webhooks                                  | `https://domainanda.com/api/webhook/xendit`   |
| Duitku   | Merchant Portal -> Callback URL                       | `https://domainanda.com/api/webhook/duitku`   |

Webhook tidak bisa dites di `localhost` — gunakan tunnel (ngrok/cloudflared) saat development, atau test langsung
di environment sandbox masing-masing gateway setelah deploy.

Catatan implementasi per gateway (di `src/lib/gateways/`):
- **Midtrans**: memakai metode QRIS charge langsung via Core API.
- **Tripay**: memakai channel `QRIS`, signature HMAC-SHA256.
- **Xendit**: memakai endpoint `/qr_codes` (Dynamic QR).
- **Duitku**: memakai `paymentMethod: "SP"` (QRIS), webhook dikirim sbg `form-urlencoded`.

Anda bisa sesuaikan channel pembayaran (bukan hanya QRIS, misal VA/e-wallet spesifik) dengan mengubah body request
di masing-masing file adapter tanpa menyentuh kode order/webhook lain.

## 5. Deploy ke Vercel

```bash
vercel
```

Tambahkan semua environment variable dari `.env` ke **Vercel Project Settings -> Environment Variables**
(termasuk `FIREBASE_ADMIN_PRIVATE_KEY` — tempel apa adanya termasuk karakter `\n`, Vercel akan menyimpannya sebagai
string, dan kode sudah otomatis meng-convert `\n` literal jadi newline asli).

## 6. Mengamankan halaman admin

Folder `src/app/admin-22c484081cc4/` **sudah** di-rename jadi path rahasia ini (cocok dengan `ADMIN_SECRET_PATH`
di environment variables Anda). Dashboard admin bisa diakses di `https://domainanda.com/admin-22c484081cc4`.

1. Jangan pernah link-kan path ini dari halaman publik manapun (navbar, footer, sitemap).
2. Password login (`ADMIN_PASSWORD`) adalah lapisan kedua — jadi walau seseorang menebak path-nya, mereka masih
   butuh password untuk masuk dashboard.
3. Disarankan tambahkan juga proteksi di level hosting (mis. Vercel Password Protection / IP allowlist) sebagai
   lapisan ketiga jika tersedia di paket Anda.
4. Kalau suatu saat ingin ganti path rahasia ini lagi, cukup rename folder `src/app/admin-22c484081cc4/` ke nama
   baru, lalu update juga `public/robots.txt` dan `ADMIN_SECRET_PATH` di environment variables supaya tetap konsisten.

## Alur auto order (cara kerja)

1. Pengunjung klik **Beli** -> `POST /api/order` membuat dokumen `orders/{orderId}` berstatus `pending`, dan meminta
   QR/link pembayaran ke gateway yang sedang aktif.
2. Halaman `/checkout/[orderId]` melakukan polling `GET /api/order` tiap 3 detik untuk memantau perubahan status.
3. Begitu pembayaran masuk, gateway mengirim **webhook** ke `/api/webhook/{gateway}`.
4. Webhook memverifikasi signature (mencegah pemalsuan notifikasi), lalu memanggil `fulfillOrder()` yang:
   - Mengambil 1 dokumen `stok` yang `terjual: false` untuk produk terkait
   - Menandainya `terjual: true` dan mengaitkannya ke `orderId`
   - Mengubah `orders/{orderId}.status` menjadi `paid`
   - Semua ini dalam **satu transaksi Firestore** (atomic) dan **idempotent** (aman jika webhook dikirim ulang)
5. Halaman checkout yang sedang polling mendeteksi status `paid`, lalu memanggil `GET /api/check-stock` yang
   mendekripsi data stok dan mengirimkannya sebagai struk — **hanya** jika `deviceId` pemanggil cocok dengan
   pembuat order.
6. Struk juga bisa diakses ulang lewat halaman **Riwayat Pesanan** (per-device, kedaluwarsa 30 hari).

## Catatan keamanan

- Data stok (email/password/2FA) **selalu terenkripsi AES** di Firestore (`src/lib/crypto-stok.ts`) dan hanya
  didekripsi di server, sesaat sebelum dikirim ke pembeli yang statusnya sudah `paid`.
- Firestore Security Rules (`firestore.rules`) menolak **semua** baca/tulis langsung dari client SDK — seluruh
  akses data wajib lewat API routes yang memakai Firebase Admin SDK (yang otomatis melewati rules).
- Signature webhook diverifikasi di setiap adapter gateway (`verifyWebhookSignature`) sebelum status order
  diubah — mencegah orang mengirim webhook palsu untuk "membayar gratis".
- Endpoint `/api/check-stock` memvalidasi `deviceId` pemanggil harus sama dengan `deviceId` pembuat order.

## Hal yang perlu Anda sesuaikan sebelum produksi

- [ ] Ganti seluruh isi `.env` dengan nilai asli (jangan pernah commit `.env` ke git)
- [ ] Rename folder admin sesuai bagian 6
- [ ] Deploy `firestore.rules` & `firestore.indexes.json`
- [ ] Jalankan `npm run seed` sekali di awal
- [ ] Uji alur pembayaran end-to-end di mode **sandbox** tiap gateway sebelum mengaktifkan mode produksi
- [ ] Pertimbangkan hash password admin (bcrypt) jika ingin lapisan keamanan lebih dari sekadar env var plain
- [ ] Tambahkan halaman kebijakan refund/CS untuk kasus "stok habis setelah dibayar" (sudah dideteksi otomatis
      oleh sistem di `fulfillOrder()`, tapi tindak lanjutnya—refund/restock—masih manual oleh admin)
