import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";

const bundleFeatures = [
  "Everything in CreatorOS Pro",
  "0% transaction fees",
  "Unlimited products, courses & members",
  "Auto-invoice when a coaching session is sold",
  "Client CRM sync — coaching clients appear in FreelanceOS",
  "Revenue widget in your FreelanceOS dashboard",
  "One bill instead of two",
];

export function FreelanceBundle() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl border-2 border-primary bg-card overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left */}
            <div className="p-8 md:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Exclusive bundle
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">
                  Already using FreelanceOS?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  FreelanceOS is our tool built for freelancers — client management, invoicing, projects,
                  time tracking, and more.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If you&apos;re a freelancer who also creates content or sells digital products,
                  the bundle is made for you. Get CreatorOS Pro for{" "}
                  <strong className="text-foreground">$9/mo instead of $19/mo</strong> — and unlock
                  deep integration between both tools.
                </p>
              </div>
              <Link
                href="https://freelanceoshq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
              >
                Discover FreelanceOS <ExternalLink size={14} />
              </Link>
            </div>

            {/* Right */}
            <div className="p-8 md:p-12 bg-primary/5 border-l space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">Bundle price</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-extrabold">$9</span>
                  <span className="text-muted-foreground">/mo</span>
                  <span className="text-sm text-muted-foreground line-through ml-1">$19</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Requires an active FreelanceOS subscription
                </p>
              </div>
              <ul className="space-y-3">
                {bundleFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/signup?bundle=1">Get the Bundle — $9/mo</Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No credit card required to start
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
