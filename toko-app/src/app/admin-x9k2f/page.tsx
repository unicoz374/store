import { isAdminLoggedIn } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const loggedIn = isAdminLoggedIn();
  return loggedIn ? <AdminDashboard /> : <AdminLoginForm />;
}
