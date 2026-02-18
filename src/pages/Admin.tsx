import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ReqItem = {
  id: string;
  uid: string;
  email: string;
  credits: number;
  amount: number;
  utr: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
};

export default function Admin() {
  const [items, setItems] = useState<ReqItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch<{ items: ReqItem[] }>("/api/adminListRecharges", { method: "GET" });
      setItems(r.items || []);
    } catch (e: any) {
      setError(e?.message || "Forbidden / not admin");
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    try {
      await apiFetch("/api/adminApproveRecharge", { method: "POST", json: { id } });
      await load();
    } catch (e: any) {
      alert(e?.message || "Approve failed");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Admin — Recharge Approvals</h1>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

        {!loading && !error && (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{r.credits} credits</div>
                  <div className="text-xs text-muted-foreground">UTR: {r.utr}</div>
                  <div className="text-xs text-muted-foreground">User: {r.email}</div>
                  <div className="text-xs text-muted-foreground">Status: {r.status}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="bg-primary text-primary-foreground"
                    disabled={r.status !== "pending"}
                    onClick={() => approve(r.id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">No recharge requests.</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

