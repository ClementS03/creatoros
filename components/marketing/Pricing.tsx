import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    fee: "8% per sale",
    desc: "Try it with no commitment.",
    features: [
      "3 digital products",
      "1 course (up to 5 lessons)",
      "500 email subscribers",
      "Storefront on creatoroshq.com",
      "Stripe payouts",
      "Basic analytics",
    ],
    cta: "Start free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    fee: "0% fees — keep everything",
    desc: "For creators serious about their income.",
    features: [
      "Unlimited products",
      "Unlimited courses & lessons",
      "Unlimited email subscribers",
      "Coaching & booking",
      "Memberships + community",
      "Email automations",
      "Custom domain",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/signup",
    highlight: true,
  },
  {
    name: "FreelanceOS Bundle",
    price: "$9",
    period: "/mo",
    fee: "0% fees",
    desc: "For FreelanceOS users. Pro at half price.",
    features: [
      "Everything in Pro",
      "Auto-invoice on coaching sale",
      "CRM sync with FreelanceOS",
      "Revenue widget in FreelanceOS",
      "One bill for both tools",
    ],
    cta: "Get Bundle",
    href: "/signup?bundle=1",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">No surprises. No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 space-y-5 flex flex-col ${
                plan.highlight ? "border-primary shadow-xl ring-1 ring-primary/20" : ""
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                  ⭐ Most popular
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>
              <div>
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">{plan.fee}</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
                size="lg"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
