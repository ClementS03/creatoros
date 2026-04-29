import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { segment?: string; product_id?: string };
  const { segment = "all", product_id } = body;

  let query = supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id)
    .is("unsubscribed_at", null);

  if (segment !== "all") query = query.eq("source", segment);
  if (product_id) query = query.eq("product_id", product_id);

  const { count } = await query;
  return NextResponse.json({ recipientCount: count ?? 0 });
}
