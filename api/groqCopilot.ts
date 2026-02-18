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
Return STRICT JSON only (no markdown).
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
        const json = safeJsonParse(content);

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

        return res.json(json);
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

