import { createSupabaseServer } from "@/lib/supabase-server";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: creator } = await supabase
    .from("creators")
    .select("plan, stripe_subscription_id")
    .eq("id", user!.id)
    .single();

  return (
    <BillingClient
      plan={creator?.plan ?? "free"}
      hasSubscription={!!creator?.stripe_subscription_id}
    />
  );
}
