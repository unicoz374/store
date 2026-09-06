// Path rahasia dashboard admin: /admin-22c484081cc4 (sesuai ADMIN_SECRET_PATH di .env).
// Jangan pernah link-kan path ini dari halaman publik manapun.
import "../globals.css";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh" }}>{children}</div>;
}
