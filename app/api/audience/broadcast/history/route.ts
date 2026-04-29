import { createSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("broadcasts")
    .select("id, subject, segment, product_id, recipient_count, sent_at")
    .eq("creator_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data ?? []);
}
