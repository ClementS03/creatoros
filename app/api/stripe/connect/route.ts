import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure creator profile exists
    let { data: creator } = await supabase
      .from("creators")
      .select("stripe_account_id, email")
      .eq("id", user.id)
      .single();

    if (!creator) {
      const username = (user.email?.split("@")[0] ?? "creator").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
      const { data: created } = await supabase
        .from("creators")
        .insert({ id: user.id, email: user.email, username })
        .select("stripe_account_id, email")
        .single();
      creator = created;
    }

    let accountId = creator?.stripe_account_id as string | null ?? null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: creator?.email ?? user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabase
        .from("creators")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/stripe/connect`,
      return_url: `${appUrl}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe connect error:", err);
    return NextResponse.json({ error: "Failed to create Stripe Connect link" }, { status: 500 });
  }
}
