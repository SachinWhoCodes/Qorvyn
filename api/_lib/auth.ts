import { authAdmin } from "./firebaseAdmin.js";

export async function requireUser(req: any) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  if (!authAdmin) throw Object.assign(new Error("Firebase not configured"), { status: 500 });
  return await authAdmin.verifyIdToken(token);
}

export function requireAdmin(decoded: { uid?: string; email?: string | null }) {
  const emails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (!decoded.email || !emails.includes(decoded.email.toLowerCase())) {
    throw Object.assign(new Error("Forbidden (admin only)"), { status: 403 });
  }
}

