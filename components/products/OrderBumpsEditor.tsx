"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import type { OrderBumps, OrderBumpItem } from "@/types/index";

type BumpProduct = { id: string; name: string; price: number; currency: string };

type Props = { productId: string };

export function OrderBumpsEditor({ productId }: Props) {
  const [items, setItems] = useState<OrderBumpItem[]>([]);
  const [bundlePrice, setBundlePrice] = useState<string>("");
  const [available, setAvailable] = useState<BumpProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [creating, setCreating] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/products/${productId}/bump-products`).then(r => r.json()),
    ]).then(([prod, avail]) => {
      const p = prod as { order_bumps?: OrderBumps };
      if (p.order_bumps) {
        setItems(p.order_bumps.items ?? []);
        setBundlePrice(p.order_bumps.bundle_price != null ? String(p.order_bumps.bundle_price / 100) : "");
      }
      setAvailable(avail as BumpProduct[]);
    });
  }, [productId]);

  const save = useCallback(async (newItems: OrderBumpItem[], newBundlePrice: string) => {
    setSaving(true);
    setSaved(false);
    const bp = newBundlePrice ? Math.round(parseFloat(newBundlePrice) * 100) : null;
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_bumps: newItems.length > 0 ? { items: newItems, bundle_price: bp } : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [productId]);

  function triggerSave(newItems: OrderBumpItem[], newBundlePrice: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newItems, newBundlePrice), 1000);
  }

  function addBump(product: BumpProduct) {
    if (items.length >= 5) return;
    const newItem: OrderBumpItem = {
      product_id: product.id,
      custom_price: product.price,
      label: `Add "${product.name}"`,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setShowDropdown(false);
    triggerSave(updated, bundlePrice);
  }

  function removeBump(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    triggerSave(updated, bundlePrice);
  }

  function updateItem(index: number, field: "label" | "custom_price", value: string) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      if (field === "custom_price") {
        return { ...item, custom_price: Math.round(parseFloat(value || "0") * 100) };
      }
      return { ...item, label: value };
    });
    setItems(updated);
    triggerSave(updated, bundlePrice);
  }

  function updateBundlePrice(val: string) {
    setBundlePrice(val);
    triggerSave(items, val);
  }

  async function handleCreate() {
    if (!createName.trim() || !createPrice) return;
    setCreating(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName.trim(),
        price: Math.round(parseFloat(createPrice) * 100),
        currency: "usd",
        type: "digital",
        is_published: false,
      }),
    });
    if (res.ok) {
      const newProd = await res.json() as BumpProduct;
      setAvailable(prev => [newProd, ...prev]);
      addBump(newProd);
      setShowCreateModal(false);
      setCreateName("");
      setCreatePrice("");
    }
    setCreating(false);
  }

  const usedIds = new Set(items.map(i => i.product_id));
  const addableProducts = available.filter(p => !usedIds.has(p.id));

  const bundlePriceCents = bundlePrice ? Math.round(parseFloat(bundlePrice) * 100) : null;
  const sumCents = items.reduce((s, i) => s + i.custom_price, 0);
  const savings = bundlePriceCents && sumCents > bundlePriceCents
    ? Math.round(((sumCents - bundlePriceCents) / sumCents) * 100)
    : null;

  return (
    <div className="space-y-4 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Order bumps</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Offer extra products to buyers before checkout.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saving && <span className="text-muted-foreground flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving…</span>}
          {saved && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={11} />Saved</span>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.product_id} className="flex gap-2 items-center border rounded-lg p-2.5 bg-muted/20">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={item.label}
                  onChange={e => updateItem(i, "label", e.target.value)}
                  placeholder="Sales label…"
                  className="h-7 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(item.custom_price / 100).toFixed(2)}
                    onChange={e => updateItem(i, "custom_price", e.target.value)}
                    className="h-7 text-xs w-24"
                  />
                  <span className="text-xs text-muted-foreground">per item</span>
                </div>
              </div>
              <button onClick={() => removeBump(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 1 && (
        <div className="space-y-1">
          <Label className="text-xs">Bundle price if all selected (optional)</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={bundlePrice}
              onChange={e => updateBundlePrice(e.target.value)}
              placeholder="e.g. 12.00"
              className="h-7 text-xs w-28"
            />
            {savings !== null && (
              <span className="text-xs text-green-600 font-medium">Save {savings}%</span>
            )}
          </div>
        </div>
      )}

      {items.length < 5 && (
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setShowDropdown(v => !v)}
          >
            <Plus size={13} className="mr-1.5" />
            Add bump {items.length > 0 ? `(${items.length}/5)` : ""}
          </Button>
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-background border rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {addableProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addBump(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">${(p.price / 100).toFixed(2)}</span>
                </button>
              ))}
              <button
                onClick={() => { setShowDropdown(false); setShowCreateModal(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left border-t text-primary"
              >
                <Plus size={13} />
                Create new product
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background border rounded-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">New product</h4>
              <button onClick={() => setShowCreateModal(false)}><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Bonus pack" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (USD) *</Label>
                <Input type="number" min="0" step="0.01" value={createPrice} onChange={e => setCreatePrice(e.target.value)} placeholder="9.00" className="h-8 text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">Product created as draft. Add files by editing it later.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !createName.trim() || !createPrice}>
                {creating ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                Create & add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
