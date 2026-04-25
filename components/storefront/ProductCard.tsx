import type { Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  product: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type">;
};

export function ProductCard({ product }: Props) {
  const price =
    product.price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: product.currency,
        }).format(product.price / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.description && (
          <p className="text-muted-foreground text-sm">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{price}</span>
        </div>
      </CardContent>
    </Card>
  );
}
