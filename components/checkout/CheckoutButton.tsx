"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, CheckCircle2, Loader2 } from "lucide-react";

type Props = { productId: string; price: number; creatorId: string };

type DiscountResult = { id: string; code: string; type: "percentage" | "fixed"; value: number };

export function CheckoutButton({ productId, price, creatorId }: Props) {
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const discountedPrice = discount
    ? discount.type === "percentage"
      ? Math.round(price * (1 - discount.value / 100))
      : Math.max(0, price - discount.value)
    : price;

  async function handleValidateCode() {
    if (!codeInput.trim()) return;
    setValidating(true);
    setCodeError(null);
    const res = await fetch("/api/discount-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeInput.trim(), creatorId }),
    });
    const data = await res.json() as DiscountResult & { error?: string };
    if (res.ok) {
      setDiscount(data);
    } else {
      setCodeError(data.error ?? "Invalid code");
    }
    setValidating(false);
  }

  function removeDiscount() {
    setDiscount(null);
    setCodeInput("");
    setCodeError(null);
    setShowCode(false);
  }

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, discountCodeId: discount?.id }),
    });
    if (!res.ok) { setLoading(false); return; }
    const { url } = await res.json() as { url: string };
    window.location.href = url;
  }

  return (
    <div className="space-y-2">
      {/* Price display */}
      <div className="flex items-center gap-2 justify-end">
        {discount && (
          <span className="text-sm text-muted-foreground line-through">
            ${(price / 100).toFixed(2)}
          </span>
        )}
        <Button onClick={handleCheckout} disabled={loading} size="sm">
          {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
          {loading
            ? "Loading…"
            : discountedPrice === 0
              ? "Get for free"
              : `Buy — $${(discountedPrice / 100).toFixed(2)}`}
        </Button>
      </div>

      {/* Discount code */}
      {discount ? (
        <div className="flex items-center gap-1.5 justify-end text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 size={12} />
          <span>{discount.code} applied ({discount.type === "percentage" ? `-${discount.value}%` : `-$${(discount.value / 100).toFixed(2)}`})</span>
          <button onClick={removeDiscount} className="text-muted-foreground hover:text-foreground ml-1">
            <X size={11} />
          </button>
        </div>
      ) : showCode ? (
        <div className="flex items-center gap-1.5 justify-end">
          <Input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleValidateCode()}
            placeholder="PROMO CODE"
            className="h-7 text-xs w-32 font-mono uppercase"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleValidateCode} disabled={validating || !codeInput.trim()}>
            {validating ? <Loader2 size={11} className="animate-spin" /> : "Apply"}
          </Button>
          <button onClick={() => setShowCode(false)} className="text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
          {codeError && <span className="text-xs text-destructive">{codeError}</span>}
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setShowCode(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Tag size={11} />
            Have a promo code?
          </button>
        </div>
      )}
    </div>
  );
}
