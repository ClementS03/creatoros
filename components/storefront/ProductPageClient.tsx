"use client";
import { useState } from "react";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { LeadMagnetModal } from "./LeadMagnetModal";
import { OrderBumpsSelector } from "./OrderBumpsSelector";
import { Button } from "@/components/ui/button";
import type { OrderBumps } from "@/types/index";

type BumpProduct = { id: string; name: string };

type Props = {
  productId: string;
  price: number;
  creatorId: string;
  isLeadMagnet: boolean;
  productName: string;
  orderBumps?: OrderBumps | null;
  bumpProducts?: BumpProduct[];
};

export function ProductPageClient({
  productId, price, creatorId, isLeadMagnet, productName,
  orderBumps, bumpProducts = [],
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedBumpIds, setSelectedBumpIds] = useState<string[]>([]);
  const [bumpExtraAmount, setBumpExtraAmount] = useState(0);

  function handleBumpsChange(ids: string[], extra: number) {
    setSelectedBumpIds(ids);
    setBumpExtraAmount(extra);
  }

  if (isLeadMagnet) {
    return (
      <>
        <Button className="w-full" size="lg" onClick={() => setShowModal(true)}>
          Get for free
        </Button>
        {showModal && (
          <LeadMagnetModal
            productId={productId}
            productName={productName}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {orderBumps && orderBumps.items.length > 0 && (
        <OrderBumpsSelector
          orderBumps={orderBumps}
          bumpProducts={bumpProducts}
          mainPrice={price}
          onSelectionChange={handleBumpsChange}
        />
      )}
      <CheckoutButton
        productId={productId}
        price={price}
        creatorId={creatorId}
        bumpProductIds={selectedBumpIds}
        bumpExtraAmount={bumpExtraAmount}
      />
    </div>
  );
}
