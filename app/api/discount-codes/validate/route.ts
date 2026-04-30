import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { code, creatorId } = await request.json() as { code: string; creatorId: string };

  if (!code?.trim() || !creatorId) {
    return NextResponse.json({ error: "Missing code or creatorId" }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("discount_codes")
    .select("id, code, type, value, usage_limit, used_count, expires_at")
    .eq("creator_id", creatorId)
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (!data) return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });

  if (data.usage_limit !== null && (data.used_count as number) >= (data.usage_limit as number)) {
    return NextResponse.json({ error: "This code has reached its usage limit" }, { status: 400 });
  }

  if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
    return NextResponse.json({ error: "This code has expired" }, { status: 400 });
  }

  return NextResponse.json({
    id: data.id,
    code: data.code,
    type: data.type,
    value: data.value,
  });
}
