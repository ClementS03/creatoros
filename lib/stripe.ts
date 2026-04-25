import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const FEE_PERCENT_FREE = 0.08;

export function calculatePlatformFee(amountCents: number, isPro: boolean): number {
  if (isPro) return 0;
  return Math.round(amountCents * FEE_PERCENT_FREE);
}
