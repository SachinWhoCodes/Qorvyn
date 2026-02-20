import { useMemo, useState } from "react";
import { Pin, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/contexts/AppContext";
import { useCopilot } from "@/contexts/CopilotContext";

export function KnowledgePanel() {
  const { isListening } = useApp();
  const { knowledgeCards, isUpdating, lastUpdateSecondsAgo, error } = useCopilot();

  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sortedCards = useMemo(() => {
    const cards = [...knowledgeCards];
    cards.sort((a, b) => (pinned[b.id] ? 1 : 0) - (pinned[a.id] ? 1 : 0));
    return cards;
  }, [knowledgeCards, pinned]);

  const togglePin = (id: string) => setPinned(p => ({ ...p, [id]: !p[id] }));
  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <h2 className="text-[13px] font-semibold text-foreground">Live Knowledge</h2>
        {isListening && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            {isUpdating ? "Updating" : lastUpdateSecondsAgo !== null ? `Updated ${lastUpdateSecondsAgo}s ago` : "Ready"}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {sortedCards.length === 0 && !isListening && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <span className="text-2xl mb-2 opacity-30">💡</span>
            <p className="text-[13px] font-medium">Context cards appear here</p>
            <p className="text-xs mt-0.5 opacity-70">Start listening to generate insights</p>
          </div>
        )}

        {error && isListening && (
          <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium text-foreground">AI update issue</div>
              <div>{error}</div>
              <div className="mt-1 opacity-75">Listening continues. It will retry on new speech.</div>
            </div>
          </div>
        )}

        {/* skeletons while updating first time */}
        {isListening && isUpdating && sortedCards.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {sortedCards.map((card) => {
          const isPinned = !!pinned[card.id];
          const isExpanded = !!expanded[card.id];
          // Defensive: protect UI from malformed LLM payloads (e.g. content as string).
          const safeContent = Array.isArray(card.content)
            ? card.content
            : typeof (card as any).content === "string"
              ? [(card as any).content]
              : [];
          const safeTags = Array.isArray(card.tags)
            ? card.tags
            : typeof (card as any).tags === "string"
              ? [(card as any).tags]
              : [];
          const safeSources = Array.isArray(card.sources)
            ? card.sources
            : typeof (card as any).sources === "string"
              ? [(card as any).sources]
              : [];

          const displayContent = isExpanded ? safeContent : safeContent.slice(0, 3);

          return (
            <div
              key={card.id}
              className={`rounded-lg border bg-card p-3 animate-fade-in transition-all duration-200 ${
                isPinned ? "border-primary/30 bg-primary/[0.02]" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{card.emoji || "📌"}</span>
                  <span className="text-xs font-semibold text-foreground">{card.title}</span>
                  {isPinned && <Pin className="w-2.5 h-2.5 text-primary fill-primary" />}
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => togglePin(card.id)} className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Pin className={`w-3 h-3 ${isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  </button>

                  {safeContent.length > 3 && (
                    <button onClick={() => toggleExpand(card.id)} className="p-0.5 rounded hover:bg-muted transition-colors">
                      {isExpanded ? <Minimize2 className="w-3 h-3 text-muted-foreground" /> : <Maximize2 className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              </div>

              {safeTags.length ? (
                <div className="flex gap-1 mb-1.5 flex-wrap">
                  {safeTags.slice(0, 8).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <ul className="space-y-0.5">
                {displayContent.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/80 leading-relaxed">{item}</li>
                ))}
                {!isExpanded && safeContent.length > 3 && (
                  <li className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary" onClick={() => toggleExpand(card.id)}>
                    +{safeContent.length - 3} more…
                  </li>
                )}
              </ul>

              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex gap-1 flex-wrap">
                  {safeSources.slice(0, 4).map(s => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {typeof card.confidence === "number" && (
                    <span className="text-[9px] text-muted-foreground">{card.confidence}% conf</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isListening && sortedCards.length > 0 && isUpdating && (
          <div className="text-[10px] text-muted-foreground text-center py-1.5 animate-pulse">
            Updating context…
          </div>
        )}
      </div>
    </div>
  );
}

