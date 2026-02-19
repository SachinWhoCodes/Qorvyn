import { getAdmin } from "./_lib/firebaseAdmin";
import { requireUser, requireAdminEmail } from "./_lib/auth";
import { getJson } from "./_lib/body";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const decoded = await requireUser(req);
    requireAdminEmail(decoded.email);

    const body = getJson(req);
    const id = (body?.id || "").toString();
    if (!id) return res.status(400).json({ error: "Missing request id" });

    const { db } = getAdmin();
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const reqRef = db.collection("rechargeRequests").doc(id);

    await db.runTransaction(async (tx) => {
      const rqSnap = await tx.get(reqRef);
      if (!rqSnap.exists) throw Object.assign(new Error("Request not found"), { status: 404 });

      const rq = rqSnap.data() as any;
      if (rq.status !== "pending") return;

      const uid = rq.uid;
      const addCredits = Number(rq.credits ?? 0);

      const userRef = db.collection("users").doc(uid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw Object.assign(new Error("User not found"), { status: 404 });

      const current = Number((userSnap.data() as any)?.credits ?? 0);
      tx.update(userRef, { credits: current + addCredits, updatedAt: new Date() });

      tx.update(reqRef, {
        status: "approved",
        processedAt: new Date(),
        processedBy: decoded.email || "admin",
      });

      tx.set(db.collection("usageLogs").doc(), {
        uid,
        delta: addCredits,
        reason: "recharge_approved",
        createdAt: new Date(),
        meta: { requestId: id },
      });
    });

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

