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

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("creator_id", user.id)
    .single();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, buyer_email, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const { count: totalLessons } = await supabaseAdmin
    .from("course_lessons")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const buyerEmails = [...new Set((orders ?? []).map(o => o.buyer_email as string))];

  const { data: progress } = await supabaseAdmin
    .from("lesson_progress")
    .select("buyer_email, lesson_id")
    .in("buyer_email", buyerEmails)
    .eq("completed", true);

  const { data: unlocks } = await supabaseAdmin
    .from("lesson_unlocks")
    .select("buyer_email, lesson_id")
    .in("buyer_email", buyerEmails);

  const progressByEmail = new Map<string, number>();
  (progress ?? []).forEach(p => {
    const key = p.buyer_email as string;
    progressByEmail.set(key, (progressByEmail.get(key) ?? 0) + 1);
  });

  const unlocksByEmail = new Map<string, string[]>();
  (unlocks ?? []).forEach(u => {
    const key = u.buyer_email as string;
    if (!unlocksByEmail.has(key)) unlocksByEmail.set(key, []);
    unlocksByEmail.get(key)!.push(u.lesson_id as string);
  });

  const students = buyerEmails.map(email => ({
    email,
    orderId: (orders ?? []).find(o => o.buyer_email === email)?.id,
    orderCreatedAt: (orders ?? []).find(o => o.buyer_email === email)?.created_at,
    completedLessons: progressByEmail.get(email) ?? 0,
    totalLessons: totalLessons ?? 0,
    unlockedLessonIds: unlocksByEmail.get(email) ?? [],
  }));

  return NextResponse.json(students);
}
