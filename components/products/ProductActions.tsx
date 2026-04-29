"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setDuplicating(true);
    setError(null);
    const res = await fetch(`/api/products/${productId}/duplicate`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to duplicate");
    }
    setDuplicating(false);
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDuplicate}
        disabled={duplicating}
        title="Duplicate"
      >
        {duplicating ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/products/${productId}`}>
          <Pencil size={14} className="mr-1" />
          Edit
        </Link>
      </Button>
    </div>
  );
}
