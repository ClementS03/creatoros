import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, created_at")
    .eq("product_id", productId)
    .eq("buyer_email", user.email!)
    .order("created_at")
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No purchase found" }, { status: 403 });

  const { data: progress } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("buyer_email", user.email!);

  const { data: unlocks } = await supabaseAdmin
    .from("lesson_unlocks")
    .select("lesson_id")
    .eq("buyer_email", user.email!);

  return NextResponse.json({
    progress: progress ?? [],
    unlockedLessonIds: (unlocks ?? []).map(u => u.lesson_id as string),
    orderCreatedAt: order.created_at as string,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_email", user.email!)
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No purchase found" }, { status: 403 });

  const { lessonId, completed } = await request.json() as { lessonId: string; completed: boolean };

  await supabaseAdmin.from("lesson_progress").upsert({
    buyer_email: user.email!,
    lesson_id: lessonId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: "buyer_email,lesson_id" });

  return NextResponse.json({ ok: true });
}
