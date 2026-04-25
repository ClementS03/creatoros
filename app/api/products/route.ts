import { createSupabaseServer } from "@/lib/supabase-server";
import { canAddProduct } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("plan")
    .eq("id", user.id)
    .single();

  const allowed = await canAddProduct(supabase, user.id, creator?.plan as string | undefined);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free plan limit reached. Upgrade to Pro for unlimited products." },
      { status: 403 }
    );
  }

  const body = await request.json() as Record<string, unknown>;
  const allowedFields = [
    "name", "description", "price", "currency", "type",
    "file_path", "file_name", "file_size", "file_mime",
    "download_limit", "is_published",
  ];
  const insert: Record<string, unknown> = { creator_id: user.id };
  for (const key of allowedFields) {
    if (key in body) insert[key] = body[key];
  }

  if (!insert.name || typeof insert.name !== "string" || insert.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("products").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
