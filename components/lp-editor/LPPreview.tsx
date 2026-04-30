"use client";
import type { Block, FeaturesItem, TestimonialItem, FAQItem } from "@/types/blocks";
import { parseVideoUrl } from "@/lib/lp-utils";

type PreviewProduct = {
  cover_image_url: string | null;
  price: number;
  is_lead_magnet: boolean;
};

type Props = { blocks: Block[]; product: PreviewProduct };

export function LPPreview({ blocks, product }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-sm mx-auto bg-background rounded-xl border shadow-sm overflow-hidden text-sm">
      {sorted.map(block => {
        switch (block.type) {
          case "hero":
            return (
              <div key={block.id} className="p-5 border-b text-center space-y-3">
                {product.cover_image_url && (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="font-bold text-base leading-tight">{block.data.headline || "Your headline"}</p>
                {block.data.subheading && <p className="text-xs text-muted-foreground">{block.data.subheading}</p>}
                <div className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md">
                  {block.data.button_label || "Buy now"}
                </div>
              </div>
            );

          case "features":
            return (
              <div key={block.id} className="p-4 border-b">
                {block.data.title && <p className="font-semibold text-xs mb-2">{block.data.title}</p>}
                <div className="space-y-1.5">
                  {(block.data.items as FeaturesItem[]).map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      {item.icon && <span className="text-sm">{item.icon}</span>}
                      <div>
                        <p className="font-medium text-xs leading-none">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "testimonials":
            return (
              <div key={block.id} className="p-4 border-b bg-muted/20 space-y-2">
                {(block.data.items as TestimonialItem[]).map((item, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 space-y-1.5 border">
                    <p className="text-xs text-amber-400">{"★".repeat(item.rating)}</p>
                    <p className="text-xs italic text-muted-foreground">"{item.quote}"</p>
                    <p className="text-xs font-medium">— {item.author}</p>
                  </div>
                ))}
              </div>
            );

          case "faq":
            return (
              <div key={block.id} className="p-4 border-b space-y-1.5">
                {(block.data.items as FAQItem[]).map((item, i) => (
                  <div key={i} className="border rounded p-2">
                    <p className="text-xs font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.answer}</p>
                  </div>
                ))}
              </div>
            );

          case "text":
            return (
              <div key={block.id} className="p-4 border-b">
                {block.data.title && <p className="font-semibold text-xs mb-1">{block.data.title}</p>}
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{block.data.body}</p>
              </div>
            );

          case "video": {
            const embed = parseVideoUrl(block.data.url);
            return (
              <div key={block.id} className="p-4 border-b">
                <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                  {embed
                    ? <span className="text-xs text-muted-foreground">▶ Video</span>
                    : <span className="text-xs text-destructive">Invalid URL</span>}
                </div>
                {block.data.caption && <p className="text-xs text-muted-foreground mt-1 text-center">{block.data.caption}</p>}
              </div>
            );
          }

          case "image":
            return (
              <div key={block.id} className="p-4 border-b">
                {block.data.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={block.data.url} alt="" className="w-full rounded-lg border object-cover max-h-32" />
                  : <div className="w-full h-16 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">Image URL required</div>}
                {block.data.caption && <p className="text-xs text-muted-foreground mt-1 text-center">{block.data.caption}</p>}
              </div>
            );

          case "cta":
            return (
              <div key={block.id} className="p-5 text-center bg-primary/5 space-y-2">
                {block.data.headline && <p className="font-semibold text-xs">{block.data.headline}</p>}
                <div className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md">
                  {block.data.button_label || "Buy now"}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
