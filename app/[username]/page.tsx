import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { StorefrontPage } from "@/components/storefront/StorefrontPage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, bio, avatar_url")
    .eq("username", username)
    .single();
  if (!creator) return { title: "Not found" };
  return {
    title: `${creator.full_name ?? username} | CreatorOS`,
    description: creator.bio ?? undefined,
    openGraph: {
      images: creator.avatar_url ? [creator.avatar_url] : [],
    },
  };
}

export default async function CreatorStorefront({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createSupabaseServer();

  const { data: creator } = await supabase
    .from("creators")
    .select("id, full_name, username, bio, avatar_url, brand_color, social_links")
    .eq("username", username)
    .single();

  if (!creator) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, currency, type")
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fire and forget analytics
  void supabase.from("analytics_events").insert({
    creator_id: creator.id,
    event: "storefront_view",
    metadata: {},
  });

  return <StorefrontPage creator={creator} products={products ?? []} />;
}
