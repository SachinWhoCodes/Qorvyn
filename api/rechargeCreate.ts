import { getAdmin } from "./_lib/firebaseAdmin.js";
import { requireUser } from "./_lib/auth.js";
import { getJson } from "./_lib/body.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const decoded = await requireUser(req);
    const body = getJson(req);

    const credits = Math.max(1, Number(body?.credits ?? 0));
    const amount = Math.max(1, Number(body?.amount ?? credits));
    const utr = (body?.utr || "").toString().trim();
    const notes = (body?.notes || "").toString().trim();

    if (!utr) return res.status(400).json({ error: "Transaction ID (UTR) is required" });

    const { db } = getAdmin();
    if (!db) return res.status(500).json({ error: "Firebase not configured" });

    const doc = await db.collection("rechargeRequests").add({
      uid: decoded.uid,
      email: decoded.email || "",
      credits,
      amount,
      utr,
      notes: notes || null,
      status: "pending",
      createdAt: new Date(),
    });

    return res.json({ id: doc.id });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

