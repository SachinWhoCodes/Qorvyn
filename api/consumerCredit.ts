import { getAdmin } from "./_lib/firebaseAdmin";
import { requireUser } from "./_lib/auth";
import { getJson } from "./_lib/body";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const decoded = await requireUser(req);
    const body = getJson(req);
    const amount = Math.max(1, Math.min(10, Number(body?.amount ?? 1)));

    const { db } = getAdmin();
    const userRef = db.collection("users").doc(decoded.uid);

    const nextCredits = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw Object.assign(new Error("User not found"), { status: 404 });

      const credits = Number((snap.data() as any)?.credits ?? 0);
      if (credits <= 0) throw Object.assign(new Error("Out of credits"), { status: 402 });

      const next = Math.max(0, credits - amount);
      tx.update(userRef, { credits: next, updatedAt: new Date() });

      tx.set(db.collection("usageLogs").doc(), {
        uid: decoded.uid,
        delta: -amount,
        reason: "listening",
        createdAt: new Date(),
      });

      return next;
    });

    return res.json({ credits: nextCredits });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Server error" });
  }
}

