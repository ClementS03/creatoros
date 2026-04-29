import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  return new NextResponse(null, { status: 204 });
}
