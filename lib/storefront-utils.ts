export type SocialLinks = {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
};

export type ActiveLink = { platform: keyof SocialLinks; url: string };

export function getActiveSocialLinks(links: SocialLinks): ActiveLink[] {
  return (Object.entries(links) as [keyof SocialLinks, string | undefined][])
    .filter((entry): entry is [keyof SocialLinks, string] => !!entry[1])
    .map(([platform, url]) => ({ platform, url }));
}

export function calcDiscount(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price / 100);
}
