import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: bundle } = await supabase
    .from("products")
    .select("*, bundle_items(product_id, sort_order, products(id, name, cover_image_url, price))")
    .eq("id", id)
    .eq("creator_id", user.id)
    .eq("is_bundle", true)
    .single();

  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    name?: string;
    description?: string;
    price?: number;
    cover_image_url?: string | null;
    is_published?: boolean;
    product_ids?: string[];
  };

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.price !== undefined) patch.price = body.price;
  if (body.cover_image_url !== undefined) patch.cover_image_url = body.cover_image_url;
  if (body.is_published !== undefined) patch.is_published = body.is_published;

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(body.product_ids) && body.product_ids.length >= 2) {
    await supabase.from("bundle_items").delete().eq("bundle_id", id);
    await supabase.from("bundle_items").insert(
      body.product_ids.map((pid, i) => ({ bundle_id: id, product_id: pid, sort_order: i }))
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("products").update({ is_active: false }).eq("id", id).eq("creator_id", user.id);
  return new NextResponse(null, { status: 204 });
}
