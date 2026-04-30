import type { HeroData } from "@/types/blocks";
import type { Product } from "@/types";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";
import Image from "next/image";

type Props = {
  data: HeroData;
  product: Pick<Product, "id" | "price" | "currency" | "cover_image_url" | "compare_at_price" | "is_lead_magnet" | "creator_id" | "name">;
};

export function HeroBlock({ data, product }: Props) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
        {product.cover_image_url && (
          <div className="w-full max-w-md rounded-2xl overflow-hidden border bg-muted aspect-square">
            <Image
              src={product.cover_image_url}
              alt={data.headline}
              width={500}
              height={500}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold leading-tight">{data.headline}</h1>
        {data.subheading && (
          <p className="text-lg text-muted-foreground max-w-xl">{data.subheading}</p>
        )}
        <div className="w-full max-w-sm">
          <ProductPageClient
            productId={product.id}
            price={product.price}
            creatorId={product.creator_id}
            isLeadMagnet={product.is_lead_magnet}
            productName={product.name}
          />
        </div>
      </div>
    </section>
  );
}
