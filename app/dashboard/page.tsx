import { createSupabaseServer } from "@/lib/supabase-server";
import { AnalyticsSummary } from "@/components/dashboard/AnalyticsSummary";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, username, stripe_account_id, plan")
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
