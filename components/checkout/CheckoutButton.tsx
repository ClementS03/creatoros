"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { productId: string; price: number };

export function CheckoutButton({ productId, price }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const { url } = await res.json() as { url: string };
    window.location.href = url;
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? "Loading…" : price === 0 ? "Get for free" : "Buy now"}
    </Button>
  );
}
