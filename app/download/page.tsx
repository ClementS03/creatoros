import { createClient } from "@supabase/supabase-js";
import { Download, File } from "lucide-react";
import Link from "next/link";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Props = { searchParams: Promise<{ order?: string; product?: string }> };

export default async function DownloadPage({ searchParams }: Props) {
  const { order: orderId, product: productId } = await searchParams;

  if (!orderId || !productId) {
    return <ErrorPage message="Invalid download link." />;
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, download_count")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (!order) return <ErrorPage message="Order not found." />;

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, download_limit, product_files(id, file_name, file_size, sort_order)")
    .eq("id", productId)
    .single();

  if (!product) return <ErrorPage message="Product not found." />;

  if (
    product.download_limit !== null &&
    (order.download_count as number) >= (product.download_limit as number)
  ) {
    return <ErrorPage message="Download limit reached." />;
  }

  const files = ((product as unknown as { product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] }).product_files ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold">Your files are ready</h1>
          <p className="text-muted-foreground text-sm">{product.name as string}</p>
        </div>

        <div className="rounded-xl border divide-y">
          {files.map(f => (
            <a
              key={f.id}
              href={`/api/products/${productId}/download?order=${orderId}&file=${f.id}`}
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
