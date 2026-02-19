import { authAdmin } from "./firebaseAdmin";

export async function requireUser(req: any) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  if (!authAdmin) throw Object.assign(new Error("Firebase not configured"), { status: 500 });
  const decoded = await authAdmin.verifyIdToken(token);
  return decoded;
}

export function requireAdminEmail(email?: string | null) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !admins.includes(email.toLowerCase())) {
    throw Object.assign(new Error("Forbidden (admin only)"), { status: 403 });
  }
}

