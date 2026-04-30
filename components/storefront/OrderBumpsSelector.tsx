"use client";
import { useState } from "react";
import type { OrderBumps } from "@/types/index";
import { calculateBumpTotal } from "@/lib/order-bump-utils";

type BumpProduct = { id: string; name: string };

type Props = {
  orderBumps: OrderBumps;
  bumpProducts: BumpProduct[];
  mainPrice: number;
  onSelectionChange: (selectedIds: string[], extraAmount: number) => void;
};

export function OrderBumpsSelector({ orderBumps, bumpProducts, mainPrice, onSelectionChange }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (orderBumps.items.length === 0) return null;

  function toggle(id: string) {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelectedIds(updated);
    const extra = calculateBumpTotal(orderBumps, updated);
    onSelectionChange(updated, extra);
  }

  const allSelected = selectedIds.length === orderBumps.items.length;
  const extra = calculateBumpTotal(orderBumps, selectedIds);
  const total = mainPrice + extra;
  const nameMap = new Map(bumpProducts.map(p => [p.id, p.name]));

  return (
    <div className="space-y-3 border-t pt-4 mt-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add to your order</p>
      <div className="space-y-2">
        {orderBumps.items.map(item => {
          const checked = selectedIds.includes(item.product_id);
          const productName = nameMap.get(item.product_id) ?? item.label;
          return (
            <label
              key={item.product_id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.product_id)}
                className="mt-0.5 accent-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{productName}</p>
              </div>
              <span className="text-sm font-semibold shrink-0 text-primary">
                +${(item.custom_price / 100).toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>

      {orderBumps.items.length > 1 && orderBumps.bundle_price !== null && (
        <div className={`text-xs rounded-md px-3 py-2 transition-colors ${
          allSelected
            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-muted/50 text-muted-foreground"
        }`}>
          {allSelected
            ? `🎉 Bundle deal applied! Saving $${((orderBumps.items.reduce((s, i) => s + i.custom_price, 0) - orderBumps.bundle_price!) / 100).toFixed(2)}`
            : `Select all ${orderBumps.items.length} to unlock bundle price: $${(orderBumps.bundle_price / 100).toFixed(2)}`
          }
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="text-xs text-right text-muted-foreground">
          Total: <span className="font-semibold text-foreground">${(total / 100).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
