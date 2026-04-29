import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segment   = request.nextUrl.searchParams.get("segment") ?? "all";
  const productId = request.nextUrl.searchParams.get("product_id");
  const search    = request.nextUrl.searchParams.get("search") ?? "";
  const exportCsv = request.nextUrl.searchParams.get("export") === "csv";

  let query = supabase
    .from("subscribers")
    .select("id, email, name, source, product_id, subscribed_at, unsubscribed_at, products(name)")
    .eq("creator_id", user.id)
    .order("subscribed_at", { ascending: false });

  if (segment !== "all") query = query.eq("source", segment);
  if (productId) query = query.eq("product_id", productId);
  if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);

  const { data: subscribers } = await query;
  const list = subscribers ?? [];

  if (exportCsv) {
    const rows = [
      ["Name", "Email", "Source", "Product", "Subscribed at", "Status"],
      ...list.map(s => [
        s.name ?? "",
        s.email,
        s.source,
        (s.products as unknown as { name?: string } | null)?.name ?? "",
        new Date(s.subscribed_at as string).toISOString().split("T")[0],
        s.unsubscribed_at ? "unsubscribed" : "active",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers.csv"`,
      },
    });
  }

  return NextResponse.json(list);
}
