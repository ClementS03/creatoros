"use client";
import { useState } from "react";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { LeadMagnetModal } from "./LeadMagnetModal";
import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  price: number;
  creatorId: string;
  isLeadMagnet: boolean;
  productName: string;
};

export function ProductPageClient({ productId, price, creatorId, isLeadMagnet, productName }: Props) {
  const [showModal, setShowModal] = useState(false);

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
      <CheckoutButton productId={productId} price={price} creatorId={creatorId} />
    </div>
  );
}
