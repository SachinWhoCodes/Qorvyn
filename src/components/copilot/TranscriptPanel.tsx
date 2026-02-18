import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Bookmark, Copy, Search, ChevronDown, ChevronUp, MessageSquare, Star, AlertTriangle, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp } from "@/contexts/AppContext";
import { useCopilot } from "@/contexts/CopilotContext";

const SPEAKER_COLORS: Record<string, string> = {
  Speaker: "bg-primary/15 text-primary border-primary/20",
};

const KEY_MOMENT_ICONS = {
  decision: Star,
  number: Hash,
  risk: AlertTriangle,
} as const;

export function TranscriptPanel() {
  const { isListening } = useApp();
  const { entries, interimText } = useCopilot();

  const [localEntries, setLocalEntries] = useState(entries);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // keep localEntries in sync, but preserve bookmark toggles
  useEffect(() => {
    setLocalEntries((prev) => {
      const prevMap = new Map(prev.map(e => [e.id, e]));
      return entries.map(e => ({ ...e, bookmarked: prevMap.get(e.id)?.bookmarked || false }));
    });
  }, [entries]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localEntries, interimText, autoScroll]);

  const toggleBookmark = (id: number) => {
    setLocalEntries(prev => prev.map(e => e.id === id ? { ...e, bookmarked: !e.bookmarked } : e));
  };

  const copyText = (text: string) => navigator.clipboard.writeText(text);

  const speakers = useMemo(() => [...new Set(localEntries.map(e => e.speaker))], [localEntries]);

  const keyMoments = useMemo(() => localEntries.filter(e => e.isKeyMoment), [localEntries]);

  const filteredEntries = useMemo(() => {
    return localEntries.filter(e => {
      if (speakerFilter && e.speaker !== speakerFilter) return false;
      if (searchQuery && !e.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [localEntries, speakerFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">Live Transcript</h2>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setSearchOpen(!searchOpen)}>
                  <Search className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Search <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-[10px]">/</kbd>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              className={`text-[10px] h-5 px-1.5 ${autoScroll ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              <span className="ml-0.5">Auto</span>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transcript..."
              className="w-full h-7 pl-7 pr-2 text-xs rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
        )}

        {/* Speaker filters */}
        {speakers.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setSpeakerFilter(null)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                !speakerFilter ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              All
            </button>
            {speakers.map(s => (
              <button
                key={s}
                onClick={() => setSpeakerFilter(speakerFilter === s ? null : s)}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                  speakerFilter === s ? (SPEAKER_COLORS[s] || "bg-muted text-muted-foreground border-border") : "text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Key moments strip */}
      {keyMoments.length > 0 && (
        <div className="px-4 py-1.5 border-b border-border bg-muted/30 flex gap-1.5 overflow-x-auto">
          {keyMoments.slice(-5).map(km => {
            const Icon = KEY_MOMENT_ICONS[(km.keyMomentType || "decision") as any];
            return (
              <span key={km.id} className="shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground border border-border">
                <Icon className="w-2.5 h-2.5" />
                {km.text.slice(0, 30)}…
              </span>
            );
          })}
        </div>
      )}

      {/* Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        {localEntries.length === 0 && !isListening && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Clock className="w-6 h-6 mb-2 opacity-30" />
            <p className="text-[13px] font-medium">Press Start to begin</p>
            <p className="text-xs mt-0.5 opacity-70">Transcript will stream here in real time</p>
          </div>
        )}

        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className={`group rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40 ${
              entry.bookmarked ? "bg-accent/30 border-l-2 border-primary" : ""
            } ${entry.isKeyMoment ? "bg-accent/20" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-mono">{entry.time}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${SPEAKER_COLORS[entry.speaker] || "bg-muted text-muted-foreground border-border"}`}>
                  {entry.speaker}
                </span>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleBookmark(entry.id)} className="p-0.5 rounded hover:bg-muted">
                  <Bookmark className={`w-3 h-3 ${entry.bookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
                <button onClick={() => copyText(entry.text)} className="p-0.5 rounded hover:bg-muted">
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
                <button className="p-0.5 rounded hover:bg-muted">
                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed mt-0.5">{entry.text}</p>
          </div>
        ))}

        {/* interim line */}
        {isListening && interimText && (
          <div className="rounded-md px-2 py-1.5 bg-muted/30 border border-border">
            <p className="text-[13px] text-foreground/70 leading-relaxed italic">{interimText}</p>
          </div>
        )}

        {isListening && (
          <div className="flex items-center gap-1 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "typing-dot 1.4s infinite 0s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "typing-dot 1.4s infinite 0.2s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "typing-dot 1.4s infinite 0.4s" }} />
          </div>
        )}
      </div>
    </div>
  );
}

