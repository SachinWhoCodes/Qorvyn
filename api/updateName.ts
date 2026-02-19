import { getAdmin } from "./_lib/firebaseAdmin.js";
import { requireUser } from "./_lib/auth.js";
import { getJson } from "./_lib/body.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const decoded = await requireUser(req);
    const body = getJson(req);

    const name = (body?.name || "").toString().trim();
    if (!name) return res.status(400).json({ error: "Name required" });

    const { db } = getAdmin();
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    await db.collection("users").doc(decoded.uid).set({ name, updatedAt: new Date() }, { merge: true });

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

