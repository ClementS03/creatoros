import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { CourseLesson } from "@/types/index";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };

async function getOwnProduct(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, productId: string, userId: string) {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("creator_id", userId)
    .single();
  return data;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnProduct(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sections } = await supabaseAdmin
    .from("course_sections")
    .select("id, title, sort_order, course_lessons(id, title, video_url, description, drip_days, sort_order)")
    .eq("product_id", productId)
    .order("sort_order");

  const sorted = (sections ?? []).map(s => ({
    ...s,
    course_lessons: ((s.course_lessons as CourseLesson[]) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return NextResponse.json(sorted);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnProduct(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sections = await request.json() as Array<{
    id: string;
    title: string;
    sort_order: number;
    lessons: Array<{ id: string; title: string; video_url: string | null; description: string | null; drip_days: number; sort_order: number }>;
  }>;

  if (sections.length > 0) {
    await supabaseAdmin.from("course_sections").upsert(
      sections.map(s => ({ id: s.id, product_id: productId, title: s.title, sort_order: s.sort_order }))
    );
  }

  const allLessons = sections.flatMap(s =>
    (s.lessons ?? []).map(l => ({
      id: l.id,
      section_id: s.id,
      product_id: productId,
      title: l.title,
      video_url: l.video_url ?? null,
      description: l.description ?? null,
      drip_days: l.drip_days ?? 0,
      sort_order: l.sort_order,
    }))
  );

  if (allLessons.length > 0) {
    await supabaseAdmin.from("course_lessons").upsert(allLessons);
  }

  // Delete removed sections and lessons
  const sectionIds = sections.map(s => s.id);
  const lessonIds = allLessons.map(l => l.id);

  if (sectionIds.length > 0) {
    await supabaseAdmin
      .from("course_sections")
      .delete()
      .eq("product_id", productId)
      .not("id", "in", `(${sectionIds.map(id => `'${id}'`).join(",")})`);
  } else {
    await supabaseAdmin.from("course_sections").delete().eq("product_id", productId);
  }

  if (lessonIds.length > 0) {
    await supabaseAdmin
      .from("course_lessons")
      .delete()
      .eq("product_id", productId)
      .not("id", "in", `(${lessonIds.map(id => `'${id}'`).join(",")})`);
  }

  return NextResponse.json({ ok: true });
}
