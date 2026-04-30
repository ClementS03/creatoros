import type { Block } from "@/types/blocks";
import type { Product, Creator, OrderBumps } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeroBlock } from "./blocks/HeroBlock";
import { FeaturesBlock } from "./blocks/FeaturesBlock";
import { TestimonialsBlock } from "./blocks/TestimonialsBlock";
import { FAQBlock } from "./blocks/FAQBlock";
import { TextBlock } from "./blocks/TextBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { CTABlock } from "./blocks/CTABlock";

type BumpProduct = { id: string; name: string };

type Props = {
  blocks: Block[];
  product: Pick<Product, "id" | "name" | "price" | "currency" | "cover_image_url" | "compare_at_price" | "is_lead_magnet" | "creator_id">;
  creator: Pick<Creator, "full_name" | "username">;
  storefrontUrl: string;
  orderBumps?: OrderBumps | null;
  bumpProducts?: BumpProduct[];
};

export function LandingPage({ blocks, product, creator, storefrontUrl, orderBumps, bumpProducts = [] }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link
            href={storefrontUrl}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to {creator.full_name ?? creator.username}
          </Link>
        </div>
      </div>

      {sorted.map(block => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={block.id} data={block.data} product={product} orderBumps={orderBumps} bumpProducts={bumpProducts} />;
          case "features":
            return <FeaturesBlock key={block.id} data={block.data} />;
          case "testimonials":
            return <TestimonialsBlock key={block.id} data={block.data} />;
          case "faq":
            return <FAQBlock key={block.id} data={block.data} />;
          case "text":
            return <TextBlock key={block.id} data={block.data} />;
          case "video":
            return <VideoBlock key={block.id} data={block.data} />;
          case "image":
            return <ImageBlock key={block.id} data={block.data} />;
          case "cta":
            return <CTABlock key={block.id} data={block.data} product={product} orderBumps={orderBumps} bumpProducts={bumpProducts} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
