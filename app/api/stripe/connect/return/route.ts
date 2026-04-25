import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (creator?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(
      creator.stripe_account_id as string
    );
    const enabled = account.charges_enabled && account.payouts_enabled;
    await supabase
      .from("creators")
      .update({ stripe_account_enabled: enabled })
      .eq("id", user.id);
  }

  return NextResponse.redirect(new URL("/dashboard/settings", request.url));
}
