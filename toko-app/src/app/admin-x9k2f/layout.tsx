// PENTING: nama folder "admin-x9k2f" ini HARUS diganti sesuai ADMIN_SECRET_PATH di .env Anda.
// Next.js App Router butuh nama folder statis, jadi rename folder ini manual sebelum deploy,
// menjadi path acak & rahasia yang hanya Anda tahu (jangan pernah link-kan dari halaman publik).
import "../globals.css";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh" }}>{children}</div>;
}
