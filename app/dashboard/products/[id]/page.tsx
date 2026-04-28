import { createSupabaseServer } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/ProductForm";
import { notFound } from "next/navigation";

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
      <h1 className="text-2xl font-bold">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
