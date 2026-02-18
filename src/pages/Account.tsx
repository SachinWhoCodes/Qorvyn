import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon, Shield, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Account() {
  const { user, credits, logout } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) { navigate("/login"); return null; }

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiFetch("/api/updateName", { method: "POST", json: { name } });
      setMsg("Saved!");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Account</h1>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">{credits} credits</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex gap-2 pt-2">
                <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => { logout(); navigate("/"); }}>
                  Sign out
                </Button>
              </div>
              {msg && <p className="text-xs text-muted-foreground pt-1">{msg}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground">Privacy</p>
            </div>
            <p className="text-sm text-muted-foreground">
              You control start/stop. Audio is used to generate live context and suggestions.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground">Usage</p>
            </div>
            <p className="text-sm text-muted-foreground">
              1 credit = 1 minute while listening.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

