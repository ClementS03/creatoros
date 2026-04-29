"use client";
import type { Product } from "@/types";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import Image from "next/image";
import { calcDiscount, formatPrice } from "@/lib/storefront-utils";

type Props = {
  product: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type" | "cover_image_url" | "compare_at_price">;
};

export function ProductCard({ product }: Props) {
  const price = formatPrice(product.price, product.currency);
  const comparePrice = product.compare_at_price
    ? formatPrice(product.compare_at_price, product.currency)
    : null;
  const discount = calcDiscount(product.price, product.compare_at_price);

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover image */}
      {product.cover_image_url && (
        <div className="relative w-full h-48 bg-muted">
          <Image
            src={product.cover_image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-base leading-snug">{product.name}</h3>
          {discount !== null && (
            <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              -{discount}%
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg">{price}</span>
            {comparePrice && (
              <span className="text-sm text-muted-foreground line-through">{comparePrice}</span>
            )}
          </div>
          <CheckoutButton productId={product.id} price={product.price} />
        </div>
      </div>
    </div>
  );
}
