import type { Creator, Product } from "@/types";
import { ProductCard } from "./ProductCard";
import Image from "next/image";
import { Globe } from "lucide-react";
import { getActiveSocialLinks } from "@/lib/storefront-utils";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.905-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
};

type Props = {
  creator: Pick<Creator, "id" | "full_name" | "username" | "bio" | "avatar_url" | "brand_color" | "social_links">;
  products: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type" | "cover_image_url" | "compare_at_price" | "is_lead_magnet" | "creator_id">[];
};

export function StorefrontPage({ creator, products }: Props) {
  const socialLinks = getActiveSocialLinks(creator.social_links as Parameters<typeof getActiveSocialLinks>[0] ?? {});

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          {creator.avatar_url && (
            <Image
              src={creator.avatar_url}
              alt={creator.full_name ?? creator.username}
              width={88}
              height={88}
              className="rounded-full mx-auto object-cover ring-2 ring-border"
            />
          )}
          <h1 className="text-2xl font-bold">{creator.full_name ?? creator.username}</h1>
          {creator.bio && (
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{creator.bio}</p>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              {socialLinks.map(({ platform, url }) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
                  aria-label={platform}
                >
                  {SOCIAL_ICONS[platform] ?? <Globe className="w-4 h-4" />}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} username={creator.username} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No products yet.</p>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Powered by{" "}
          <a href="https://creatoroshq.com" className="underline hover:text-foreground transition-colors">
            CreatorOS
          </a>
        </p>
      </div>
    </div>
  );
}
