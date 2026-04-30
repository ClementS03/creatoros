import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("products")
    .select("id, name, price, currency")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .neq("id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
