import { useState } from "react";
import { TrendingUp, MessageCircle, Copy, Check, Loader, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useCopilot } from "@/contexts/CopilotContext";

const TONE_STYLES: Record<string, { bg: string; label: string }> = {
  neutral: { bg: "bg-muted text-muted-foreground", label: "Neutral" },
  confident: { bg: "bg-primary/10 text-primary", label: "Confident" },
  curious: { bg: "bg-accent text-accent-foreground", label: "Curious" },
};

export function PredictionsPanel() {
  const { isListening } = useApp();
  const { predictedPaths, talkingPoints, followUps, isUpdating } = useCopilot();

  const [showFollowUps, setShowFollowUps] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const loading = isListening && isUpdating && predictedPaths.length === 0 && talkingPoints.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <h2 className="text-[13px] font-semibold text-foreground">Next 5 Minutes</h2>
        {isListening && (loading || isUpdating) && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader className="w-3 h-3 animate-spin" /> {loading ? "Analyzing…" : "Updating…"}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {!isListening && predictedPaths.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <TrendingUp className="w-6 h-6 mb-2 opacity-30" />
            <p className="text-[13px] font-medium">Predictions appear here</p>
            <p className="text-xs mt-0.5 opacity-70">Start listening to see what's next</p>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 shimmer rounded-lg" />
            ))}
          </div>
        )}

        {/* Predicted paths */}
        {!loading && predictedPaths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">Predicted Paths</span>
            </div>

            <div className="space-y-1">
              {predictedPaths.map((p, i) => (
                <div
                  key={`${p.text}-${i}`}
                  className="flex items-start gap-2 text-xs animate-fade-in rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className={`shrink-0 text-[10px] font-mono font-medium mt-0.5 w-8 text-right ${
                    p.probability >= 70 ? "text-primary" : p.probability >= 50 ? "text-muted-foreground" : "text-muted-foreground/60"
                  }`}>
                    {p.probability}%
                  </span>
                  <div className="min-w-0">
                    <span className="text-foreground/90 leading-relaxed">{p.text}</span>
                    {p.why && <span className="block text-[10px] text-muted-foreground mt-0.5">{p.why}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested talking points */}
        {!loading && talkingPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">Talking Points</span>
            </div>

            <div className="space-y-1.5">
              {talkingPoints.map((s, idx) => {
                const tone = TONE_STYLES[s.tone] || TONE_STYLES.neutral;
                const id = `tp-${idx}`;
                return (
                  <div key={id} className="rounded-md border border-border bg-card p-2.5 animate-fade-in group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground leading-relaxed flex-1 italic">{s.text}</p>
                      <button
                        className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(id, s.text)}
                      >
                        {copiedId === id ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1.5 ${tone.bg}`}>
                      {tone.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-ups */}
        {isListening && (predictedPaths.length > 0 || talkingPoints.length > 0) && (
          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 h-7"
              onClick={() => setShowFollowUps(!showFollowUps)}
            >
              <HelpCircle className="w-3 h-3" />
              {showFollowUps ? "Hide" : "Ask"} follow-up questions
            </Button>

            {showFollowUps && (
              <div className="mt-2 space-y-1">
                {(followUps.length ? followUps : [{ text: "Can you clarify the key decision we need to make?" }]).map((f, i) => {
                  const id = `fu-${i}`;
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-2 text-xs p-2 rounded-md border border-border bg-muted/30 group animate-fade-in"
                    >
                      <span className="text-foreground/80">{f.text}</span>
                      <button
                        className="shrink-0 p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(id, f.text)}
                      >
                        {copiedId === id ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

