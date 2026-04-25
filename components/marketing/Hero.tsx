import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 text-center">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Zero transaction fees on paid plans
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Everything you need
          <br />
          to monetize your audience
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          Sell digital products, courses, coaching, and memberships — all from
          one beautiful storefront. $19/mo. No hidden fees.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Start free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#features">See features</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No credit card required · Free plan available
        </p>
      </div>
    </section>
  );
}
