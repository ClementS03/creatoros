import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";
import { LandingPage } from "@/components/storefront/LandingPage";
import { calcDiscount, formatPrice } from "@/lib/storefront-utils";
import type { Block } from "@/types/blocks";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { username: string; productId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username, productId } = await params;

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, description, cover_image_url, creators!inner(username)")
    .eq("id", productId)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) return { title: "Product not found" };

  const creator = product.creators as unknown as { username: string };
  if (creator.username !== username) return { title: "Not found" };

  return {
    title: product.name as string,
    description: (product.description as string | null) ?? undefined,
    openGraph: {
      title: product.name as string,
      description: (product.description as string | null) ?? undefined,
      images: product.cover_image_url ? [product.cover_image_url as string] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username, productId } = await params;

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, full_name, username, avatar_url")
    .eq("username", username)
    .single();

  if (!creator) notFound();

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, description, price, currency, cover_image_url, compare_at_price, is_lead_magnet, creator_id, lp_blocks")
    .eq("id", productId)
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const isLocalhost = new URL(appUrl).hostname === "localhost";
  const storefrontUrl = isLocalhost
    ? `${appUrl}/${username}`
    : `${new URL(appUrl).protocol}//${username}.${new URL(appUrl).hostname}`;

  const lpBlocks = product.lp_blocks as Block[] | null;

  // LP mode
  if (lpBlocks && lpBlocks.length > 0) {
    return (
      <LandingPage
        blocks={lpBlocks}
        product={{
          id: product.id as string,
          name: product.name as string,
          price: product.price as number,
          currency: product.currency as string,
          cover_image_url: product.cover_image_url as string | null,
          compare_at_price: product.compare_at_price as number | null,
          is_lead_magnet: product.is_lead_magnet as boolean,
          creator_id: product.creator_id as string,
        }}
        creator={{
          full_name: creator.full_name as string | null,
          username: creator.username as string,
        }}
        storefrontUrl={storefrontUrl}
      />
    );
  }

  // Simple mode (existing)
  const price = formatPrice(product.price as number, product.currency as string);
  const comparePrice = product.compare_at_price
    ? formatPrice(product.compare_at_price as number, product.currency as string)
    : null;
  const discount = calcDiscount(product.price as number, product.compare_at_price as number | null);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link
            href={storefrontUrl}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to {creator.full_name ?? username}
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="rounded-2xl overflow-hidden border bg-muted aspect-square flex items-center justify-center">
            {product.cover_image_url ? (
              <Image
                src={product.cover_image_url as string}
                alt={product.name as string}
                width={600}
                height={600}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-6xl">📄</span>
            )}
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              {(product.is_lead_magnet as boolean) ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Free
                </span>
              ) : discount !== null ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  -{discount}%
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight">{product.name as string}</h1>
              {creator.full_name && (
                <p className="text-sm text-muted-foreground">by {creator.full_name as string}</p>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              {(product.is_lead_magnet as boolean) ? (
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">Free</span>
              ) : (
                <>
                  <span className="text-2xl font-bold">{price}</span>
                  {comparePrice && (
                    <span className="text-base text-muted-foreground line-through">{comparePrice}</span>
                  )}
                </>
              )}
            </div>
            <div className="pt-2">
              <ProductPageClient
                productId={product.id as string}
                price={product.price as number}
                creatorId={product.creator_id as string}
                isLeadMagnet={product.is_lead_magnet as boolean}
                productName={product.name as string}
              />
            </div>
            {product.description && (
              <div className="pt-4 border-t">
                <h2 className="text-sm font-semibold mb-2">About this product</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description as string}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
