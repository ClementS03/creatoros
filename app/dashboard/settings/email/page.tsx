"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Creator } from "@/types";

export default function EmailSettingsPage() {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState<{ type: string; name: string; value: string }[] | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storefront").then(r => r.json()).then(setCreator);
  }, []);

  async function handleConfigure() {
    setConfiguring(true);
    setError(null);
    const res = await fetch("/api/settings/send-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    const data = await res.json() as { records?: { type: string; name: string; value: string }[]; error?: string };
    if (res.ok && data.records) {
      setRecords(data.records);
    } else {
      setError(data.error ?? "Failed to configure domain");
    }
    setConfiguring(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    const res = await fetch("/api/settings/send-domain/verify", { method: "POST" });
    const data = await res.json() as { verified?: boolean; status?: string };
    if (data.verified) {
      const updated = await fetch("/api/storefront").then(r => r.json());
      setCreator(updated);
    } else {
      setError(`DNS not verified yet (status: ${data.status ?? "pending"}). Wait a few minutes and try again.`);
    }
    setVerifying(false);
  }

  async function handleRemove() {
    await fetch("/api/settings/send-domain", { method: "DELETE" });
    setRecords(null);
    setDomain("");
    const updated = await fetch("/api/storefront").then(r => r.json());
    setCreator(updated);
  }

  if (!creator) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Email settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure how your emails are sent to subscribers.</p>
      </div>

      <div className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Sending identity</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">From name:</span> {creator.full_name ?? "Creator"}</p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">From address:</span>
            {creator.send_domain_verified && creator.custom_send_domain ? creator.custom_send_domain : "hello@creatoroshq.com"}
            {creator.send_domain_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Custom sending domain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send emails from your own domain (e.g. <code>hello@yoursite.com</code>).
          </p>
        </div>

        {creator.send_domain_verified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 size={14} />
              <span>{creator.custom_send_domain} is verified and active.</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemove}>Remove custom domain</Button>
          </div>
        ) : records ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add these DNS records to your domain, then click Verify.</p>
            <div className="space-y-2">
              {records.map((r, i) => (
                <div key={i} className="rounded-lg border p-3 text-xs font-mono space-y-1 bg-muted/20">
                  <div><span className="text-muted-foreground">Type:</span> {r.type}</div>
                  <div><span className="text-muted-foreground">Name:</span> {r.name}</div>
                  <div className="break-all"><span className="text-muted-foreground">Value:</span> {r.value}</div>
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleVerify} disabled={verifying}>
                {verifying ? <><Loader2 size={14} className="animate-spin mr-2" />Checking…</> : "Verify DNS"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemove}>Start over</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Your domain</Label>
              <Input id="domain" value={domain} onChange={e => setDomain(e.target.value)} placeholder="yoursite.com" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="sm" onClick={handleConfigure} disabled={configuring || !domain.trim()}>
              {configuring ? <><Loader2 size={14} className="animate-spin mr-2" />Configuring…</> : "Configure"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
