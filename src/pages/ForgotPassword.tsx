import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError("Could not send reset email. Check the address.");
    }
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
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Email sent</h2>
              <p className="text-muted-foreground text-sm">
                Check your inbox for a reset link.
              </p>
              <Link to="/login">
                <Button className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
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
              <Button type="submit" className="w-full bg-primary text-primary-foreground">
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

