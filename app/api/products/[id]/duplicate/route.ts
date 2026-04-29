import { createSupabaseServer } from "@/lib/supabase-server";
import { canAddProduct } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("plan")
    .eq("id", user.id)
    .single();

  const allowed = await canAddProduct(supabase, user.id, creator?.plan as string | undefined);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free plan limit reached. Upgrade to Pro for unlimited products." },
      { status: 403 }
    );
  }

  const { data: source } = await supabase
    .from("products")
    .select("*, product_files(file_path, file_name, file_size, file_mime, sort_order)")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: copy, error } = await supabase
    .from("products")
    .insert({
      creator_id: user.id,
      name: `${source.name} (Copy)`,
      description: source.description,
      price: source.price,
      compare_at_price: source.compare_at_price,
      currency: source.currency,
      type: source.type,
      cover_image_url: source.cover_image_url,
      file_path: source.file_path,
      file_name: source.file_name,
      file_size: source.file_size,
      file_mime: source.file_mime,
      download_limit: source.download_limit,
      is_published: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (source.product_files && source.product_files.length > 0) {
    await supabase.from("product_files").insert(
      source.product_files.map((f: { file_path: string; file_name: string; file_size: number | null; file_mime: string | null; sort_order: number }) => ({
        product_id: copy.id,
        file_path: f.file_path,
        file_name: f.file_name,
        file_size: f.file_size,
        file_mime: f.file_mime,
        sort_order: f.sort_order,
      }))
    );
  }

  return NextResponse.json(copy, { status: 201 });
}
