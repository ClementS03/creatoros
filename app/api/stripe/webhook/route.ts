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
    const { productId, creatorId, discountCodeId } = session.metadata ?? {};
    const buyerEmail =
      session.customer_email ?? session.customer_details?.email;

    if (!productId || !creatorId || !buyerEmail) {
      return NextResponse.json({ ok: true });
    }

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, file_path, price, currency, is_bundle, product_files(id, file_name, sort_order), bundle_items(product_id, products(name, file_path, product_files(id, file_name, sort_order)))")
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

    if (discountCodeId) {
      await supabaseAdmin.rpc("increment_discount_usage", { code_id: discountCodeId });
    }

    if (order) {
      await supabaseAdmin.from("subscribers").upsert({
        creator_id: creatorId,
        email: buyerEmail,
        name: (session.customer_details?.name as string | null | undefined) ?? "",
        source: "purchase",
        product_id: productId,
      }, { onConflict: "creator_id,email", ignoreDuplicates: true });
    }

    const isBundle = (product as unknown as { is_bundle?: boolean }).is_bundle;

    if (order) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

      if (isBundle) {
        // Bundle: send multi-download page covering all included products
        const downloadUrl = `${appUrl}/download?order=${order.id}&product=${productId}`;
        await sendPurchaseEmail({
          to: buyerEmail,
          productName: product.name as string,
          downloadUrl,
        });
      } else {
        const productFiles = (product as unknown as { product_files?: { id: string; sort_order: number }[] }).product_files ?? [];
        const hasFiles = productFiles.length > 0 || product.file_path;
        if (hasFiles) {
          const baseDownload = `${appUrl}/api/products/${productId}/download?order=${order.id}`;
          const downloadUrl = productFiles.length > 1
            ? `${appUrl}/download?order=${order.id}&product=${productId}`
            : productFiles.length === 1
              ? `${baseDownload}&file=${productFiles[0].id}`
              : baseDownload;
          await sendPurchaseEmail({
            to: buyerEmail,
            productName: product.name as string,
            downloadUrl,
          });
        }
      }
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
