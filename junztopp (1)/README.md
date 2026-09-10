# JunzTopp

Website topup game/pulsa/e-wallet — Next.js + Supabase (database, auth, OAuth) +
payment gateway multi-provider (Midtrans, TransaksiKita, mudah ditambah lagi) +
Digiflazz (eksekusi topup otomatis) + tema black/light + kritik-saran auto-sensor
+ livechat bot.

---

## 1. Yang perlu Anda siapkan sebelum mulai

1. Akun **GitHub** (untuk simpan kode).
2. Akun **Vercel** (untuk hosting, gratis) — https://vercel.com, login pakai GitHub.
3. Akun **Supabase** (database + login) — https://supabase.com, buat 1 project baru.
4. Akun **payment gateway** — misalnya **Midtrans** (https://midtrans.com) dan/atau
   **TransaksiKita** (https://transaksikita.com).
5. Akun **Digiflazz** (https://digiflazz.com) — untuk eksekusi topup ke provider game/pulsa.

---

## 2. Setup Supabase (database + login)

1. Buka project Supabase Anda > menu **SQL Editor** > **New query**.
2. Buka file `supabase/schema.sql` di folder proyek ini, **copy semua isinya**,
   paste ke SQL Editor, lalu klik **Run**. Ini akan membuat semua tabel yang
   dibutuhkan (produk, order, feedback, pengaturan, dll) + data contoh 2 produk.
3. Buka menu **Project Settings > API**, catat 3 nilai ini (akan dipakai di
   langkah 4):
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → jadi `SUPABASE_SERVICE_ROLE_KEY` (⚠️ RAHASIA, jangan
     pernah dibagikan atau ditaruh di kode frontend)
4. **(Opsional) Aktifkan login Google:** menu **Authentication > Providers >
   Google**, ikuti petunjuk Supabase untuk isi Client ID & Secret dari Google
   Cloud Console.
5. **Jadikan akun Anda admin** (supaya bisa buka halaman `/admin`): setelah
   Anda daftar/login pertama kali di situs, buka **Table Editor > profiles**,
   cari baris dengan email Anda, ubah kolom `role` dari `customer` jadi `admin`.

---

## 3. Setup environment variables (`.env.local`)

1. Copy file `.env.example` jadi `.env.local`:
   ```
   cp .env.example .env.local
   ```
2. Isi semua nilai sesuai akun Supabase, Midtrans/TransaksiKita, dan Digiflazz
   Anda. Setiap baris sudah diberi komentar penjelasan.
3. Khusus `PAYMENT_GATEWAY_ACTIVE`, isi salah satu:
   - `mock` — simulasi, tidak butuh API key sama sekali, dipakai untuk
     melihat & mencoba tampilan/alur checkout dulu (tidak ada uang beneran).
   - `midtrans` atau `transaksikita` — pembayaran sungguhan, butuh API key asli.

> **PENTING soal TransaksiKita.com:** kode adapter untuk gateway ini
> (`lib/payment/transaksikita.ts`) dibuat mengikuti pola umum REST API +
> callback signature yang lazim dipakai payment gateway QRIS lokal, KARENA
> dokumentasi endpoint publik mereka tidak bisa saya pastikan 100% persis.
> Sebelum dipakai transaksi sungguhan, buka dashboard TransaksiKita Anda >
> menu API/Dokumentasi, lalu cocokkan/ubah bagian yang ditandai
> `// SESUAIKAN` di file tersebut. Untuk Midtrans, kodenya sudah mengikuti
> dokumentasi resmi Snap API dan siap pakai.

---

## 4. Jalankan di komputer Anda (opsional, untuk coba dulu)

```bash
npm install
npm run dev
```
Buka http://localhost:3000

---

## 5. Upload ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - JunzTopp"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/junztopp.git
git push -u origin main
```
(Ganti `USERNAME-ANDA` dengan username GitHub Anda. Buat dulu repo kosong
bernama `junztopp` di github.com/new sebelum push.)

File `.env.local` **tidak akan ikut ter-upload** (sudah diblokir lewat
`.gitignore`) — ini memang disengaja demi keamanan, karena isinya kunci
rahasia.

---

## 6. Deploy ke Vercel

1. Buka https://vercel.com/new, pilih repo `junztopp` dari GitHub Anda.
2. Sebelum klik Deploy, buka bagian **Environment Variables**, lalu masukkan
   SEMUA baris yang ada di `.env.local` Anda satu per satu (key dan value-nya).
3. Klik **Deploy**. Setelah selesai, Anda akan dapat URL seperti
   `https://junztopp.vercel.app`.
4. Daftarkan URL webhook payment gateway di dashboard Midtrans/TransaksiKita:
   ```
   https://junztopp.vercel.app/api/payment/webhook?gateway=midtrans
   https://junztopp.vercel.app/api/payment/webhook?gateway=transaksikita
   ```
5. Kalau pakai login Google, tambahkan URL berikut ke **Redirect URLs** di
   Supabase Authentication settings:
   ```
   https://junztopp.vercel.app/auth/callback
   ```

---

## 7. Cara mengubah pengaturan situs kapan saja (TANPA perlu ubah kode/deploy ulang)

Login sebagai admin (lihat langkah 2.5) lalu buka halaman **`/admin`** di
situs Anda. Dari sana Anda bisa ubah, dan langsung tersimpan/tampil ke
pengunjung:
- Nama situs
- Link WhatsApp admin (untuk livechat fallback & tombol kontak)
- Tema default untuk pengunjung baru (black/light) — pengunjung tetap bisa
  ganti sendiri lewat tombol 🌙/☀️ di pojok kanan atas
- Pengumuman (banner di atas situs)
- Mode maintenance (tutup sementara situs)

## 8. Cara menambah/mengubah produk & nominal topup

Buka **Supabase Dashboard > Table Editor**:
- Tabel `categories` — kategori produk (Game, Pulsa, dll)
- Tabel `products` — daftar produk (nama, deskripsi, apakah butuh Server ID)
- Tabel `product_variants` — nominal per produk (nama, harga jual, dan kolom
  **`digiflazz_sku`** — WAJIB diisi dengan kode SKU dari Digiflazz Anda
  supaya topup ke pelanggan berjalan otomatis setelah pembayaran sukses)

Cek kode SKU & harga modal terbaru dari Digiflazz lewat menu **Cek Harga**
di akun Digiflazz Anda, atau panggil fungsi `getDigiflazzPriceList()` di
`lib/digiflazz.ts`.

## 9. Cara kerja & cara ubah filter kata kotor di kolom Kritik & Saran

Semua kata yang disensor otomatis diatur di satu tempat:
`lib/profanityFilter.ts`, di dalam array `BLOCKED_WORDS`. Untuk menambah
atau menghapus kata, tinggal edit array tersebut (tulis huruf kecil semua),
tidak perlu ubah bagian kode lain.

## 10. Cara kerja livechat bot

Bot menjawab otomatis berdasarkan aturan di `app/api/chat/route.ts`:
- Kalau pengunjung menyebut kode pesanan (format `JZT-XXXXXX`), bot akan
  mengecek status transaksi tersebut langsung dari database.
- Kalau pertanyaan cocok dengan salah satu topik di array `FAQ`, bot
  menjawab sesuai jawaban yang sudah disiapkan.
- Kalau tidak cocok dengan keduanya, bot otomatis mengarahkan pengunjung
  ke link WhatsApp Anda (`NEXT_PUBLIC_WHATSAPP_LINK` di environment
  variables / bisa juga diubah lewat halaman `/admin`).

Untuk menambah topik FAQ baru, tambahkan objek baru ke array `FAQ` di file
tersebut.

## 11. Menambah payment gateway baru di kemudian hari

1. Buat file baru di `lib/payment/nama-gateway.ts`, ikuti struktur/interface
   yang sama seperti `lib/payment/midtrans.ts` (implementasikan
   `createTransaction` dan `verifyWebhook`).
2. Daftarkan gateway baru tersebut di `lib/payment/index.ts`.
3. Ubah `PAYMENT_GATEWAY_ACTIVE` di environment variables Vercel ke nama
   gateway baru itu, lalu redeploy.

---

## Struktur folder singkat

```
app/                  halaman & API routes (Next.js App Router)
  api/checkout        proses buat pesanan + minta link/QR bayar
  api/payment/webhook penerima notifikasi pembayaran dari gateway
  api/digiflazz       (opsional, untuk sinkron harga produk)
  api/feedback        terima kritik & saran + sensor otomatis
  api/chat            livechat bot
  api/admin/settings  simpan pengaturan situs oleh admin
  produk/[slug]       halaman detail produk & checkout
  login, daftar       autentikasi
  akun, riwayat       area member
  admin               panel pengaturan situs (khusus role admin)
components/           komponen UI yang dipakai berulang
lib/payment/          adapter tiap payment gateway
lib/digiflazz.ts      integrasi Digiflazz
lib/profanityFilter.ts daftar kata yang disensor otomatis
supabase/schema.sql   skema database lengkap, tinggal di-Run sekali
```
