import { createSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersResult, eventsResult, productCountResult] = await Promise.all([
    supabase
      .from("orders")
      .select("amount_paid, currency, created_at")
      .eq("creator_id", user.id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("analytics_events")
      .select("event, created_at")
      .eq("creator_id", user.id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .eq("is_active", true),
  ]);

  const orders = ordersResult.data ?? [];
  const events = eventsResult.data ?? [];

  const totalRevenueCents = orders.reduce((sum, o) => sum + (o.amount_paid as number), 0);
  const totalSales = orders.length;
  const storefrontViews = events.filter((e) => e.event === "storefront_view").length;
  const conversionRate = storefrontViews > 0
    ? ((totalSales / storefrontViews) * 100).toFixed(1)
    : "0.0";

  // Daily revenue chart — last 30 days
  const dailyRevenue: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyRevenue[d.toISOString().split("T")[0]] = 0;
  }
  orders.forEach((o) => {
    const day = (o.created_at as string).split("T")[0];
    if (day in dailyRevenue) dailyRevenue[day] += (o.amount_paid as number) / 100;
  });
  const chart = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

  return NextResponse.json({
    revenueUsd: (totalRevenueCents / 100).toFixed(2),
    totalSales,
    storefrontViews,
    conversionRate,
    productCount: productCountResult.count ?? 0,
    period: "last 30 days",
    chart,
  });
}
