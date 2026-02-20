const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function keys(): string[] {
  return (process.env.GROQ_API_KEYS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function rotate<T>(arr: T[], start: number) {
  return arr.slice(start).concat(arr.slice(0, start));
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractJsonObject(text: string): any | null {
  // Models sometimes return extra text. Try to extract the first JSON object.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const slice = text.slice(first, last + 1);
  return safeJsonParse(slice);
}

function clamp01to100(n: any, fallback = 50) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function toStringArray(v: any, max = 12): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .slice(0, max);
  }
  if (typeof v === "string") {
    const s = v.trim();
    return s ? [s] : [];
  }
  return [];
}

function normalizeResponse(input: any) {
  const obj = input && typeof input === "object" ? input : {};

  const knowledgeCards = Array.isArray(obj.knowledgeCards) ? obj.knowledgeCards : [];
  const predictedPaths = Array.isArray(obj.predictedPaths) ? obj.predictedPaths : [];
  const talkingPoints = Array.isArray(obj.talkingPoints) ? obj.talkingPoints : [];
  const followUps = Array.isArray(obj.followUps) ? obj.followUps : [];

  return {
    knowledgeCards: knowledgeCards.slice(0, 8).map((c: any, idx: number) => ({
      id: String(c?.id || `card-${idx}`),
      emoji: String(c?.emoji || "💡"),
      title: String(c?.title || ""),
      content: toStringArray(c?.content, 10),
      tags: toStringArray(c?.tags, 10),
      sources: toStringArray(c?.sources, 6),
      confidence: clamp01to100(c?.confidence, 70),
    })),
    predictedPaths: predictedPaths.slice(0, 8).map((p: any, idx: number) => ({
      text: String(p?.text || ""),
      probability: clamp01to100(p?.probability, 60),
      why: String(p?.why || p?.reason || ""),
    })),
    talkingPoints: talkingPoints.slice(0, 8).map((t: any, idx: number) => {
      const toneRaw = String(t?.tone || "neutral").toLowerCase();
      const tone = (toneRaw === "curious" || toneRaw === "confident" || toneRaw === "neutral") ? toneRaw : "neutral";
      return {
        text: String(t?.text || ""),
        tone,
      };
    }),
    followUps: followUps.slice(0, 10).map((f: any, idx: number) => ({
      text: String(f?.text || ""),
    })),
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = typeof req.body === "string" ? safeJsonParse(req.body) : req.body;
    const transcript = (body?.transcript || "").toString().trim();

    if (!transcript) {
      return res.json({ knowledgeCards: [], predictedPaths: [], talkingPoints: [], followUps: [] });
    }

    const allKeys = keys();
    if (!allKeys.length) return res.status(500).json({ error: "Missing GROQ_API_KEYS" });

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const system = `
Return STRICT JSON only (no markdown, no prose).
Schema:
{
 "knowledgeCards":[{"id":"topic|happening|glossary|background|tradeoffs","emoji":"", "title":"", "content":[...], "tags":[...], "sources":[...], "confidence": 0-100}],
 "predictedPaths":[{"text":"", "probability":0-100, "why":""}],
 "talkingPoints":[{"text":"", "tone":"curious|confident|neutral"}],
 "followUps":[{"text":""}]
}
Rules:
- Keep content concise and immediately usable.
- If unsure, lower confidence.
- "content", "tags", "sources" MUST be ARRAYS of strings.
`;

    const userPrompt = `Transcript:\n${transcript}\n\nGenerate live context + next likely paths + what the user can say next.`;

    const start = Math.floor(Math.random() * allKeys.length);
    const tryKeys = rotate(allKeys, start);

    let lastErr: any = null;

    for (const key of tryKeys) {
      try {
        const r = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 800,
            messages: [
              { role: "system", content: system.trim() },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        const raw = await r.text();
        if (!r.ok) {
          if (r.status === 429 || r.status >= 500) {
            lastErr = { status: r.status, raw };
            continue; // rotate
          }
          return res.status(r.status).json({ error: raw || "Groq error" });
        }

        const data = safeJsonParse(raw);
        const content = data?.choices?.[0]?.message?.content || "";
        const json = safeJsonParse(content) || extractJsonObject(String(content));

        if (!json) {
          return res.json({
            knowledgeCards: [{
              id: "topic",
              emoji: "📌",
              title: "Current Topic",
              content: [String(content).slice(0, 300)],
              tags: [],
              sources: [],
              confidence: 50
            }],
            predictedPaths: [],
            talkingPoints: [],
            followUps: [],
          });
        }

        return res.json(normalizeResponse(json));
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }

    return res.status(429).json({ error: "All Groq keys failed or rate-limited", detail: String(lastErr?.message || lastErr) });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

