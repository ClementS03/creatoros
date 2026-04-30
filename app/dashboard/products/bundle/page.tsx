"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, X, ArrowLeft, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";

type PageData = { products: Product[]; isFree: boolean; atLimit: boolean; freeLimit: number };

export default function NewBundlePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products/page-data")
      .then(r => r.json())
      .then((d: PageData) => {
        setProducts(d.products.filter(p => !p.is_bundle && !p.is_lead_magnet && p.is_active));
      });
  }, []);

  function toggleProduct(p: Product) {
    setSelected(prev =>
      prev.find(s => s.id === p.id)
        ? prev.filter(s => s.id !== p.id)
        : [...prev, p]
    );
  }

  const totalValue = selected.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = parseFloat(price || "0") * 100;
  const savings = totalValue > 0 && bundlePrice > 0
    ? Math.round(((totalValue - bundlePrice) / totalValue) * 100)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length < 2) { setError("Select at least 2 products"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price: Math.round(parseFloat(price || "0") * 100),
        product_ids: selected.map(p => p.id),
        is_published: false,
      }),
    });
    if (res.ok) {
      router.push("/dashboard/products");
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to create bundle");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/products"><ArrowLeft size={14} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create bundle</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sell multiple products together at a discount.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="b-name">Bundle name <span className="text-destructive">*</span></Label>
          <Input id="b-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ultimate Creator Pack" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="b-desc">Description</Label>
          <textarea
            id="b-desc"
            className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Everything you need to get started…"
          />
        </div>

        {/* Product selection */}
        <div className="space-y-3">
          <Label>Include products <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(min. 2)</span></Label>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20">
              {selected.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-background border rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground text-xs">${(p.price / 100).toFixed(2)}</span>
                  <button type="button" onClick={() => toggleProduct(p)} className="text-muted-foreground hover:text-foreground ml-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border divide-y max-h-60 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No paid products yet.</p>
            ) : products.map(p => {
              const isSelected = selected.some(s => s.id === p.id);
              return (
                <label key={p.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProduct(p)}
                    className="rounded"
                  />
                  <div className="w-8 h-8 rounded overflow-hidden border bg-muted shrink-0 flex items-center justify-center">
                    {p.cover_image_url
                      ? <Image src={p.cover_image_url} alt={p.name} width={32} height={32} className="object-cover w-full h-full" />
                      : <ImageIcon size={14} className="text-muted-foreground" />}
                  </div>
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-sm text-muted-foreground">${(p.price / 100).toFixed(2)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b-price">Bundle price (USD) <span className="text-destructive">*</span></Label>
            <Input
              id="b-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Pricing summary */}
          {selected.length >= 2 && totalValue > 0 && (
            <div className="rounded-lg border p-4 bg-muted/20 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Individual value ({selected.length} products)</span>
                <span>${(totalValue / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Bundle price</span>
                <span>${(bundlePrice / 100).toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-green-600 font-medium">Customer saves</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {savings}% off
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || selected.length < 2}>
            {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Creating…</> : <>
              <Package size={14} className="mr-2" />Create bundle (draft)
            </>}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
