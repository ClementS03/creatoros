import { createSupabaseServer } from "@/lib/supabase-server";
import { deleteFile } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

async function getOwnProduct(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  id: string,
  userId: string
) {
  const { data } = await supabase
    .from("products")
    .select("*, product_files(id, file_path, file_name, file_size, file_mime, sort_order)")
    .eq("id", id)
    .eq("creator_id", userId)
    .single();
  return data;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const product = await getOwnProduct(supabase, id, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnProduct(supabase, id, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json() as Record<string, unknown>;
  const allowedFields = [
    "name", "description", "price", "currency",
    "file_path", "file_name", "file_size", "file_mime",
    "download_limit", "is_published",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = body.files as { path: string; name: string; size: number; mime: string }[] | undefined;
  if (files !== undefined) {
    await supabase.from("product_files").delete().eq("product_id", id);
    if (files.length > 0) {
      await supabase.from("product_files").insert(
        files.map((f, i) => ({ product_id: id, file_path: f.path, file_name: f.name, file_size: f.size, file_mime: f.mime, sort_order: i }))
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnProduct(supabase, id, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (product.file_path) await deleteFile(product.file_path as string).catch(() => {});

  return new NextResponse(null, { status: 204 });
}
