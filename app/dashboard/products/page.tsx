"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/products/ProductActions";
import { ImageIcon } from "lucide-react";
import type { Product } from "@/types";

type Filter = "all" | "paid" | "free";
type PageData = { products: Product[]; isFree: boolean; atLimit: boolean; freeLimit: number };

export default function ProductsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/products/page-data").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const { products, isFree, atLimit, freeLimit } = data;
  const filtered = products.filter(p => {
    if (filter === "paid") return !p.is_lead_magnet;
    if (filter === "free") return p.is_lead_magnet;
    return true;
  });

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "free", label: "Free (Lead magnets)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        {atLimit ? (
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/billing">Upgrade for unlimited products</Link>
          </Button>
        ) : (
          <Button asChild><Link href="/dashboard/products/new">Add product</Link></Button>
        )}
      </div>
      {isFree && (
        <p className="text-sm text-muted-foreground">{products.length} / {freeLimit} products on free plan</p>
      )}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >{tab.label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
              {p.cover_image_url
                ? <Image src={p.cover_image_url} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                : <ImageIcon size={20} className="text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{p.name}</p>
                {p.is_lead_magnet && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">Lead magnet</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-medium">
                  {p.is_lead_magnet ? "Free" : p.price === 0 ? "Free" : `$${(p.price / 100).toFixed(2)}`}
                </span>
                {p.compare_at_price && !p.is_lead_magnet && (
                  <span className="text-xs text-muted-foreground line-through">${(p.compare_at_price / 100).toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={p.is_published ? "default" : "secondary"}>
                {p.is_published ? "Published" : "Draft"}
              </Badge>
              <ProductActions productId={p.id} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No products here yet.</p>
        )}
      </div>
    </div>
  );
}
