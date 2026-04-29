import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  let paymentIntentId: string | null = null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 404 });
  }

  if (!paymentIntentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, buyer_email")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, product_files(id, file_name, sort_order)")
    .eq("id", order.product_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const productFiles = (product as unknown as { product_files?: { id: string; file_name: string; sort_order: number }[] })?.product_files ?? [];

  const downloadUrl = productFiles.length > 1
    ? `${appUrl}/download?order=${order.id}&product=${order.product_id}`
    : productFiles.length === 1
      ? `${appUrl}/api/products/${order.product_id}/download?order=${order.id}&file=${productFiles[0].id}`
      : `${appUrl}/api/products/${order.product_id}/download?order=${order.id}`;

  return NextResponse.json({
    orderId: order.id,
    productName: product?.name ?? "",
    downloadUrl,
    fileCount: productFiles.length,
  });
}
