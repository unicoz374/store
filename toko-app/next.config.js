/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      // Tambahkan hostname lain di sini kalau URL gambar produk Anda dari domain berbeda,
      // contoh: { protocol: "https", hostname: "res.cloudinary.com" }
      { protocol: "https", hostname: "**.googleusercontent.com" }
    ]
  }
};

module.exports = nextConfig;
