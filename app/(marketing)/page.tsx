import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";

export const metadata: Metadata = {
  title: "CreatorOS — Monetize your audience. No per-sale fees.",
  description:
    "Sell digital products, courses, coaching, and memberships from one beautiful storefront. $19/mo, zero transaction fees.",
  openGraph: {
    title: "CreatorOS",
    description: "Everything you need to monetize your audience.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
    </main>
  );
}
