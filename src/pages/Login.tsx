import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    const ok = await login(email, password);
    
    // after firebase sign-in succeeds:
const token = await user.getIdToken();

try {
  const r = await fetch("/api/ensureUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: user.displayName || "", email: user.email || "" }),
  });

  const data = await r.json();
  if (!r.ok) {
    console.warn("ensureUser failed:", data);
    // show toast: "Logged in, but wallet sync failed"
  }
} catch (e) {
  console.warn("ensureUser network error:", e);
}

    
    if (!ok) {
      setError("Invalid email or password");
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">Q</span>
            </div>
            <span className="font-bold text-xl text-foreground">Qorvyn</span>
          </Link>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground">
              Sign in
            </Button>

            <div className="text-center text-sm space-y-2">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

