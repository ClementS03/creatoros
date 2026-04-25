"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  revenueUsd: string;
  totalSales: number;
  storefrontViews: number;
  conversionRate: string;
  productCount: number;
  period: string;
};

export function AnalyticsSummary() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div className="text-sm text-muted-foreground">Loading stats…</div>;
  }

  const items = [
    { label: "Revenue (30d)", value: `$${stats.revenueUsd}` },
    { label: "Sales (30d)", value: stats.totalSales },
    { label: "Storefront views", value: stats.storefrontViews },
    { label: "Conversion rate", value: `${stats.conversionRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
