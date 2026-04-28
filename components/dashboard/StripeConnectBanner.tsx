"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeConnectBanner() {
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleConnect() {
    setConnecting(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } else {
      setConnecting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-sm">
      <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="flex-1 text-amber-800 dark:text-amber-300">
        <strong>Stripe not connected</strong> — You can&apos;t receive payments yet.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 h-7 text-xs shrink-0"
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? "Redirecting…" : "Connect Stripe →"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
