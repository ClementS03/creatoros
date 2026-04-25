"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { plan: string; hasSubscription: boolean };

export function BillingClient({ plan, hasSubscription }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "subscribe" | "portal") {
    setLoading(true);
    const res = await fetch("/api/stripe/billing-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Billing</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current plan
            <Badge variant={plan === "pro" ? "default" : "secondary"}>
              {plan === "pro" ? "Pro" : "Free"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan === "free" ? (
            <>
              <p className="text-sm text-muted-foreground">
                You&apos;re on the free plan. Upgrade to Pro for unlimited
                products, 0% fees, custom domains, and email automations.
              </p>
              <Button onClick={() => handleAction("subscribe")} disabled={loading}>
                {loading ? "Redirecting…" : "Upgrade to Pro — $19/mo"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You&apos;re on Pro. Enjoy unlimited products, 0% transaction
                fees, and all features.
              </p>
              {hasSubscription && (
                <Button
                  variant="outline"
                  onClick={() => handleAction("portal")}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Manage subscription"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
