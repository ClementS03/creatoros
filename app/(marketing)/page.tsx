import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { FreelanceBundle } from "@/components/marketing/FreelanceBundle";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";

export const metadata: Metadata = {
  title: "CreatorOS — Sell digital products. 0% fees.",
  description:
    "Sell digital products from one beautiful storefront. Secure delivery, Stripe payouts, analytics. $19/mo, zero transaction fees.",
  openGraph: {
    title: "CreatorOS — Monetize your audience. Keep everything you earn.",
    description: "Sell digital products from one link. $19/mo, 0% fees.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <FreelanceBundle />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
