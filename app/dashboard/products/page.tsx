import { createSupabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FREE_PRODUCT_LIMIT } from "@/lib/plan-limits";

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
    .select("*")
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
        {(products ?? []).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {p.price === 0 ? "Free" : `$${(p.price / 100).toFixed(2)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.is_published ? "default" : "secondary"}>
                {p.is_published ? "Published" : "Draft"}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/products/${p.id}`}>Edit</Link>
              </Button>
            </div>
          </div>
        ))}
        {products?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No products yet. Add your first one!
          </p>
        )}
      </div>
    </div>
  );
}
