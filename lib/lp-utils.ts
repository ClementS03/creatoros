import type { Block, BlockType } from "@/types/blocks";

export function parseVideoUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultBlocks(productName: string, price: number): Block[] {
  const fmtPrice = price === 0 ? "Free" : `$${(price / 100).toFixed(2)}`;
  return [
    {
      id: generateId(),
      type: "hero",
      order: 0,
      data: {
        headline: productName,
        subheading: "",
        button_label: price === 0 ? "Get for free" : `Buy now — ${fmtPrice}`,
      },
    },
    {
      id: generateId(),
      type: "cta",
      order: 1,
      data: {
        headline: "Ready to get started?",
        button_label: price === 0 ? "Get for free" : `Buy now — ${fmtPrice}`,
      },
    },
  ];
}

export const BLOCK_META: Record<BlockType, { label: string; emoji: string; description: string }> = {
  hero:         { label: "Hero",         emoji: "🏆", description: "Title, subheading, buy button" },
  features:     { label: "Features",     emoji: "✨", description: "List of key benefits" },
  testimonials: { label: "Testimonials", emoji: "⭐", description: "Customer quotes and ratings" },
  faq:          { label: "FAQ",          emoji: "❓", description: "Questions and answers" },
  text:         { label: "Text",         emoji: "📝", description: "Free text section" },
  video:        { label: "Video",        emoji: "🎥", description: "YouTube or Vimeo embed" },
  image:        { label: "Image",        emoji: "🖼️", description: "Full-width image" },
  cta:          { label: "CTA",          emoji: "🛒", description: "Call to action button" },
};

export function reorderBlocks(blocks: Block[], fromIndex: number, toIndex: number): Block[] {
  const result = [...blocks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result.map((b, i) => ({ ...b, order: i }));
}
