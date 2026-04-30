"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import type { DiscountCode } from "@/types";

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    usage_limit: "",
    expires_at: "",
  });

  useEffect(() => {
    fetch("/api/discount-codes")
      .then(r => r.json())
      .then(data => { setCodes(data); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: form.type === "percentage"
          ? parseFloat(form.value)
          : Math.round(parseFloat(form.value) * 100),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expires_at: form.expires_at || null,
      }),
    });
    const data = await res.json() as DiscountCode & { error?: string };
    if (res.ok) {
      setCodes(prev => [data, ...prev]);
      setForm({ code: "", type: "percentage", value: "", usage_limit: "", expires_at: "" });
      setShowForm(false);
    } else {
      setError(data.error ?? "Failed to create");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/discount-codes/${id}`, { method: "DELETE" });
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  function formatDiscount(c: DiscountCode) {
    return c.type === "percentage" ? `-${c.value}%` : `-$${(c.value / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discount codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Create promo codes for your products.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} size="sm">
          <Plus size={14} className="mr-1.5" />
          New code
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border p-5 space-y-4 bg-muted/20">
          <h2 className="font-semibold text-sm">Create discount code</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-code">Code <span className="text-destructive">*</span></Label>
              <Input
                id="dc-code"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className="font-mono uppercase"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type <span className="text-destructive">*</span></Label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as "percentage" | "fixed" }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-value">
                {form.type === "percentage" ? "Discount %" : "Discount ($)"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dc-value"
                type="number"
                min="1"
                max={form.type === "percentage" ? "100" : undefined}
                step={form.type === "percentage" ? "1" : "0.01"}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "percentage" ? "20" : "5.00"}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-limit">Usage limit <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="dc-limit"
                type="number"
                min="1"
                value={form.usage_limit}
                onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="dc-expires">Expires <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input
                id="dc-expires"
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Creating…" : "Create code"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border rounded-xl">
          No discount codes yet. Create your first one.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Usage</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expires</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} className={`border-t ${!c.is_active ? "opacity-40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{c.code}</span>
                      <button onClick={() => handleCopy(c.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {copied === c.code ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{formatDiscount(c)}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_active && (
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
