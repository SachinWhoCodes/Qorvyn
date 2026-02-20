import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { collection, doc, onSnapshot, query, where, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

export interface User {
  uid: string;
  name: string;
  email: string;
}

export interface RechargeRequest {
  id: string;
  amount: number;
  utr: string;
  credits: number;
  status: "pending" | "approved" | "rejected";
  date: string;
  notes?: string;
}

interface AppContextType {
  user: User | null;
  credits: number;

  isListening: boolean;
  listeningSeconds: number;
  demoSecondsUsed: number;

  micPermission: "granted" | "denied" | "prompt";
  setMicPermission: (p: "granted" | "denied" | "prompt") => void;

  rechargeRequests: RechargeRequest[];

  showMicModal: boolean;
  showDemoEndedModal: boolean;
  showLowCreditsModal: boolean;
  showOutOfCreditsModal: boolean;
  showOnboarding: boolean;

  setShowMicModal: (v: boolean) => void;
  setShowDemoEndedModal: (v: boolean) => void;
  setShowLowCreditsModal: (v: boolean) => void;
  setShowOutOfCreditsModal: (v: boolean) => void;
  setShowOnboarding: (v: boolean) => void;

  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  startListening: () => void;
  stopListening: () => void;

  addRechargeRequest: (req: { amount: number; utr: string; credits: number; notes?: string }) => Promise<void>;

  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

function safeNameFromFirebase(u: FirebaseUser) {
  return (u.displayName || u.email?.split("@")[0] || "User").trim();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [listeningSeconds, setListeningSeconds] = useState(0);

  const [demoSecondsUsed, setDemoSecondsUsed] = useState(() => {
    const v = localStorage.getItem("demoSecondsUsed");
    return v ? Number(v) : 0;
  });

  const [micPermission, _setMicPermission] = useState<"granted" | "denied" | "prompt">(() => {
    const v = localStorage.getItem("micPermission");
    return (v as any) || "prompt";
  });

  const micPermissionRef = useRef(micPermission);
  const setMicPermission = (p: "granted" | "denied" | "prompt") => {
    micPermissionRef.current = p;
    _setMicPermission(p);
    localStorage.setItem("micPermission", p);
  };

  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);

  const [showMicModal, setShowMicModal] = useState(false);
  const [showDemoEndedModal, setShowDemoEndedModal] = useState(false);
  const [showLowCreditsModal, setShowLowCreditsModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const lowCreditsShownRef = useRef(false);
  const billingInFlightRef = useRef(false);

  const [darkMode, setDarkMode] = useState(() => {
    const v = localStorage.getItem("darkMode");
    return v ? v === "true" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(p => !p);

  // Persist demo usage
  useEffect(() => {
    localStorage.setItem("demoSecondsUsed", String(demoSecondsUsed));
  }, [demoSecondsUsed]);

  // Auth + Firestore realtime bindings
  useEffect(() => {
    let unsubUserDoc: null | (() => void) = null;
    let unsubRecharge: null | (() => void) = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // cleanup old listeners
      if (unsubUserDoc) unsubUserDoc();
      if (unsubRecharge) unsubRecharge();
      unsubUserDoc = null;
      unsubRecharge = null;

      if (!fbUser) {
        setUser(null);
        setCredits(0);
        setRechargeRequests([]);
        lowCreditsShownRef.current = false;
        return;
      }

      // Ensure user doc exists + gets 100 credits on first creation (server-side)
      try {
        await apiFetch("/api/ensureUser", { method: "POST", json: { name: safeNameFromFirebase(fbUser) } });
      } catch {
        // ignore; we will still try to read doc
      }

      const u: User = {
        uid: fbUser.uid,
        name: safeNameFromFirebase(fbUser),
        email: fbUser.email || "",
      };
      setUser(u);

      // user doc live
      const ref = doc(db, "users", fbUser.uid);
      unsubUserDoc = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data: any = snap.data();
        setCredits(Number(data.credits ?? 0));
        setUser((prev) => prev ? ({ ...prev, name: data.name || prev.name, email: data.email || prev.email }) : prev);
      });

      // recharge requests live (user)
      const rq = query(collection(db, "rechargeRequests"), where("uid", "==", fbUser.uid));
      unsubRecharge = onSnapshot(rq, (snap) => {
        const list: RechargeRequest[] = snap.docs.map(d => {
          const r: any = d.data();
          return {
            id: d.id,
            amount: Number(r.amount ?? 0),
            credits: Number(r.credits ?? 0),
            utr: String(r.utr ?? ""),
            status: (r.status || "pending"),
            notes: r.notes || undefined,
            date: r.createdAt?.toDate?.().toISOString?.() || new Date().toISOString(),
          };
        });

        // newest first (no Firestore orderBy to avoid index needs)
        list.sort((a, b) => (b.date > a.date ? 1 : -1));
        setRechargeRequests(list);
      });

      // reset onboarding warning flags
      lowCreditsShownRef.current = false;
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubRecharge) unsubRecharge();
    };
  }, []);

  // Credit/demo timer
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(async () => {
      setListeningSeconds((s) => s + 1);

      // demo mode (not logged in)
      if (!user) {
        setDemoSecondsUsed((prev) => {
          const next = prev + 1;
          if (next >= 180) {
            setIsListening(false);
            setShowDemoEndedModal(true);
          }
          return next;
        });
        return;
      }

      // logged in: bill 1 credit per 60 seconds
      const nextSecond = listeningSeconds + 1;
      if (nextSecond > 0 && nextSecond % 60 === 0) {
        if (billingInFlightRef.current) return;
        billingInFlightRef.current = true;

        try {
          const r = await apiFetch<{ credits: number }>("/api/consumeCredit", {
            method: "POST",
            json: { amount: 1 },
          });

          setCredits(r.credits);

          if (r.credits <= 0) {
            setIsListening(false);
            setShowOutOfCreditsModal(true);
          } else if (r.credits <= 10 && !lowCreditsShownRef.current) {
            lowCreditsShownRef.current = true;
            setShowLowCreditsModal(true);
          }
        } catch (e: any) {
          // out-of-credits
          if (e?.status === 402) {
            setIsListening(false);
            setShowOutOfCreditsModal(true);
          }
        } finally {
          billingInFlightRef.current = false;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isListening, user, listeningSeconds]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Ensure user doc exists (server). If this fails, don't block login UI.
      try {
        await apiFetch("/api/ensureUser", { method: "POST", json: {} });
      } catch (e) {
        console.error("ensureUser failed during login:", e);
      }
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Ensure user doc exists (server). If this fails, the account still exists in Auth.
      try {
        await apiFetch("/api/ensureUser", { method: "POST", json: { name } });
      } catch (e) {
        console.error("ensureUser failed during register:", e);
      }

      setShowOnboarding(true);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    setIsListening(false);
    setListeningSeconds(0);
    try { await signOut(auth); } catch { /* ignore */ }
  };

  const startListening = () => {
    if (micPermissionRef.current === "prompt") {
      setShowMicModal(true);
      return;
    }
    if (micPermissionRef.current === "denied") return;

    if (user && credits <= 0) {
      setShowOutOfCreditsModal(true);
      return;
    }

    setIsListening(true);
    setListeningSeconds(0);
  };

  const stopListening = () => setIsListening(false);

  const addRechargeRequest = async (req: { amount: number; utr: string; credits: number; notes?: string }) => {
    if (!user) return;
    await apiFetch("/api/rechargeCreate", { method: "POST", json: req });
  };

  const value = useMemo<AppContextType>(() => ({
    user,
    credits,
    isListening,
    listeningSeconds,
    demoSecondsUsed,
    micPermission,
    setMicPermission,
    rechargeRequests,

    showMicModal,
    showDemoEndedModal,
    showLowCreditsModal,
    showOutOfCreditsModal,
    showOnboarding,

    setShowMicModal,
    setShowDemoEndedModal,
    setShowLowCreditsModal,
    setShowOutOfCreditsModal,
    setShowOnboarding,

    login,
    register,
    logout,

    startListening,
    stopListening,

    addRechargeRequest,

    darkMode,
    toggleDarkMode,
  }), [
    user, credits, isListening, listeningSeconds, demoSecondsUsed,
    micPermission, rechargeRequests,
    showMicModal, showDemoEndedModal, showLowCreditsModal, showOutOfCreditsModal, showOnboarding,
    darkMode
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

