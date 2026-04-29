import { createSupabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FREE_PRODUCT_LIMIT } from "@/lib/plan-limits";
import { ProductActions } from "@/components/products/ProductActions";
import { ImageIcon } from "lucide-react";

export default async function ProductsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: creator } = await supabase
    .from("creators")
    .select("plan")
    .eq("id", user!.id)
    .single();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, currency, cover_image_url, compare_at_price, is_published, created_at")
    .eq("creator_id", user!.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const isFree = creator?.plan === "free";
  const atLimit = isFree && (products?.length ?? 0) >= FREE_PRODUCT_LIMIT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        {atLimit ? (
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/billing">
              Upgrade for unlimited products
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/products/new">Add product</Link>
          </Button>
        )}
      </div>
      {isFree && (
        <p className="text-sm text-muted-foreground">
          {products?.length ?? 0} / {FREE_PRODUCT_LIMIT} products on free plan
        </p>
      )}
      <div className="space-y-3">
        {(products ?? []).map((p) => {
          const salePrice = p.price === 0 ? "Free" : `$${(p.price / 100).toFixed(2)}`;
          const originalPrice = p.compare_at_price ? `$${(p.compare_at_price / 100).toFixed(2)}` : null;
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                {p.cover_image_url ? (
                  <Image
                    src={p.cover_image_url}
                    alt={p.name}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ImageIcon size={20} className="text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium">{salePrice}</span>
                  {originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">{originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={p.is_published ? "default" : "secondary"}>
                  {p.is_published ? "Published" : "Draft"}
                </Badge>
                <ProductActions productId={p.id} />
              </div>
            </div>
          );
        })}
        {products?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No products yet. Add your first one!
          </p>
        )}
      </div>
    </div>
  );
}
