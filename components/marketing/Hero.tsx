import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36 text-center">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
          0% transaction fees on Pro — keep every dollar you earn
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Your storefront.
          <br />
          <span className="text-primary">Your income.</span>
          <br />
          Your rules.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Sell digital products, courses, coaching and memberships from one link.
          No coding. No per-sale cut on Pro. Start in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/signup">
              Start for free <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card required · Free plan available · Setup in 5 minutes
        </p>

        {/* Storefront preview mockup */}
        <div className="mt-12 relative mx-auto max-w-2xl rounded-2xl border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground mx-auto font-mono">
              yourname.creatoroshq.com
            </span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20" />
              <div className="space-y-1">
                <div className="h-3 w-28 rounded bg-foreground/20" />
                <div className="h-2 w-40 rounded bg-muted-foreground/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border p-3 space-y-2">
                  <div className="h-16 rounded-lg bg-muted" />
                  <div className="h-2 w-3/4 rounded bg-foreground/20" />
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
                  <div className="h-7 rounded-lg bg-primary/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
