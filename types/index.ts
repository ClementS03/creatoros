import type { Block } from "./blocks";

export type Plan = "free" | "pro";

export type Creator = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string;
  bio: string | null;
  brand_color: string;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  stripe_account_enabled: boolean;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  freelanceos_user_id: string | null;
  resend_domain_id: string | null;
  custom_send_domain: string | null;
  send_domain_verified: boolean;
  created_at: string;
};

export type Subscriber = {
  id: string;
  creator_id: string;
  email: string;
  name: string | null;
  source: "lead_magnet" | "purchase" | "newsletter";
  product_id: string | null;
  unsubscribe_token: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export type BundleItem = {
  id: string;
  bundle_id: string;
  product_id: string;
  sort_order: number;
};

export type DiscountCode = {
  id: string;
  creator_id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type Broadcast = {
  id: string;
  creator_id: string;
  subject: string;
  body: string;
  segment: "all" | "lead_magnet" | "purchase" | "newsletter" | null;
  product_id: string | null;
  recipient_count: number;
  sent_at: string;
};

export type ProductType = "digital" | "course";

export type ProductFile = {
  id: string;
  product_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_mime: string | null;
  sort_order: number;
  created_at: string;
};

export type WelcomeEmail = {
  subject: string;
  body: string;
};

export type OrderBumpItem = {
  product_id: string;
  custom_price: number;
  label: string;
};

export type OrderBumps = {
  items: OrderBumpItem[];
  bundle_price: number | null;
};

export type Product = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: ProductType;
  cover_image_url: string | null;
  compare_at_price: number | null;
  is_lead_magnet: boolean;
  is_bundle: boolean;
  welcome_email: WelcomeEmail | null;
  lp_blocks: Block[] | null;
  order_bumps: OrderBumps | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime: string | null;
  download_limit: number | null;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  product_files?: ProductFile[];
};

export type CourseSection = {
  id: string;
  product_id: string;
  title: string;
  sort_order: number;
  lessons?: CourseLesson[];
};

export type CourseLesson = {
  id: string;
  section_id: string;
  product_id: string;
  title: string;
  video_url: string | null;
  description: string | null;
  drip_days: number;
  sort_order: number;
};

export type LessonProgress = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

export type Order = {
  id: string;
  product_id: string;
  creator_id: string;
  buyer_email: string;
  amount_paid: number;
  currency: string;
  platform_fee: number;
  stripe_payment_intent_id: string;
  download_count: number;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  creator_id: string;
  event: "storefront_view" | "product_view" | "checkout_started" | "purchase";
  product_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
