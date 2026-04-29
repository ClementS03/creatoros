import { createClient } from "@supabase/supabase-js";
import { sendLeadMagnetEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json() as { productId: string; name: string; email: string };
  const { productId, name, email } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, creator_id, is_lead_magnet, is_published, is_active, welcome_email, product_files(id, file_name, sort_order)")
    .eq("id", productId)
    .eq("is_lead_magnet", true)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("email, full_name, send_domain_verified, custom_send_domain")
    .eq("id", product.creator_id)
    .single();

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const { data: subscriber } = await supabaseAdmin
    .from("subscribers")
    .upsert({
      creator_id: product.creator_id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      source: "lead_magnet" as const,
      product_id: productId,
    }, { onConflict: "creator_id,email" })
    .select("id, unsubscribe_token")
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const productFiles = (product as unknown as { product_files?: { id: string; sort_order: number }[] }).product_files ?? [];

  const downloadUrl = productFiles.length > 1
    ? `${appUrl}/download?order=${subscriber.id}&product=${productId}`
    : productFiles.length === 1
      ? `${appUrl}/api/products/${productId}/download?subscriber=${subscriber.id}&file=${productFiles[0].id}`
      : `${appUrl}/api/products/${productId}/download?subscriber=${subscriber.id}`;

  const fromEmail = (creator.send_domain_verified as boolean) && creator.custom_send_domain
    ? creator.custom_send_domain as string
    : "hello@creatoroshq.com";

  await sendLeadMagnetEmail({
    to: email.toLowerCase().trim(),
    name: name.trim(),
    productName: product.name as string,
    downloadUrl,
    welcomeEmail: product.welcome_email as { subject: string; body: string } | null,
    fromName: (creator.full_name as string | null) ?? "Creator",
    fromEmail,
    replyTo: creator.email as string,
    unsubscribeUrl: `${appUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`,
  });

  return NextResponse.json({ ok: true });
}
