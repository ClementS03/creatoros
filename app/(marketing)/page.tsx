import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { Comparison } from "@/components/marketing/Comparison";
import { FreelanceBundle } from "@/components/marketing/FreelanceBundle";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";

export const metadata: Metadata = {
  title: "CreatorOS — Sell digital products, courses & coaching. 0% fees.",
  description:
    "One storefront to sell digital products, courses, coaching sessions, and memberships. $19/mo, zero transaction fees. No Gumroad, no Stan, no Linktree needed.",
  openGraph: {
    title: "CreatorOS — Monetize your audience. Keep everything you earn.",
    description: "Sell digital products, courses, coaching and memberships from one link. $19/mo, 0% fees.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <Comparison />
      <FreelanceBundle />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
