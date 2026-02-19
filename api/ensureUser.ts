import { authAdmin, dbAdmin, adminReady, ServerValue } from "./_lib/firebaseAdmin.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!adminReady || !authAdmin || !dbAdmin) {
      return res.status(500).json({
        error: "Firebase Admin not configured",
        needed: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
      });
    }

    const authHeader = req.headers?.authorization || "";
    const m = authHeader.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const decoded = await authAdmin.verifyIdToken(m[1]);
    const uid = decoded.uid;

    const { name, email } = req.body || {};
    const userRef = dbAdmin.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        uid,
        name: name || decoded.name || "",
        email: email || decoded.email || "",
        credits: 100,
        createdAt: ServerValue.serverTimestamp(),
        updatedAt: ServerValue.serverTimestamp(),
      });
      return res.status(201).json({ ok: true, created: true, credits: 100 });
    }

    const data = snap.data() || {};
    const patch: any = { updatedAt: ServerValue.serverTimestamp() };

    if (!data.name && (name || decoded.name)) patch.name = name || decoded.name;
    if (!data.email && (email || decoded.email)) patch.email = email || decoded.email;
    if (typeof data.credits !== "number") patch.credits = 100;

    if (Object.keys(patch).length > 1) {
      await userRef.set(patch, { merge: true });
    }

    return res.status(200).json({ ok: true, created: false, credits: data.credits ?? 100 });
  } catch (e: any) {
    // IMPORTANT: return real error so you can see it in Network->Response
    return res.status(500).json({
      error: "ensureUser failed",
      message: e?.message || String(e),
      stack: e?.stack || null,
    });
  }
}

