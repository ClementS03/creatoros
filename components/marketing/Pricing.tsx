import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    fee: "8% per sale",
    features: [
      "3 digital products",
      "1 online course (5 lessons)",
      "500 email subscribers",
      "Storefront + subdomain",
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
    fee: "0% fees",
    features: [
      "Unlimited products",
      "Unlimited courses",
      "Unlimited email subscribers",
      "Custom domain",
      "Email automations",
      "Booking & coaching",
      "Memberships + community",
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
    features: [
      "Everything in Pro",
      "FreelanceOS integration",
      "Auto-invoice on coaching sale",
      "CRM sync",
      "Revenue widget in FreelanceOS",
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
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          No surprises. Cancel anytime.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 space-y-4 ${
                plan.highlight ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Most popular
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.fee}</p>
              </div>
              <ul className="space-y-2">
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
