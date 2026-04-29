import { createSupabaseServer } from "@/lib/supabase-server";
import { getSignedUploadUrl, validateUpload } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { mime: string; size: number; filename: string };
  const { mime, size, filename } = body;

  const validation = validateUpload(mime, size);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const rawExt = filename.split(".").pop() ?? "bin";
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "bin";
  const path = `${user.id}/${randomUUID()}.${ext}`;
  const signedUrl = await getSignedUploadUrl(path);

  return NextResponse.json({ signedUrl, path });
}
