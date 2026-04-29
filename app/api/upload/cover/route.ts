import { createSupabaseServer } from "@/lib/supabase-server";
import { getCoverUploadUrl, validateCoverUpload } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { mime: string; size: number; filename: string };
  const { mime, size, filename } = body;

  const validation = validateCoverUpload(mime, size);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const ext = filename.split(".").pop() ?? "jpg";
  const path = `covers/${user.id}/${randomUUID()}.${ext}`;
  const signedUrl = await getCoverUploadUrl(path);

  return NextResponse.json({ signedUrl, path });
}
