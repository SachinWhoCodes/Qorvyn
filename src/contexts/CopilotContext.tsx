import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";

export type KeyMomentType = "decision" | "number" | "risk";

export interface TranscriptEntry {
  id: number;
  time: string;
  speaker: string;
  text: string;
  bookmarked?: boolean;
  isKeyMoment?: boolean;
  keyMomentType?: KeyMomentType;
}

export interface KnowledgeCard {
  id: string;
  emoji: string;
  title: string;
  content: string[];
  tags?: string[];
  sources?: string[];
  confidence?: number;
}

export interface PredictedPath {
  text: string;
  probability: number;
  why: string;
}

export interface TalkingPoint {
  text: string;
  tone: "curious" | "confident" | "neutral";
}

export interface FollowUp {
  text: string;
}

type CopilotState = {
  entries: TranscriptEntry[];
  interimText: string;
  isUpdating: boolean;
  lastUpdateSecondsAgo: number | null;
  knowledgeCards: KnowledgeCard[];
  predictedPaths: PredictedPath[];
  talkingPoints: TalkingPoint[];
  followUps: FollowUp[];
  error: string | null;
  clear: () => void;
};

const CopilotContext = createContext<CopilotState | null>(null);

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}

// TS-friendly SpeechRecognition access
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

function detectKeyMoment(text: string): { isKeyMoment: boolean; type?: KeyMomentType } {
  const t = text.toLowerCase();

  // number
  if (/\b\d+(\.\d+)?\b/.test(t) || t.includes("$") || t.includes("₹") || t.includes("%")) {
    return { isKeyMoment: true, type: "number" };
  }

  // risk
  if (t.includes("risk") || t.includes("issue") || t.includes("problem") || t.includes("rollback") || t.includes("failure")) {
    return { isKeyMoment: true, type: "risk" };
  }

  // decision
  if (t.includes("let's") || t.includes("we should") || t.includes("decide") || t.includes("finalize") || t.includes("agree")) {
    return { isKeyMoment: true, type: "decision" };
  }

  return { isKeyMoment: false };
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const { isListening } = useApp();

  const recognitionRef = useRef<any>(null);
  const shouldRunRef = useRef(false);

  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [predictedPaths, setPredictedPaths] = useState<PredictedPath[]>([]);
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lastSentAtRef = useRef<number>(0);
  const pendingTimeoutRef = useRef<any>(null);
  const lastUpdateAtRef = useRef<number | null>(null);

  const [lastUpdateSecondsAgo, setLastUpdateSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (!lastUpdateAtRef.current) {
        setLastUpdateSecondsAgo(null);
        return;
      }
      const diff = Math.floor((Date.now() - lastUpdateAtRef.current) / 1000);
      setLastUpdateSecondsAgo(diff);
    }, 1000);

    return () => clearInterval(t);
  }, []);

  const clear = () => {
    setEntries([]);
    setInterimText("");
    setKnowledgeCards([]);
    setPredictedPaths([]);
    setTalkingPoints([]);
    setFollowUps([]);
    setError(null);
    lastUpdateAtRef.current = null;
  };

  const makeTranscriptPayload = (list: TranscriptEntry[]) => {
    // last ~30 entries, limited chars
    const last = list.slice(-30);
    const text = last.map(e => `${e.speaker}: ${e.text}`).join("\n");
    return text.slice(-3500);
  };

  const triggerGroqUpdate = (list: TranscriptEntry[]) => {
    const now = Date.now();

    // throttle: no more than once per 4s
    if (now - lastSentAtRef.current < 4000) {
      if (pendingTimeoutRef.current) return;
      pendingTimeoutRef.current = setTimeout(() => {
        pendingTimeoutRef.current = null;
        triggerGroqUpdate(list);
      }, 1000);
      return;
    }

    lastSentAtRef.current = now;

    (async () => {
      try {
        setIsUpdating(true);
        setError(null);

        const transcript = makeTranscriptPayload(list);

        const data = await apiFetch<{
          knowledgeCards?: KnowledgeCard[];
          predictedPaths?: PredictedPath[];
          talkingPoints?: TalkingPoint[];
          followUps?: FollowUp[];
        }>("/api/groqCopilot", {
          method: "POST",
          json: { transcript },
        });

        setKnowledgeCards(Array.isArray(data.knowledgeCards) ? data.knowledgeCards : []);
        setPredictedPaths(Array.isArray(data.predictedPaths) ? data.predictedPaths : []);
        setTalkingPoints(Array.isArray(data.talkingPoints) ? data.talkingPoints : []);
        setFollowUps(Array.isArray(data.followUps) ? data.followUps : []);

        lastUpdateAtRef.current = Date.now();
      } catch (e: any) {
        setError(e?.message || "AI update failed");
      } finally {
        setIsUpdating(false);
      }
    })();
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("SpeechRecognition not supported in this browser. Use Chrome/Edge.");
      return;
    }

    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      setInterimText(interim.trim());

      if (finalText.trim()) {
        const text = finalText.trim();
        const km = detectKeyMoment(text);

        setEntries(prev => {
          const nextEntry: TranscriptEntry = {
            id: Date.now(),
            time: nowTime(),
            speaker: "Speaker",
            text,
            isKeyMoment: km.isKeyMoment,
            keyMomentType: km.type,
          };
          const next = [...prev, nextEntry];
          triggerGroqUpdate(next);
          return next;
        });
      }
    };

    r.onerror = (ev: any) => {
      // common transient errors: "no-speech"
      if (ev?.error && ev.error !== "no-speech") {
        setError(`Mic/Recognition error: ${ev.error}`);
      }
    };

    r.onend = () => {
      // Chrome ends recognition sometimes; restart if still listening
      if (shouldRunRef.current) {
        try { r.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = r;
    try {
      r.start();
      setError(null);
    } catch (e: any) {
      setError("Could not start speech recognition.");
    }
  };

  const stopRecognition = () => {
    shouldRunRef.current = false;
    const r = recognitionRef.current;
    if (r) {
      try { r.stop(); } catch { /* ignore */ }
    }
    recognitionRef.current = null;
    setInterimText("");
  };

  // follow AppContext isListening
  useEffect(() => {
    shouldRunRef.current = isListening;

    if (isListening) {
      startRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const value = useMemo<CopilotState>(() => ({
    entries,
    interimText,
    isUpdating,
    lastUpdateSecondsAgo,
    knowledgeCards,
    predictedPaths,
    talkingPoints,
    followUps,
    error,
    clear,
  }), [entries, interimText, isUpdating, lastUpdateSecondsAgo, knowledgeCards, predictedPaths, talkingPoints, followUps, error]);

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

