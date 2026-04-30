import { stripe, calculatePlatformFee } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { calculateBumpTotal } from "@/lib/order-bump-utils";
import type { OrderBumps } from "@/types/index";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    productId: string;
    buyerEmail?: string;
    discountCodeId?: string;
    bumpProductIds?: string[];
  };
  const { productId, buyerEmail, discountCodeId, bumpProductIds = [] } = body;

  const supabase = await createSupabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, currency, creator_id, is_published, is_active, order_bumps")
    .eq("id", productId)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, plan, username")
    .eq("id", product.creator_id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ error: "Creator payments not set up" }, { status: 400 });
  }

  // Apply discount code
  let finalPrice = product.price as number;
  let appliedDiscountId: string | null = null;

  if (discountCodeId) {
    const { data: dc } = await supabaseAdmin
      .from("discount_codes")
      .select("id, type, value, usage_limit, used_count, expires_at, is_active")
      .eq("id", discountCodeId)
      .eq("creator_id", product.creator_id)
      .eq("is_active", true)
      .single();

    if (
      dc &&
      (dc.usage_limit === null || (dc.used_count as number) < (dc.usage_limit as number)) &&
      (!dc.expires_at || new Date(dc.expires_at as string) >= new Date())
    ) {
      if (dc.type === "percentage") {
        finalPrice = Math.round(finalPrice * (1 - (dc.value as number) / 100));
      } else {
        finalPrice = Math.max(0, finalPrice - (dc.value as number));
      }
      appliedDiscountId = dc.id as string;
    }
  }

  // Apply bump total
  const orderBumps = product.order_bumps as OrderBumps | null;
  const bumpTotal = orderBumps && bumpProductIds.length > 0
    ? calculateBumpTotal(orderBumps, bumpProductIds)
    : 0;

  finalPrice = finalPrice + bumpTotal;
  if (finalPrice < 50) finalPrice = 50;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const fee = calculatePlatformFee(finalPrice, creator.plan === "pro");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: product.currency as string,
          product_data: { name: product.name as string },
          unit_amount: finalPrice,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: fee,
      transfer_data: { destination: creator.stripe_account_id as string },
      metadata: {
        productId: product.id as string,
        creatorId: product.creator_id as string,
        discountCodeId: appliedDiscountId ?? "",
        bumpProductIds: bumpProductIds.length > 0 ? JSON.stringify(bumpProductIds) : "",
      },
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: creator.username
      ? `${new URL(appUrl).protocol}//${creator.username}.${new URL(appUrl).hostname}`
      : appUrl,
    metadata: {
      productId: product.id as string,
      creatorId: product.creator_id as string,
      discountCodeId: appliedDiscountId ?? "",
      bumpProductIds: bumpProductIds.length > 0 ? JSON.stringify(bumpProductIds) : "",
    },
  });

  return NextResponse.json({ url: session.url });
}
