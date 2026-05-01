import { requireBuyer } from "@/lib/buyer-auth";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Download, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OrderRow = {
  id: string;
  product_id: string;
  amount_paid: number;
  currency: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    cover_image_url: string | null;
    type: string;
  } | null;
};

export default async function PortalPage() {
  const user = await requireBuyer();

  // Query by buyer_user_id first (set at purchase), fall back to buyer_email
  const { data: ordersByUserId } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, amount_paid, currency, created_at, products(id, name, cover_image_url, type)")
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: ordersByEmail } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, amount_paid, currency, created_at, products(id, name, cover_image_url, type)")
    .eq("buyer_email", user.email!)
    .is("buyer_user_id", null)
    .order("created_at", { ascending: false });

  // Merge both result sets, deduplicate by order id
  const allOrders = [...(ordersByUserId ?? []), ...(ordersByEmail ?? [])];
  const seen = new Set<string>();
  const orders = allOrders.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  const rows = orders.map(o => ({
    ...o,
    products: Array.isArray(o.products) ? o.products[0] ?? null : o.products,
  })) as OrderRow[];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My purchases</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <form action="/api/portal/auth/logout" method="POST">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut size={14} className="mr-1.5" />
              Sign out
            </Button>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No purchases found for this email.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rows.map(order => {
              const product = order.products;
              if (!product) return null;
              const isCourse = product.type === "course";
              const href = isCourse
                ? `/course/${product.id}`
                : `/download?order=${order.id}&product=${product.id}`;

              return (
                <Link key={order.id} href={href} className="group block">
                  <div className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted relative">
                      {product.cover_image_url ? (
                        <Image
                          src={product.cover_image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl">
                          {isCourse ? "🎓" : "📄"}
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-semibold text-sm leading-tight truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                        {isCourse ? (
                          <><BookOpen size={11} />Access course</>
                        ) : (
                          <><Download size={11} />Download</>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
