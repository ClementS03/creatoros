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
  created_at: string;
};

export type ProductType = "digital";

export type Product = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: ProductType;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime: string | null;
  download_limit: number | null;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
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
