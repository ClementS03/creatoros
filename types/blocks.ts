export type BlockType = "hero" | "features" | "testimonials" | "faq" | "text" | "video" | "image" | "cta";

export type HeroData = {
  headline: string;
  subheading: string;
  button_label: string;
};

export type FeaturesItem = { icon: string; title: string; description: string };
export type FeaturesData = { title: string; items: FeaturesItem[] };

export type TestimonialItem = { quote: string; author: string; avatar_url?: string; rating: number };
export type TestimonialsData = { items: TestimonialItem[] };

export type FAQItem = { question: string; answer: string };
export type FAQData = { items: FAQItem[] };

export type TextData = { title?: string; body: string };
export type VideoData = { url: string; caption?: string };
export type ImageData = { url: string; caption?: string };
export type CTAData = { headline: string; button_label: string };

export type Block =
  | { id: string; type: "hero";         order: number; data: HeroData }
  | { id: string; type: "features";     order: number; data: FeaturesData }
  | { id: string; type: "testimonials"; order: number; data: TestimonialsData }
  | { id: string; type: "faq";          order: number; data: FAQData }
  | { id: string; type: "text";         order: number; data: TextData }
  | { id: string; type: "video";        order: number; data: VideoData }
  | { id: string; type: "image";        order: number; data: ImageData }
  | { id: string; type: "cta";          order: number; data: CTAData };

export const LOCKED_BLOCKS: BlockType[] = ["hero", "cta"];
