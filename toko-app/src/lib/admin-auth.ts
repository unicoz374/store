import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "";
const COOKIE_NAME = "admin_session";

export function createAdminSession(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

/** Dipakai di Server Component / layout admin untuk cek sesi login */
export function isAdminLoggedIn(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

/** Dipakai di API routes untuk validasi request datang dari admin yang sudah login */
export function isAdminRequest(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return verifyAdminToken(match?.[1]);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
