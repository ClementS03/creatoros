import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };
type Body = { buyerEmail: string; lessonIds: string[] | "all" };

async function getCreatorLessonIds(productId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("course_lessons")
    .select("id")
    .eq("product_id", productId);
  return (data ?? []).map(l => l.id as string);
}

async function verifyCreator(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, productId: string, userId: string) {
  const { data } = await supabase.from("products").select("id").eq("id", productId).eq("creator_id", userId).single();
  return data;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await verifyCreator(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { buyerEmail, lessonIds } = await request.json() as Body;
  const ids = lessonIds === "all" ? await getCreatorLessonIds(productId) : lessonIds;

  if (ids.length > 0) {
    await supabaseAdmin.from("lesson_unlocks").upsert(
      ids.map(lessonId => ({ buyer_email: buyerEmail, lesson_id: lessonId, creator_id: user.id })),
      { onConflict: "buyer_email,lesson_id" }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await verifyCreator(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { buyerEmail, lessonIds } = await request.json() as Body;
  const ids = lessonIds === "all" ? await getCreatorLessonIds(productId) : lessonIds;

  if (ids.length > 0) {
    await supabaseAdmin
      .from("lesson_unlocks")
      .delete()
      .eq("buyer_email", buyerEmail)
      .in("lesson_id", ids);
  }

  return NextResponse.json({ ok: true });
}
