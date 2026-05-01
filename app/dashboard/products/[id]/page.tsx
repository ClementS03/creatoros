import { createSupabaseServer } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/ProductForm";
import { OrderBumpsEditor } from "@/components/products/OrderBumpsEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, BookOpen } from "lucide-react";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user!.id)
    .single();

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <div className="flex gap-2">
          {(product.type as string) === "course" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/products/${id}/course`}>
                <BookOpen size={14} className="mr-1.5" />
                Edit course
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/products/${id}/landing-page`}>
              <LayoutTemplate size={14} className="mr-1.5" />
              Edit landing page
            </Link>
          </Button>
        </div>
      </div>
      <ProductForm product={product} />
      <OrderBumpsEditor productId={id} />
    </div>
  );
}
