import { createClient } from "@supabase/supabase-js";
import { Download, File } from "lucide-react";
import Link from "next/link";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Props = { searchParams: Promise<{ order?: string; product?: string }> };

type FileEntry = { id: string; file_name: string; file_size: number | null; sort_order: number; product_id: string; order_id: string };
type ProductGroup = { name: string; files: FileEntry[] };

export default async function DownloadPage({ searchParams }: Props) {
  const { order: orderId, product: productId } = await searchParams;

  if (!orderId || !productId) return <ErrorPage message="Invalid download link." />;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, stripe_payment_intent_id")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (!order) return <ErrorPage message="Order not found." />;

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, is_bundle, download_limit, product_files(id, file_name, file_size, sort_order), bundle_items(product_id, sort_order, products(name, product_files(id, file_name, file_size, sort_order)))")
    .eq("id", productId)
    .single();

  if (!product) return <ErrorPage message="Product not found." />;

  const isBundle = (product as unknown as { is_bundle?: boolean }).is_bundle;

  // Find sibling bump orders (same payment intent, different product)
  const bumpGroups: ProductGroup[] = [];
  if (order.stripe_payment_intent_id) {
    const { data: siblingOrders } = await supabaseAdmin
      .from("orders")
      .select("id, product_id")
      .eq("stripe_payment_intent_id", order.stripe_payment_intent_id as string)
      .neq("id", orderId);

    if (siblingOrders && siblingOrders.length > 0) {
      const bumpProductIds = siblingOrders.map(o => o.product_id as string);
      const { data: bumpProducts } = await supabaseAdmin
        .from("products")
        .select("id, name, product_files(id, file_name, file_size, sort_order)")
        .in("id", bumpProductIds);

      if (bumpProducts) {
        for (const bp of bumpProducts) {
          const siblingOrder = siblingOrders.find(o => o.product_id === bp.id);
          if (!siblingOrder) continue;
          const files = ((bp as unknown as { product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] }).product_files ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(f => ({ ...f, product_id: bp.id as string, order_id: siblingOrder.id as string }));
          if (files.length > 0) {
            bumpGroups.push({ name: bp.name as string, files });
          }
        }
      }
    }
  }

  // Build main product groups
  const mainGroups: ProductGroup[] = [];

  if (isBundle) {
    const bundleItems = (product as unknown as {
      bundle_items?: {
        product_id: string;
        sort_order: number;
        products: { name: string; product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] };
      }[]
    }).bundle_items ?? [];

    bundleItems
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach(item => {
        const files = (item.products.product_files ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(f => ({ ...f, product_id: item.product_id, order_id: orderId }));
        if (files.length > 0) {
          mainGroups.push({ name: item.products.name, files });
        }
      });
  } else {
    const files = ((product as unknown as { product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] }).product_files ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => ({ ...f, product_id: productId, order_id: orderId }));
    if (files.length > 0) {
      mainGroups.push({ name: product.name as string, files });
    }
  }

  const allGroups = [...mainGroups, ...bumpGroups];
  const showGroupHeaders = allGroups.length > 1;
  const totalFiles = allGroups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold">
            {showGroupHeaders ? "Your files are ready" : "Your file is ready"}
          </h1>
          <p className="text-muted-foreground text-sm">{product.name as string}</p>
          {showGroupHeaders && (
            <p className="text-xs text-muted-foreground">{allGroups.length} products · {totalFiles} files</p>
          )}
        </div>

        <div className="space-y-3">
          {allGroups.map(group => (
            <div key={group.name} className="rounded-xl border overflow-hidden">
              {showGroupHeaders && (
                <div className="px-4 py-2.5 bg-muted/40 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.name}</p>
                </div>
              )}
              <div className="divide-y">
                {group.files.map(f => (
                  <a
                    key={f.id}
                    href={`/api/products/${f.product_id}/download?order=${f.order_id}&file=${f.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <File size={18} className="text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{f.file_name}</span>
                    {f.file_size && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(f.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                    <Download size={16} className="text-primary shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Save these files — this link may expire.
        </p>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">{message}</p>
        <Link href="/" className="text-sm text-primary underline">Back to home</Link>
      </div>
    </div>
  );
}
