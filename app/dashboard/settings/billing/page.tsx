import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: creator } = await supabase
    .from("creators")
    .select("plan, stripe_subscription_id, stripe_account_id")
    .eq("id", user!.id)
    .single();

  let stripeStatus: { connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; accountId: string | null } = {
    connected: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    accountId: null,
  };

  if (creator?.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(creator.stripe_account_id);
      stripeStatus = {
        connected: true,
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
        accountId: creator.stripe_account_id,
      };
    } catch {
      stripeStatus = { connected: false, chargesEnabled: false, payoutsEnabled: false, accountId: null };
    }
  }

  return (
    <BillingClient
      plan={creator?.plan ?? "free"}
      hasSubscription={!!creator?.stripe_subscription_id}
      stripeStatus={stripeStatus}
    />
  );
}
