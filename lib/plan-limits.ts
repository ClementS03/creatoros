import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_PRODUCT_LIMIT = 3;

export async function isProCreator(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("creators")
    .select("plan")
    .eq("id", userId)
    .single();
  if (error || !data) return false;
  return data.plan === "pro";
}

export async function canAddProduct(
  supabase: SupabaseClient,
  userId: string,
  plan?: string,
  currentCount?: number
): Promise<boolean> {
  const resolvedPlan =
    plan ??
    (
      await supabase
        .from("creators")
        .select("plan")
        .eq("id", userId)
        .single()
    ).data?.plan;

  if (resolvedPlan === "pro") return true;

  const count =
    currentCount ??
    (
      await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", userId)
        .eq("is_active", true)
    ).count ??
    0;

  return count < FREE_PRODUCT_LIMIT;
}
