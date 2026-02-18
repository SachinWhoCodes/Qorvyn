import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Package, CheckCircle, Clock } from "lucide-react";

const PACKS = [
  { credits: 100, price: "₹199", label: "Starter" },
  { credits: 300, price: "₹499", label: "Pro", popular: true },
  { credits: 1000, price: "₹1,499", label: "Team" },
];

export default function Wallet() {
  const { user, credits, rechargeRequests, addRechargeRequest } = useApp();
  const navigate = useNavigate();

  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) { navigate("/login"); return null; }

  const pack = useMemo(() => PACKS.find(p => p.credits === selectedPack) || null, [selectedPack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!pack) { setMsg("Select a pack"); return; }
    if (!utr.trim()) { setMsg("Transaction ID (UTR) is required"); return; }

    setSubmitting(true);
    try {
      await addRechargeRequest({
        amount: pack.credits,
        credits: pack.credits,
        utr: utr.trim(),
        notes: notes.trim() || undefined,
      });
      setMsg("Recharge request submitted (Pending approval).");
      setUtr("");
      setNotes("");
      setSelectedPack(null);
    } catch (e: any) {
      setMsg(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            {credits} credits
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Packs */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Credit Packs</h2>
            </div>

            <div className="grid gap-3">
              {PACKS.map(p => (
                <button
                  key={p.credits}
                  type="button"
                  onClick={() => setSelectedPack(p.credits)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    selectedPack === p.credits ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{p.label}</p>
                      <p className="text-sm text-muted-foreground">{p.credits} credits</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{p.price}</p>
                      {p.popular && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual recharge */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-1">Manual Recharge</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pay via UPI/Bank transfer, then submit your Transaction ID (UTR). Admin will approve and credits will be added.
            </p>

            <div className="rounded-md bg-muted/30 border border-border p-3 text-xs text-muted-foreground mb-4">
              <div><span className="font-medium text-foreground">UPI ID:</span> yourupi@bank</div>
              <div><span className="font-medium text-foreground">Name:</span> Qorvyn</div>
              <div className="opacity-80 mt-1">Replace these with your real details.</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Selected Pack</Label>
                <div className="text-sm text-muted-foreground">
                  {pack ? `${pack.label} — ${pack.credits} credits (${pack.price})` : "None"}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="utr">Transaction ID (UTR)</Label>
                <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 1234567890ABC" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details for admin…" />
              </div>

              {msg && <div className="text-xs text-muted-foreground">{msg}</div>}

              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Recharge History</h2>
          </div>

          {rechargeRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recharge requests yet.</p>
          ) : (
            <div className="space-y-2">
              {rechargeRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.credits} credits</p>
                    <p className="text-xs text-muted-foreground">UTR: {r.utr}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning"
                    }`}>
                      {r.status.toUpperCase()}
                    </p>
                    {r.status === "approved" && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                        <CheckCircle className="w-3 h-3" /> Added
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

