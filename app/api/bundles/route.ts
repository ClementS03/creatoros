import { createSupabaseServer } from "@/lib/supabase-server";
import { canAddProduct } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "Free plan limit reached." }, { status: 403 });
  }

  const body = await request.json() as {
    name: string;
    description?: string;
    price: number;
    cover_image_url?: string | null;
    product_ids: string[];
    is_published?: boolean;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!Array.isArray(body.product_ids) || body.product_ids.length < 2) {
    return NextResponse.json({ error: "A bundle must include at least 2 products" }, { status: 400 });
  }
  if (typeof body.price !== "number" || body.price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  // Verify all products belong to this creator
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .in("id", body.product_ids)
    .eq("creator_id", user.id)
    .eq("is_active", true);

  if (!products || products.length !== body.product_ids.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
  }

  const { data: bundle, error } = await supabase
    .from("products")
    .insert({
      creator_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      price: body.price,
      currency: "usd",
      type: "digital",
      is_bundle: true,
      cover_image_url: body.cover_image_url ?? null,
      is_published: body.is_published ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("bundle_items").insert(
    body.product_ids.map((pid, i) => ({
      bundle_id: bundle.id,
      product_id: pid,
      sort_order: i,
    }))
  );

  return NextResponse.json(bundle, { status: 201 });
}
