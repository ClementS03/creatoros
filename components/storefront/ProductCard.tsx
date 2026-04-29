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
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex">
      {/* Cover image — left side, full height */}
      <div className="shrink-0 w-28 self-stretch bg-muted flex items-center justify-center overflow-hidden">
        {product.cover_image_url ? (
          <Image
            src={product.cover_image_url}
            alt={product.name}
            width={112}
            height={200}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-2xl">📄</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug truncate">{product.name}</h3>
          {discount !== null && (
            <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              -{discount}%
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base">{price}</span>
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
