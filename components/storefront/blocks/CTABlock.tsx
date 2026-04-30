import type { CTAData } from "@/types/blocks";
import type { Product } from "@/types";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";

type Props = {
  data: CTAData;
  product: Pick<Product, "id" | "price" | "is_lead_magnet" | "creator_id" | "name">;
};

export function CTABlock({ data, product }: Props) {
  return (
    <section className="py-12 px-4 border-t bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="max-w-md mx-auto text-center space-y-4">
        {data.headline && <h2 className="text-2xl font-bold">{data.headline}</h2>}
        <ProductPageClient
          productId={product.id}
          price={product.price}
          creatorId={product.creator_id}
          isLeadMagnet={product.is_lead_magnet}
          productName={product.name}
        />
      </div>
    </section>
  );
}
