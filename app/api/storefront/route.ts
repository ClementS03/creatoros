import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["username", "bio", "full_name", "avatar_url", "brand_color", "social_links"] as const;

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data } = await supabase.from("creators").select("*").eq("id", user.id).single();

  // Lazy-create profile if trigger didn't fire (e.g. OAuth edge cases)
  if (!data) {
    const username = user.email?.split("@")[0].replace(/[^a-z0-9_-]/gi, "").toLowerCase() ?? "creator";
    const { data: created } = await supabase
      .from("creators")
      .insert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name, avatar_url: user.user_metadata?.avatar_url, username })
      .select()
      .single();
    data = created;
  }

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
    const username = (patch.username as string).toLowerCase().replace(/[^a-z0-9_-]/g, "").replace(/^[-_]+|[-_]+$/g, "");
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
