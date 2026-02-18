import { getAdmin } from "./_lib/firebaseAdmin";
import { requireUser, requireAdminEmail } from "./_lib/auth";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const decoded = await requireUser(req);
    requireAdminEmail(decoded.email);

    const { db } = getAdmin();
    const snap = await db.collection("rechargeRequests").orderBy("createdAt", "desc").limit(200).get();

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

