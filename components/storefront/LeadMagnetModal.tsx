"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  productId: string;
  productName: string;
  onClose: () => void;
};

export function LeadMagnetModal({ productId, productName, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/lead-magnet/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name: name.trim(), email: email.trim() }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-base">Get for free</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center space-y-2 py-4">
            <CheckCircle2 className="mx-auto text-green-500" size={40} strokeWidth={1.5} />
            <p className="font-medium">Check your inbox!</p>
            <p className="text-sm text-muted-foreground">Your download link is on its way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lm-name">Full name</Label>
              <Input
                id="lm-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-email">Email</Label>
              <Input
                id="lm-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-2" />Sending…</>
                : "Send me the link"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll receive an email with your download link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
