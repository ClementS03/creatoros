import { createSupabaseServer } from "@/lib/supabase-server";
import { AnalyticsSummary } from "@/components/dashboard/AnalyticsSummary";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, username, stripe_account_enabled, plan")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back,{" "}
          {creator?.full_name?.split(" ")[0] ?? "creator"}
        </h1>
        <p className="text-muted-foreground">
          Your storefront:{" "}
          <a
            href={`https://${creator?.username}.creatoroshq.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {creator?.username}.creatoroshq.com
          </a>
        </p>
      </div>

      {!creator?.stripe_account_enabled && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            Connect Stripe to start selling
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 mt-1">
            You need to connect a Stripe account to accept payments.
          </p>
          <form action="/api/stripe/connect" method="POST" className="mt-2">
            <Button type="submit" size="sm">
              Connect Stripe
            </Button>
          </form>
        </div>
      )}

      <AnalyticsSummary />

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard/products/new">Add product</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/storefront">Customize storefront</Link>
        </Button>
      </div>
    </div>
  );
}
