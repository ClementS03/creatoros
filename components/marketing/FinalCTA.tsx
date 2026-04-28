import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-4 text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Ready to monetize
          <br />
          your audience?
        </h2>
        <p className="text-xl text-muted-foreground">
          Join creators who stopped giving away 10% of every sale.
          Set up your storefront today — it&apos;s free to start.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/signup">
              Start for free <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8">
            <Link href="#pricing">View pricing</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card · Free plan forever · Setup in 5 minutes
        </p>
      </div>
    </section>
  );
}
