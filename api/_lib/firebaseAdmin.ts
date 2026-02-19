import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function env(name: string) {
  return (process.env[name] || "").trim();
}

const projectId = env("FIREBASE_PROJECT_ID");
const clientEmail = env("FIREBASE_CLIENT_EMAIL");
const privateKeyRaw = env("FIREBASE_PRIVATE_KEY");
// supports both formats: actual newlines OR \n
const privateKey = privateKeyRaw.includes("\\n")
  ? privateKeyRaw.replace(/\\n/g, "\n")
  : privateKeyRaw;

export const adminReady = Boolean(projectId && clientEmail && privateKey);

if (!getApps().length && adminReady) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const authAdmin = adminReady ? getAuth() : null;
export const dbAdmin = adminReady ? getFirestore() : null;
export const ServerValue = FieldValue;

export function getAdmin() {
  return {
    auth: authAdmin,
    db: dbAdmin,
  };
}

