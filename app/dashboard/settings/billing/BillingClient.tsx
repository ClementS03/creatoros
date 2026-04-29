"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type StripeStatus = {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
};

type Props = {
  plan: string;
  hasSubscription: boolean;
  stripeStatus: StripeStatus;
};

export function BillingClient({ plan, hasSubscription, stripeStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json() as { url?: string; error?: string };
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setConnectError(data.error ?? "Failed to connect Stripe");
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setConfirmDisconnect(false);
    await fetch("/api/stripe/connect", { method: "DELETE" });
    window.location.reload();
  }

  const fullyEnabled = stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your plan and payment settings.</p>
      </div>

      {/* Stripe Connect status */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Stripe Connect</h2>
          {stripeStatus.connected ? (
            fullyEnabled ? (
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle size={14} /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle size={14} /> Pending verification
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
              <XCircle size={14} /> Not connected
            </span>
          )}
        </div>

        {stripeStatus.connected ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                {stripeStatus.chargesEnabled
                  ? <CheckCircle size={13} className="text-green-500" />
                  : <XCircle size={13} className="text-destructive" />}
                Charges {stripeStatus.chargesEnabled ? "enabled" : "not yet enabled"}
              </div>
              <div className="flex items-center gap-2">
                {stripeStatus.payoutsEnabled
                  ? <CheckCircle size={13} className="text-green-500" />
                  : <XCircle size={13} className="text-destructive" />}
                Payouts {stripeStatus.payoutsEnabled ? "enabled" : "not yet enabled"}
              </div>
            </div>
            {!fullyEnabled && (
              <p className="text-xs text-muted-foreground">
                Your Stripe account is connected but not fully verified yet. Complete the onboarding in Stripe to start receiving payments.
              </p>
            )}

            {connectError && (
              <p className="text-sm text-destructive">{connectError}</p>
            )}

            {/* Disconnect / Start over confirm inline */}
            {confirmDisconnect ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-medium">
                  {fullyEnabled ? "Disconnect Stripe account?" : "Cancel Stripe setup?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fullyEnabled
                    ? "You won't be able to receive payments until you reconnect. Existing orders are not affected."
                    : "The incomplete Stripe account will be removed. You can start a new connection at any time."}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDisconnect(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting ? "Removing…" : fullyEnabled ? "Yes, disconnect" : "Yes, start over"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {!fullyEnabled && (
                  <Button size="sm" onClick={handleConnect} disabled={connecting}>
                    {connecting ? "Redirecting…" : "Complete Stripe setup"}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setConfirmDisconnect(true)} disabled={disconnecting}>
                  {fullyEnabled ? "Disconnect" : "Start over"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to start receiving payments from your customers.
            </p>
            {connectError && (
              <p className="text-sm text-destructive">{connectError}</p>
            )}
            <Button size="sm" onClick={handleConnect} disabled={connecting}>
              {connecting ? "Redirecting…" : "Connect Stripe"}
            </Button>
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Current plan</h2>
          <Badge variant={plan === "pro" ? "default" : "secondary"}>
            {plan === "pro" ? "Pro" : "Free"}
          </Badge>
        </div>
        {plan === "free" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Free plan: up to 3 products, 8% platform fee per sale.
            </p>
            <Button onClick={() => handleAction("subscribe")} disabled={loading}>
              {loading ? "Redirecting…" : "Upgrade to Pro — $19/mo"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pro plan: unlimited products, 0% platform fee.
            </p>
            {hasSubscription && (
              <Button variant="outline" onClick={() => handleAction("portal")} disabled={loading}>
                {loading ? "Loading…" : "Manage subscription"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
