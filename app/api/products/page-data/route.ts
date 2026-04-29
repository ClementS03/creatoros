import { createSupabaseServer } from "@/lib/supabase-server";
import { FREE_PRODUCT_LIMIT } from "@/lib/plan-limits";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: creator }, { data: products }] = await Promise.all([
    supabase.from("creators").select("plan").eq("id", user.id).single(),
    supabase
      .from("products")
      .select("id, name, description, price, currency, cover_image_url, compare_at_price, is_published, is_lead_magnet, created_at")
      .eq("creator_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const isFree = creator?.plan === "free";
  const atLimit = isFree && (products?.length ?? 0) >= FREE_PRODUCT_LIMIT;

  return NextResponse.json({
    products: products ?? [],
    isFree,
    atLimit,
    freeLimit: FREE_PRODUCT_LIMIT,
  });
}
