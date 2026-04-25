import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_customer_id, email, plan")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const { action } = (await request.json()) as { action: "subscribe" | "portal" };

  if (action === "subscribe") {
    let customerId = creator?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: creator?.email as string,
      });
      customerId = customer.id;
      await supabase
        .from("creators")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings/billing?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/settings/billing`,
    });
    return NextResponse.json({ url: session.url });
  }

  if (action === "portal") {
    if (!creator?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: creator.stripe_customer_id as string,
      return_url: `${appUrl}/dashboard/settings/billing`,
    });
    return NextResponse.json({ url: portal.url });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
