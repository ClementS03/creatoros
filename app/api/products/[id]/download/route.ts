import { createClient } from "@supabase/supabase-js";
import { getSignedDownloadUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const orderId = request.nextUrl.searchParams.get("order");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, download_count, product_id")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("file_path, file_name, download_limit")
    .eq("id", productId)
    .single();

  if (!product?.file_path) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  if (
    product.download_limit !== null &&
    (order.download_count as number) >= (product.download_limit as number)
  ) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 403 }
    );
  }

  await supabaseAdmin
    .from("orders")
    .update({ download_count: (order.download_count as number) + 1 })
    .eq("id", orderId);

  const signedUrl = await getSignedDownloadUrl(product.file_path as string, 3600);

  return NextResponse.redirect(signedUrl);
}
