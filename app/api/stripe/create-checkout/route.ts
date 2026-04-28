import { stripe, calculatePlatformFee } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json() as { productId: string; buyerEmail?: string };
  const { productId, buyerEmail } = body;

  const supabase = await createSupabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, currency, creator_id, is_published, is_active")
    .eq("id", productId)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, plan")
    .eq("id", product.creator_id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json(
      { error: "Creator payments not set up" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const fee = calculatePlatformFee(
    product.price as number,
    creator.plan === "pro"
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: product.currency as string,
          product_data: { name: product.name as string },
          unit_amount: product.price as number,
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
      },
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: appUrl,
    metadata: {
      productId: product.id as string,
      creatorId: product.creator_id as string,
    },
  });

  return NextResponse.json({ url: session.url });
}
