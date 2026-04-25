import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["username", "bio", "full_name", "avatar_url", "brand_color", "social_links"] as const;

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("creators").select("*").eq("id", user.id).single();
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key];
  }

  if (patch.username) {
    const username = (patch.username as string).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (username.length < 3) {
      return NextResponse.json({ error: "Username too short" }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single();
    if (existing) return NextResponse.json({ error: "Username taken" }, { status: 409 });
    patch.username = username;
  }

  const { data, error } = await supabase
    .from("creators")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
