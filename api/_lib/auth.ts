import { getAdmin } from "./firebaseAdmin";

export async function requireUser(req: any) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const { auth } = getAdmin();
  const decoded = await auth.verifyIdToken(token);
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

