import { AnalyticsSummary } from "@/components/dashboard/AnalyticsSummary";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Last 30 days</p>
      <AnalyticsSummary />
    </div>
  );
}
