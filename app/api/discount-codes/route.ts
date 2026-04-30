import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    usage_limit?: number | null;
    expires_at?: string | null;
  };

  const code = body.code?.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code || code.length < 3) return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
  if (!["percentage", "fixed"].includes(body.type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (!body.value || body.value <= 0) return NextResponse.json({ error: "Value must be positive" }, { status: 400 });
  if (body.type === "percentage" && body.value > 100) return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });

  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      creator_id: user.id,
      code,
      type: body.type,
      value: Math.round(body.value),
      usage_limit: body.usage_limit ?? null,
      expires_at: body.expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
