import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPurchaseEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { productId, creatorId } = session.metadata ?? {};
    const buyerEmail =
      session.customer_email ?? session.customer_details?.email;

    if (!productId || !creatorId || !buyerEmail) {
      return NextResponse.json({ ok: true });
    }

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, file_path, price, currency")
      .eq("id", productId)
      .single();

    if (!product) return NextResponse.json({ ok: true });

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? "";

    const { data: order } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id: productId,
        creator_id: creatorId,
        buyer_email: buyerEmail,
        amount_paid: session.amount_total ?? (product.price as number),
        currency: product.currency as string,
        platform_fee: (session as Stripe.Checkout.Session & { application_fee_amount?: number }).application_fee_amount ?? 0,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    await supabaseAdmin.from("analytics_events").insert({
      creator_id: creatorId,
      event: "purchase",
      product_id: productId,
      metadata: { amount: session.amount_total, order_id: order?.id },
    });

    if (product.file_path && order) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/products/${productId}/download?order=${order.id}`;
      await sendPurchaseEmail({
        to: buyerEmail,
        productName: product.name as string,
        downloadUrl,
      });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const isActive = sub.status === "active";
    await supabaseAdmin
      .from("creators")
      .update({
        plan: isActive ? "pro" : "free",
        stripe_subscription_id: sub.id,
      })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabaseAdmin
      .from("creators")
      .update({ plan: "free", stripe_subscription_id: null })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ ok: true });
}
