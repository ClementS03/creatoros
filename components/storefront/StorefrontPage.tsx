import type { Creator, Product } from "@/types";
import { ProductCard } from "./ProductCard";
import Image from "next/image";

type Props = {
  creator: Pick<Creator, "full_name" | "username" | "bio" | "avatar_url" | "brand_color" | "social_links">;
  products: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type">[];
};

export function StorefrontPage({ creator, products }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          {creator.avatar_url && (
            <Image
              src={creator.avatar_url}
              alt={creator.full_name ?? creator.username}
              width={80}
              height={80}
              className="rounded-full mx-auto"
            />
          )}
          <h1 className="text-2xl font-bold">{creator.full_name ?? creator.username}</h1>
          {creator.bio && <p className="text-muted-foreground">{creator.bio}</p>}
        </div>
        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No products yet.</p>
        )}
        <p className="text-center text-xs text-muted-foreground">Powered by CreatorOS</p>
      </div>
    </div>
  );
}
