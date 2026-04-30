"use client";
import { useState } from "react";
import type { Product } from "@/types";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { LeadMagnetModal } from "./LeadMagnetModal";
import Image from "next/image";
import Link from "next/link";
import { calcDiscount, formatPrice } from "@/lib/storefront-utils";

type Props = {
  product: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type" | "cover_image_url" | "compare_at_price" | "is_lead_magnet" | "creator_id">;
  username: string;
};

export function ProductCard({ product, username }: Props) {
  const [showModal, setShowModal] = useState(false);
  const price = formatPrice(product.price, product.currency);
  const comparePrice = product.compare_at_price
    ? formatPrice(product.compare_at_price, product.currency)
    : null;
  const discount = calcDiscount(product.price, product.compare_at_price);

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex">
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

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/${username}/${product.id}`} className="font-semibold text-base leading-snug truncate hover:underline">
              {product.name}
            </Link>
            {product.is_lead_magnet ? (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Free
              </span>
            ) : discount !== null ? (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                -{discount}%
              </span>
            ) : null}
          </div>

          {product.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {product.is_lead_magnet ? (
                <span className="font-bold text-base text-green-600 dark:text-green-400">Free</span>
              ) : (
                <>
                  <span className="font-bold text-base">{price}</span>
                  {comparePrice && (
                    <span className="text-sm text-muted-foreground line-through">{comparePrice}</span>
                  )}
                </>
              )}
            </div>
            {product.is_lead_magnet ? (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Get for free
              </button>
            ) : (
              <CheckoutButton productId={product.id} price={product.price} creatorId={product.creator_id} />
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <LeadMagnetModal
          productId={product.id}
          productName={product.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
