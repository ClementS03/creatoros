"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type OrderInfo = {
  orderId: string;
  productName: string;
  downloadUrl: string;
  fileCount: number;
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/orders/by-session?session_id=${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: OrderInfo | null) => { setOrder(data); setLoading(false); });
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">
        <CheckCircle2 className="mx-auto text-green-500" size={52} strokeWidth={1.5} />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Purchase complete!</h1>
          {order && (
            <p className="text-muted-foreground text-sm">{order.productName}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 size={15} className="animate-spin" />
            Preparing your download…
          </div>
        ) : order ? (
          <div className="space-y-3">
            <Button asChild className="w-full gap-2">
              <a href={order.downloadUrl} download>
                <Download size={15} />
                {order.fileCount > 1 ? `Download ${order.fileCount} files` : "Download now"}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              A copy of this link has been sent to your email.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Check your email for your download link.
          </p>
        )}

        <Button asChild variant="ghost" size="sm">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
