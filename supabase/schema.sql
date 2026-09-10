-- =====================================================================
-- SKEMA DATABASE JUNZTOPP
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New Query
-- lalu paste SELURUH isi file ini > klik RUN.
-- =====================================================================

-- 1. PROFIL PENGGUNA (dibuat otomatis saat user signup)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  is_member boolean default true,          -- true = terdaftar, dapat diskon
  role text default 'customer',            -- 'customer' atau 'admin'
  discount_percent numeric default 3,      -- diskon default member (%)
  created_at timestamptz default now()
);

-- Trigger: otomatis buat baris profil saat ada user baru daftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. KATEGORI PRODUK (contoh: Game, Pulsa, E-Wallet)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  sort_order int default 0
);

-- 3. PRODUK / LAYANAN TOPUP (misal: Mobile Legends, Free Fire, dsb)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  input_label text default 'User ID',
  input_placeholder text default 'Masukkan ID Anda',
  needs_server_id boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. VARIAN NOMINAL PER PRODUK (misal: 86 Diamond, 172 Diamond, dst)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  base_price numeric not null,
  sell_price numeric not null,
  digiflazz_sku text,           -- WAJIB diisi lewat /admin agar topup otomatis Digiflazz jalan
  is_active boolean default true,
  sort_order int default 0
);

-- 5. TRANSAKSI / ORDER
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  guest_whatsapp text,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  target_id text not null,
  target_server text,
  price numeric not null,
  discount_applied numeric default 0,
  final_price numeric not null,
  payment_gateway text not null,
  payment_reference text,
  payment_method text,
  status text not null default 'pending', -- pending|paid|processing|success|failed|expired
  raw_gateway_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. KRITIK & SARAN (hasil sensor disimpan berdampingan dengan aslinya)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  message_original text not null,
  message_filtered text not null,
  was_censored boolean default false,
  created_at timestamptz default now()
);

-- 7. PENGATURAN SITUS (agar admin bisa ubah tanpa redeploy)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.site_settings (key, value) values
  ('site_name', '"JunzTopp"'),
  ('whatsapp_link', '"https://wa.me/agenstyzenid"'),
  ('default_theme', '"dark"'),
  ('maintenance_mode', 'false'),
  ('announcement', '""')
on conflict (key) do nothing;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.feedback enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.categories enable row level security;
alter table public.site_settings enable row level security;

create policy "profil sendiri - lihat" on public.profiles for select using (auth.uid() = id);
create policy "profil sendiri - update" on public.profiles for update using (auth.uid() = id);

create policy "produk publik" on public.products for select using (true);
create policy "varian publik" on public.product_variants for select using (true);
create policy "kategori publik" on public.categories for select using (true);
create policy "settings publik" on public.site_settings for select using (true);

create policy "order milik sendiri" on public.orders for select using (auth.uid() = user_id);
create policy "siapa saja boleh buat order" on public.orders for insert with check (true);

create policy "siapa saja boleh kirim feedback" on public.feedback for insert with check (true);

-- Catatan: update/delete produk, update status order, dan pembacaan feedback ASLI
-- dilakukan lewat SUPABASE_SERVICE_ROLE_KEY di server (API routes), bukan dari
-- browser, jadi tidak perlu policy update/delete tambahan di sini.

-- =====================================================================
-- CONTOH DATA (boleh diubah/dihapus lewat halaman /admin)
-- =====================================================================
insert into public.categories (name, slug, icon, sort_order) values
  ('Game', 'game', 'gamepad-2', 1),
  ('Pulsa & Data', 'pulsa', 'smartphone', 2),
  ('E-Wallet', 'ewallet', 'wallet', 3)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, input_label, input_placeholder, needs_server_id, sort_order)
select id, 'Mobile Legends', 'mobile-legends', 'Top up Diamond Mobile Legends, proses cepat 24 jam.', 'User ID', 'Contoh: 123456789', true, 1
from public.categories where slug = 'game'
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, input_label, input_placeholder, needs_server_id, sort_order)
select id, 'Free Fire', 'free-fire', 'Top up Diamond Free Fire, langsung masuk akun.', 'User ID', 'Contoh: 987654321', false, 2
from public.categories where slug = 'game'
on conflict (slug) do nothing;

insert into public.product_variants (product_id, name, base_price, sell_price, sort_order)
select id, '86 Diamond', 20000, 22000, 1 from public.products where slug = 'mobile-legends'
on conflict do nothing;
insert into public.product_variants (product_id, name, base_price, sell_price, sort_order)
select id, '172 Diamond', 38000, 41000, 2 from public.products where slug = 'mobile-legends'
on conflict do nothing;
insert into public.product_variants (product_id, name, base_price, sell_price, sort_order)
select id, '70 Diamond', 10000, 11000, 1 from public.products where slug = 'free-fire'
on conflict do nothing;
