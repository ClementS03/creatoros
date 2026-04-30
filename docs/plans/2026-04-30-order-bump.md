# Order Bump — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let creators add up to 5 order bumps to a product; buyers select them before checkout for a single combined payment.

**Architecture:** `order_bumps JSONB` on `products` stores bump items + optional bundle price. `create-checkout` receives selected bump IDs, sums their prices (or uses bundle price), creates one Stripe session. Webhook creates a sibling order per bump. Download page finds sibling orders by `stripe_payment_intent_id` and shows all files grouped.

**Tech Stack:** Next.js 15 App Router, Supabase, TypeScript, Tailwind, shadcn/ui, Stripe.

---

## File map

**New files:**
- `supabase/migrations/014_order_bumps.sql`
- `lib/order-bump-utils.ts` — `calculateBumpTotal()`
- `__tests__/lib/order-bump-utils.test.ts`
- `app/api/products/[id]/bump-products/route.ts` — GET creator's other products
- `components/products/OrderBumpsEditor.tsx` — dashboard editor
- `components/storefront/OrderBumpsSelector.tsx` — storefront bump checkboxes

**Modified files:**
- `types/index.ts` — add `OrderBumpItem`, `OrderBumps`, extend `Product`
- `app/api/products/[id]/route.ts` — add `order_bumps` to PATCH allowlist
- `app/api/stripe/create-checkout/route.ts` — accept `bumpProductIds`, apply bump total
- `app/api/stripe/webhook/route.ts` — create sibling orders for bumps
- `components/checkout/CheckoutButton.tsx` — accept `bumpProductIds` + `bumpExtraAmount`
- `components/storefront/ProductPageClient.tsx` — accept + pass order bump props
- `app/[username]/[productId]/page.tsx` — fetch bump products, pass to client
- `components/storefront/LandingPage.tsx` — pass bump props to HeroBlock / CTABlock
- `components/storefront/blocks/HeroBlock.tsx` — pass bump props to ProductPageClient
- `components/storefront/blocks/CTABlock.tsx` — pass bump props to ProductPageClient
- `app/download/page.tsx` — query sibling orders by payment intent, show bump files
- `docs/TEST-CHECKLIST.md` — add order bump section

---

## Task 1: Migration + types

**Files:**
- Create: `supabase/migrations/014_order_bumps.sql`
- Modify: `types/index.ts`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/014_order_bumps.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_bumps JSONB;
```

> ⚠️ Apply in Supabase SQL Editor before testing.

- [ ] **Step 2: Add types to `types/index.ts`**

Add after the `WelcomeEmail` type (before `Product`):

```ts
export type OrderBumpItem = {
  product_id: string;
  custom_price: number;
  label: string;
};

export type OrderBumps = {
  items: OrderBumpItem[];
  bundle_price: number | null;
};
```

Then add `order_bumps: OrderBumps | null;` to `Product`, after `lp_blocks`:

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/014_order_bumps.sql types/index.ts
git commit -m "feat(order-bump): migration 014 + OrderBumps types"
```

---

## Task 2: `lib/order-bump-utils.ts` + unit tests

**Files:**
- Create: `lib/order-bump-utils.ts`
- Create: `__tests__/lib/order-bump-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/lib/order-bump-utils.test.ts
import { describe, it, expect } from "vitest";
import { calculateBumpTotal } from "../../lib/order-bump-utils";
import type { OrderBumps } from "../../types/index";

describe("calculateBumpTotal", () => {
  const bumps: OrderBumps = {
    items: [
      { product_id: "a", custom_price: 900, label: "Bonus A" },
      { product_id: "b", custom_price: 500, label: "Bonus B" },
    ],
    bundle_price: 1200,
  };

  it("returns 0 for empty selection", () => {
    expect(calculateBumpTotal(bumps, [])).toBe(0);
  });

  it("sums custom_price for partial selection", () => {
    expect(calculateBumpTotal(bumps, ["a"])).toBe(900);
  });

  it("sums multiple partial selections", () => {
    expect(calculateBumpTotal(bumps, ["a", "b"])).toBe(1400);
  });

  it("uses bundle_price when ALL bumps selected and bundle_price is set", () => {
    expect(calculateBumpTotal(bumps, ["a", "b"])).toBe(1200);
    // Note: above would fail — need to re-read: only bundle_price when bundle_price != null
  });

  it("uses bundle_price when all selected and bundle_price set", () => {
    const allSelected = ["a", "b"];
    expect(calculateBumpTotal(bumps, allSelected)).toBe(1200);
  });

  it("sums all when all selected but bundle_price is null", () => {
    const noBundlePrice: OrderBumps = { ...bumps, bundle_price: null };
    expect(calculateBumpTotal(noBundlePrice, ["a", "b"])).toBe(1400);
  });

  it("returns 0 for unknown product_id", () => {
    expect(calculateBumpTotal(bumps, ["unknown"])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

```bash
node_modules/.bin/vitest run __tests__/lib/order-bump-utils.test.ts --reporter=verbose
```

Expected: FAIL — `calculateBumpTotal` not defined.

- [ ] **Step 3: Implement `lib/order-bump-utils.ts`**

```ts
// lib/order-bump-utils.ts
import type { OrderBumps } from "@/types/index";

export function calculateBumpTotal(orderBumps: OrderBumps, selectedIds: string[]): number {
  if (selectedIds.length === 0) return 0;
  // All bumps selected and bundle price configured → use bundle price
  if (
    selectedIds.length === orderBumps.items.length &&
    orderBumps.bundle_price !== null
  ) {
    return orderBumps.bundle_price;
  }
  // Sum individual custom prices for selected bumps
  return orderBumps.items
    .filter(item => selectedIds.includes(item.product_id))
    .reduce((sum, item) => sum + item.custom_price, 0);
}
```

- [ ] **Step 4: Fix test — remove duplicate "uses bundle_price" test (the first one in step 1 was a draft). Use this final test file:**

```ts
// __tests__/lib/order-bump-utils.test.ts
import { describe, it, expect } from "vitest";
import { calculateBumpTotal } from "../../lib/order-bump-utils";
import type { OrderBumps } from "../../types/index";

describe("calculateBumpTotal", () => {
  const bumps: OrderBumps = {
    items: [
      { product_id: "a", custom_price: 900, label: "Bonus A" },
      { product_id: "b", custom_price: 500, label: "Bonus B" },
    ],
    bundle_price: 1200,
  };

  it("returns 0 for empty selection", () => {
    expect(calculateBumpTotal(bumps, [])).toBe(0);
  });

  it("sums custom_price for single selection", () => {
    expect(calculateBumpTotal(bumps, ["a"])).toBe(900);
  });

  it("uses bundle_price when all selected and bundle_price set", () => {
    expect(calculateBumpTotal(bumps, ["a", "b"])).toBe(1200);
  });

  it("sums all when all selected but bundle_price is null", () => {
    const noBundlePrice: OrderBumps = { ...bumps, bundle_price: null };
    expect(calculateBumpTotal(noBundlePrice, ["a", "b"])).toBe(1400);
  });

  it("returns 0 for unknown product_id in selection", () => {
    expect(calculateBumpTotal(bumps, ["unknown"])).toBe(0);
  });
});
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
node_modules/.bin/vitest run __tests__/lib/order-bump-utils.test.ts --reporter=verbose
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/order-bump-utils.ts __tests__/lib/order-bump-utils.test.ts
git commit -m "feat(order-bump): calculateBumpTotal util + 5 unit tests"
```

---

## Task 3: API — bump-products route + PATCH allowlist

**Files:**
- Create: `app/api/products/[id]/bump-products/route.ts`
- Modify: `app/api/products/[id]/route.ts`

- [ ] **Step 1: Create `bump-products/route.ts`**

```ts
// app/api/products/[id]/bump-products/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("products")
    .select("id, name, price, currency")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .neq("id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 2: Add `order_bumps` to PATCH allowlist in `app/api/products/[id]/route.ts`**

Find the `allowedFields` array and update it:

```ts
const allowedFields = [
  "name", "description", "price", "currency",
  "cover_image_url", "compare_at_price",
  "is_lead_magnet", "welcome_email",
  "is_bundle",
  "lp_blocks",
  "order_bumps",
  "file_path", "file_name", "file_size", "file_mime",
  "download_limit", "is_published",
];
```

- [ ] **Step 3: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/products/[id]/bump-products/route.ts app/api/products/[id]/route.ts
git commit -m "feat(order-bump): bump-products GET route; add order_bumps to PATCH allowlist"
```

---

## Task 4: Update `create-checkout` to handle bumps

**Files:**
- Modify: `app/api/stripe/create-checkout/route.ts`

- [ ] **Step 1: Replace `create-checkout/route.ts`**

```ts
// app/api/stripe/create-checkout/route.ts
import { stripe, calculatePlatformFee } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { calculateBumpTotal } from "@/lib/order-bump-utils";
import type { OrderBumps } from "@/types/index";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    productId: string;
    buyerEmail?: string;
    discountCodeId?: string;
    bumpProductIds?: string[];
  };
  const { productId, buyerEmail, discountCodeId, bumpProductIds = [] } = body;

  const supabase = await createSupabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, currency, creator_id, is_published, is_active, order_bumps")
    .eq("id", productId)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, plan, username")
    .eq("id", product.creator_id)
    .single();

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ error: "Creator payments not set up" }, { status: 400 });
  }

  // Apply discount code
  let finalPrice = product.price as number;
  let appliedDiscountId: string | null = null;

  if (discountCodeId) {
    const { data: dc } = await supabaseAdmin
      .from("discount_codes")
      .select("id, type, value, usage_limit, used_count, expires_at, is_active")
      .eq("id", discountCodeId)
      .eq("creator_id", product.creator_id)
      .eq("is_active", true)
      .single();

    if (
      dc &&
      (dc.usage_limit === null || (dc.used_count as number) < (dc.usage_limit as number)) &&
      (!dc.expires_at || new Date(dc.expires_at as string) >= new Date())
    ) {
      if (dc.type === "percentage") {
        finalPrice = Math.round(finalPrice * (1 - (dc.value as number) / 100));
      } else {
        finalPrice = Math.max(0, finalPrice - (dc.value as number));
      }
      appliedDiscountId = dc.id as string;
    }
  }

  // Apply bump total
  const orderBumps = product.order_bumps as OrderBumps | null;
  const bumpTotal = orderBumps && bumpProductIds.length > 0
    ? calculateBumpTotal(orderBumps, bumpProductIds)
    : 0;

  finalPrice = finalPrice + bumpTotal;
  if (finalPrice < 50) finalPrice = 50; // Stripe minimum $0.50

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const fee = calculatePlatformFee(finalPrice, creator.plan === "pro");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: product.currency as string,
          product_data: { name: product.name as string },
          unit_amount: finalPrice,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: fee,
      transfer_data: { destination: creator.stripe_account_id as string },
      metadata: {
        productId: product.id as string,
        creatorId: product.creator_id as string,
        discountCodeId: appliedDiscountId ?? "",
        bumpProductIds: bumpProductIds.length > 0 ? JSON.stringify(bumpProductIds) : "",
      },
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: creator.username
      ? `${new URL(appUrl).protocol}//${creator.username}.${new URL(appUrl).hostname}`
      : appUrl,
    metadata: {
      productId: product.id as string,
      creatorId: product.creator_id as string,
      discountCodeId: appliedDiscountId ?? "",
      bumpProductIds: bumpProductIds.length > 0 ? JSON.stringify(bumpProductIds) : "",
    },
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass (no tests touch this route directly).

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/create-checkout/route.ts
git commit -m "feat(order-bump): create-checkout accepts bumpProductIds, sums bump total"
```

---

## Task 5: Update webhook to create bump orders

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Replace the `checkout.session.completed` block**

In `app/api/stripe/webhook/route.ts`, replace the entire `if (event.type === "checkout.session.completed")` block with:

```ts
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { productId, creatorId, discountCodeId, bumpProductIds: bumpIdsRaw } = session.metadata ?? {};
    const buyerEmail =
      session.customer_email ?? session.customer_details?.email;

    if (!productId || !creatorId || !buyerEmail) {
      return NextResponse.json({ ok: true });
    }

    const bumpProductIds: string[] = bumpIdsRaw ? JSON.parse(bumpIdsRaw) : [];

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, file_path, price, currency, is_bundle, product_files(id, file_name, sort_order), bundle_items(product_id, products(name, file_path, product_files(id, file_name, sort_order)))")
      .eq("id", productId)
      .single();

    if (!product) return NextResponse.json({ ok: true });

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? "";

    const { data: order } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id: productId,
        creator_id: creatorId,
        buyer_email: buyerEmail,
        amount_paid: session.amount_total ?? (product.price as number),
        currency: product.currency as string,
        platform_fee: (session as Stripe.Checkout.Session & { application_fee_amount?: number }).application_fee_amount ?? 0,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    await supabaseAdmin.from("analytics_events").insert({
      creator_id: creatorId,
      event: "purchase",
      product_id: productId,
      metadata: { amount: session.amount_total, order_id: order?.id },
    });

    if (discountCodeId) {
      await supabaseAdmin.rpc("increment_discount_usage", { code_id: discountCodeId });
    }

    if (order) {
      await supabaseAdmin.from("subscribers").upsert({
        creator_id: creatorId,
        email: buyerEmail,
        name: (session.customer_details?.name as string | null | undefined) ?? "",
        source: "purchase",
        product_id: productId,
      }, { onConflict: "creator_id,email", ignoreDuplicates: true });
    }

    // Create sibling orders for each bump product
    if (bumpProductIds.length > 0) {
      await supabaseAdmin.from("orders").insert(
        bumpProductIds.map(bumpId => ({
          product_id: bumpId,
          creator_id: creatorId,
          buyer_email: buyerEmail,
          amount_paid: 0,
          currency: product.currency as string,
          platform_fee: 0,
          stripe_payment_intent_id: paymentIntentId,
        }))
      );
    }

    const isBundle = (product as unknown as { is_bundle?: boolean }).is_bundle;

    if (order) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

      if (isBundle) {
        const downloadUrl = `${appUrl}/download?order=${order.id}&product=${productId}`;
        await sendPurchaseEmail({
          to: buyerEmail,
          productName: product.name as string,
          downloadUrl,
        });
      } else {
        const productFiles = (product as unknown as { product_files?: { id: string; sort_order: number }[] }).product_files ?? [];
        const hasFiles = productFiles.length > 0 || product.file_path;
        if (hasFiles) {
          // If bumps were purchased, always use the grouped download page
          const downloadUrl = bumpProductIds.length > 0
            ? `${appUrl}/download?order=${order.id}&product=${productId}`
            : productFiles.length > 1
              ? `${appUrl}/download?order=${order.id}&product=${productId}`
              : productFiles.length === 1
                ? `${appUrl}/api/products/${productId}/download?order=${order.id}&file=${productFiles[0].id}`
                : `${appUrl}/api/products/${productId}/download?order=${order.id}`;
          await sendPurchaseEmail({
            to: buyerEmail,
            productName: product.name as string,
            downloadUrl,
          });
        }
      }
    }
  }
```

- [ ] **Step 2: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat(order-bump): webhook creates sibling orders for bump products"
```

---

## Task 6: `OrderBumpsEditor` dashboard component

**Files:**
- Create: `components/products/OrderBumpsEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/products/OrderBumpsEditor.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import type { OrderBumps, OrderBumpItem } from "@/types/index";

type BumpProduct = { id: string; name: string; price: number; currency: string };

type Props = { productId: string };

export function OrderBumpsEditor({ productId }: Props) {
  const [items, setItems] = useState<OrderBumpItem[]>([]);
  const [bundlePrice, setBundlePrice] = useState<string>("");
  const [available, setAvailable] = useState<BumpProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [creating, setCreating] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/products/${productId}/bump-products`).then(r => r.json()),
    ]).then(([prod, avail]) => {
      const p = prod as { order_bumps?: OrderBumps };
      if (p.order_bumps) {
        setItems(p.order_bumps.items ?? []);
        setBundlePrice(p.order_bumps.bundle_price != null ? String(p.order_bumps.bundle_price / 100) : "");
      }
      setAvailable(avail as BumpProduct[]);
    });
  }, [productId]);

  const save = useCallback(async (newItems: OrderBumpItem[], newBundlePrice: string) => {
    setSaving(true);
    setSaved(false);
    const bp = newBundlePrice ? Math.round(parseFloat(newBundlePrice) * 100) : null;
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_bumps: newItems.length > 0 ? { items: newItems, bundle_price: bp } : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [productId]);

  function triggerSave(newItems: OrderBumpItem[], newBundlePrice: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newItems, newBundlePrice), 1000);
  }

  function addBump(product: BumpProduct) {
    if (items.length >= 5) return;
    const newItem: OrderBumpItem = {
      product_id: product.id,
      custom_price: product.price,
      label: `Add "${product.name}"`,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setShowDropdown(false);
    triggerSave(updated, bundlePrice);
  }

  function removeBump(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    triggerSave(updated, bundlePrice);
  }

  function updateItem(index: number, field: "label" | "custom_price", value: string) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      if (field === "custom_price") {
        return { ...item, custom_price: Math.round(parseFloat(value || "0") * 100) };
      }
      return { ...item, label: value };
    });
    setItems(updated);
    triggerSave(updated, bundlePrice);
  }

  function updateBundlePrice(val: string) {
    setBundlePrice(val);
    triggerSave(items, val);
  }

  async function handleCreate() {
    if (!createName.trim() || !createPrice) return;
    setCreating(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName.trim(),
        price: Math.round(parseFloat(createPrice) * 100),
        currency: "usd",
        type: "digital",
        is_published: false,
      }),
    });
    if (res.ok) {
      const newProd = await res.json() as BumpProduct;
      setAvailable(prev => [newProd, ...prev]);
      addBump(newProd);
      setShowCreateModal(false);
      setCreateName("");
      setCreatePrice("");
    }
    setCreating(false);
  }

  const usedIds = new Set(items.map(i => i.product_id));
  const addableProducts = available.filter(p => !usedIds.has(p.id));

  const bundlePriceCents = bundlePrice ? Math.round(parseFloat(bundlePrice) * 100) : null;
  const sumCents = items.reduce((s, i) => s + i.custom_price, 0);
  const savings = bundlePriceCents && sumCents > bundlePriceCents
    ? Math.round(((sumCents - bundlePriceCents) / sumCents) * 100)
    : null;

  return (
    <div className="space-y-4 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Order bumps</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Offer extra products to buyers before checkout.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saving && <span className="text-muted-foreground flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving…</span>}
          {saved && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={11} />Saved</span>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.product_id} className="flex gap-2 items-center border rounded-lg p-2.5 bg-muted/20">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={item.label}
                  onChange={e => updateItem(i, "label", e.target.value)}
                  placeholder="Sales label…"
                  className="h-7 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(item.custom_price / 100).toFixed(2)}
                    onChange={e => updateItem(i, "custom_price", e.target.value)}
                    className="h-7 text-xs w-24"
                  />
                  <span className="text-xs text-muted-foreground">per item</span>
                </div>
              </div>
              <button onClick={() => removeBump(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bundle price */}
      {items.length > 1 && (
        <div className="space-y-1">
          <Label className="text-xs">Bundle price if all selected (optional)</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={bundlePrice}
              onChange={e => updateBundlePrice(e.target.value)}
              placeholder="e.g. 12.00"
              className="h-7 text-xs w-28"
            />
            {savings !== null && (
              <span className="text-xs text-green-600 font-medium">Save {savings}%</span>
            )}
          </div>
        </div>
      )}

      {/* Add bump */}
      {items.length < 5 && (
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setShowDropdown(v => !v)}
          >
            <Plus size={13} className="mr-1.5" />
            Add bump {items.length > 0 ? `(${items.length}/5)` : ""}
          </Button>
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-background border rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {addableProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addBump(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">${(p.price / 100).toFixed(2)}</span>
                </button>
              ))}
              <button
                onClick={() => { setShowDropdown(false); setShowCreateModal(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left border-t text-primary"
              >
                <Plus size={13} />
                Create new product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background border rounded-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">New product</h4>
              <button onClick={() => setShowCreateModal(false)}><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Bonus pack" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (USD) *</Label>
                <Input type="number" min="0" step="0.01" value={createPrice} onChange={e => setCreatePrice(e.target.value)} placeholder="9.00" className="h-8 text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">Product is created as a draft. Add files by editing it later.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !createName.trim() || !createPrice}>
                {creating ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                Create & add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/products/OrderBumpsEditor.tsx
git commit -m "feat(order-bump): OrderBumpsEditor dashboard component"
```

---

## Task 7: Wire OrderBumpsEditor into product edit page

**Files:**
- Modify: `app/dashboard/products/[id]/page.tsx`

- [ ] **Step 1: Update the page**

```tsx
// app/dashboard/products/[id]/page.tsx
import { createSupabaseServer } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/ProductForm";
import { OrderBumpsEditor } from "@/components/products/OrderBumpsEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user!.id)
    .single();

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/products/${id}/landing-page`}>
            <LayoutTemplate size={14} className="mr-1.5" />
            Edit landing page
          </Link>
        </Button>
      </div>
      <ProductForm product={product} />
      <OrderBumpsEditor productId={id} />
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/products/[id]/page.tsx
git commit -m "feat(order-bump): add OrderBumpsEditor to product edit page"
```

---

## Task 8: `OrderBumpsSelector` storefront component

**Files:**
- Create: `components/storefront/OrderBumpsSelector.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/storefront/OrderBumpsSelector.tsx
"use client";
import { useState } from "react";
import type { OrderBumps } from "@/types/index";
import { calculateBumpTotal } from "@/lib/order-bump-utils";

type BumpProduct = { id: string; name: string };

type Props = {
  orderBumps: OrderBumps;
  bumpProducts: BumpProduct[];
  mainPrice: number;
  onSelectionChange: (selectedIds: string[], extraAmount: number) => void;
};

export function OrderBumpsSelector({ orderBumps, bumpProducts, mainPrice, onSelectionChange }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (orderBumps.items.length === 0) return null;

  function toggle(id: string) {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelectedIds(updated);
    const extra = calculateBumpTotal(orderBumps, updated);
    onSelectionChange(updated, extra);
  }

  const allSelected = selectedIds.length === orderBumps.items.length;
  const extra = calculateBumpTotal(orderBumps, selectedIds);
  const total = mainPrice + extra;

  // Build lookup map for product names
  const nameMap = new Map(bumpProducts.map(p => [p.id, p.name]));

  return (
    <div className="space-y-3 border-t pt-4 mt-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add to your order</p>
      <div className="space-y-2">
        {orderBumps.items.map(item => {
          const checked = selectedIds.includes(item.product_id);
          const productName = nameMap.get(item.product_id) ?? item.label;
          return (
            <label
              key={item.product_id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.product_id)}
                className="mt-0.5 accent-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{productName}</p>
              </div>
              <span className="text-sm font-semibold shrink-0 text-primary">
                +${(item.custom_price / 100).toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>

      {/* Bundle deal banner */}
      {orderBumps.items.length > 1 && orderBumps.bundle_price !== null && (
        <div className={`text-xs rounded-md px-3 py-2 transition-colors ${
          allSelected
            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-muted/50 text-muted-foreground"
        }`}>
          {allSelected
            ? `🎉 Bundle deal applied! Saving $${((orderBumps.items.reduce((s, i) => s + i.custom_price, 0) - orderBumps.bundle_price!) / 100).toFixed(2)}`
            : `Select all ${orderBumps.items.length} to unlock bundle price: $${(orderBumps.bundle_price / 100).toFixed(2)}`
          }
        </div>
      )}

      {/* Running total */}
      {selectedIds.length > 0 && (
        <div className="text-xs text-right text-muted-foreground">
          Total: <span className="font-semibold text-foreground">${(total / 100).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/storefront/OrderBumpsSelector.tsx
git commit -m "feat(order-bump): OrderBumpsSelector storefront component"
```

---

## Task 9: Wire bumps into CheckoutButton + ProductPageClient

**Files:**
- Modify: `components/checkout/CheckoutButton.tsx`
- Modify: `components/storefront/ProductPageClient.tsx`

- [ ] **Step 1: Update `CheckoutButton.tsx`**

Add `bumpProductIds` and `bumpExtraAmount` props, include them in checkout call and price display:

```tsx
// components/checkout/CheckoutButton.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  productId: string;
  price: number;
  creatorId: string;
  bumpProductIds?: string[];
  bumpExtraAmount?: number;
};

type DiscountResult = { id: string; code: string; type: "percentage" | "fixed"; value: number };

export function CheckoutButton({ productId, price, creatorId, bumpProductIds = [], bumpExtraAmount = 0 }: Props) {
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const discountedBase = discount
    ? discount.type === "percentage"
      ? Math.round(price * (1 - discount.value / 100))
      : Math.max(0, price - discount.value)
    : price;

  const discountedPrice = discountedBase + bumpExtraAmount;

  async function handleValidateCode() {
    if (!codeInput.trim()) return;
    setValidating(true);
    setCodeError(null);
    const res = await fetch("/api/discount-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeInput.trim(), creatorId }),
    });
    const data = await res.json() as DiscountResult & { error?: string };
    if (res.ok) {
      setDiscount(data);
    } else {
      setCodeError(data.error ?? "Invalid code");
    }
    setValidating(false);
  }

  function removeDiscount() {
    setDiscount(null);
    setCodeInput("");
    setCodeError(null);
    setShowCode(false);
  }

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        discountCodeId: discount?.id,
        bumpProductIds,
      }),
    });
    if (!res.ok) { setLoading(false); return; }
    const { url } = await res.json() as { url: string };
    window.location.href = url;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 justify-end">
        {discount && (
          <span className="text-sm text-muted-foreground line-through">
            ${((price + bumpExtraAmount) / 100).toFixed(2)}
          </span>
        )}
        <Button onClick={handleCheckout} disabled={loading} size="sm">
          {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
          {loading
            ? "Loading…"
            : discountedPrice === 0
              ? "Get for free"
              : `Buy — $${(discountedPrice / 100).toFixed(2)}`}
        </Button>
      </div>

      {discount ? (
        <div className="flex items-center gap-1.5 justify-end text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 size={12} />
          <span>{discount.code} applied ({discount.type === "percentage" ? `-${discount.value}%` : `-$${(discount.value / 100).toFixed(2)}`})</span>
          <button onClick={removeDiscount} className="text-muted-foreground hover:text-foreground ml-1">
            <X size={11} />
          </button>
        </div>
      ) : showCode ? (
        <div className="flex items-center gap-1.5 justify-end">
          <Input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleValidateCode()}
            placeholder="PROMO CODE"
            className="h-7 text-xs w-32 font-mono uppercase"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleValidateCode} disabled={validating || !codeInput.trim()}>
            {validating ? <Loader2 size={11} className="animate-spin" /> : "Apply"}
          </Button>
          <button onClick={() => setShowCode(false)} className="text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
          {codeError && <span className="text-xs text-destructive">{codeError}</span>}
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setShowCode(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Tag size={11} />
            Have a promo code?
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `ProductPageClient.tsx`**

```tsx
// components/storefront/ProductPageClient.tsx
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
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/checkout/CheckoutButton.tsx components/storefront/ProductPageClient.tsx
git commit -m "feat(order-bump): wire OrderBumpsSelector into CheckoutButton + ProductPageClient"
```

---

## Task 10: Pass order_bumps data through product pages and LP blocks

**Files:**
- Modify: `app/[username]/[productId]/page.tsx`
- Modify: `components/storefront/LandingPage.tsx`
- Modify: `components/storefront/blocks/HeroBlock.tsx`
- Modify: `components/storefront/blocks/CTABlock.tsx`

- [ ] **Step 1: Update `app/[username]/[productId]/page.tsx`**

In the product query, add `order_bumps`:
```ts
const { data: product } = await supabaseAdmin
  .from("products")
  .select("id, name, description, price, currency, cover_image_url, compare_at_price, is_lead_magnet, creator_id, lp_blocks, order_bumps")
  .eq("id", productId)
  .eq("creator_id", creator.id)
  .eq("is_published", true)
  .eq("is_active", true)
  .single();
```

After the product query, fetch bump products if needed:
```ts
import type { OrderBumps } from "@/types/index";

// ... after product fetch ...
const orderBumps = product.order_bumps as OrderBumps | null;
const bumpProductIds = orderBumps?.items.map(i => i.product_id) ?? [];

let bumpProducts: { id: string; name: string }[] = [];
if (bumpProductIds.length > 0) {
  const { data: bp } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .in("id", bumpProductIds);
  bumpProducts = (bp ?? []) as { id: string; name: string }[];
}
```

In the LP mode block, pass `orderBumps` and `bumpProducts` to `LandingPage`:
```tsx
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
      orderBumps={orderBumps}
      bumpProducts={bumpProducts}
    />
  );
}
```

In the simple mode `<ProductPageClient>`, also pass bumps:
```tsx
<ProductPageClient
  productId={product.id as string}
  price={product.price as number}
  creatorId={product.creator_id as string}
  isLeadMagnet={product.is_lead_magnet as boolean}
  productName={product.name as string}
  orderBumps={orderBumps}
  bumpProducts={bumpProducts}
/>
```

- [ ] **Step 2: Update `components/storefront/LandingPage.tsx`**

Add `orderBumps` and `bumpProducts` to Props and pass down to HeroBlock and CTABlock:

```tsx
// components/storefront/LandingPage.tsx
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
```

- [ ] **Step 3: Update `HeroBlock.tsx`**

```tsx
// components/storefront/blocks/HeroBlock.tsx
import type { HeroData } from "@/types/blocks";
import type { Product, OrderBumps } from "@/types";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";
import Image from "next/image";

type BumpProduct = { id: string; name: string };

type Props = {
  data: HeroData;
  product: Pick<Product, "id" | "price" | "currency" | "cover_image_url" | "compare_at_price" | "is_lead_magnet" | "creator_id" | "name">;
  orderBumps?: OrderBumps | null;
  bumpProducts?: BumpProduct[];
};

export function HeroBlock({ data, product, orderBumps, bumpProducts = [] }: Props) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
        {product.cover_image_url && (
          <div className="w-full max-w-md rounded-2xl overflow-hidden border bg-muted aspect-square">
            <Image
              src={product.cover_image_url}
              alt={data.headline}
              width={500}
              height={500}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold leading-tight">{data.headline}</h1>
        {data.subheading && (
          <p className="text-lg text-muted-foreground max-w-xl">{data.subheading}</p>
        )}
        <div className="w-full max-w-sm">
          <ProductPageClient
            productId={product.id}
            price={product.price}
            creatorId={product.creator_id}
            isLeadMagnet={product.is_lead_magnet}
            productName={product.name}
            orderBumps={orderBumps}
            bumpProducts={bumpProducts}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update `CTABlock.tsx`**

```tsx
// components/storefront/blocks/CTABlock.tsx
import type { CTAData } from "@/types/blocks";
import type { Product, OrderBumps } from "@/types";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";

type BumpProduct = { id: string; name: string };

type Props = {
  data: CTAData;
  product: Pick<Product, "id" | "price" | "is_lead_magnet" | "creator_id" | "name">;
  orderBumps?: OrderBumps | null;
  bumpProducts?: BumpProduct[];
};

export function CTABlock({ data, product, orderBumps, bumpProducts = [] }: Props) {
  return (
    <section className="py-12 px-4 border-t bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="max-w-md mx-auto text-center space-y-4">
        {data.headline && <h2 className="text-2xl font-bold">{data.headline}</h2>}
        <ProductPageClient
          productId={product.id}
          price={product.price}
          creatorId={product.creator_id}
          isLeadMagnet={product.is_lead_magnet}
          productName={product.name}
          orderBumps={orderBumps}
          bumpProducts={bumpProducts}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/[username]/[productId]/page.tsx" components/storefront/LandingPage.tsx components/storefront/blocks/HeroBlock.tsx components/storefront/blocks/CTABlock.tsx
git commit -m "feat(order-bump): pass orderBumps + bumpProducts through product page and LP blocks"
```

---

## Task 11: Download page — show bump products

**Files:**
- Modify: `app/download/page.tsx`

- [ ] **Step 1: Replace `app/download/page.tsx`**

```tsx
// app/download/page.tsx
import { createClient } from "@supabase/supabase-js";
import { Download, File } from "lucide-react";
import Link from "next/link";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Props = { searchParams: Promise<{ order?: string; product?: string }> };

type FileEntry = { id: string; file_name: string; file_size: number | null; sort_order: number; product_id: string; order_id: string };
type ProductGroup = { name: string; files: FileEntry[] };

export default async function DownloadPage({ searchParams }: Props) {
  const { order: orderId, product: productId } = await searchParams;

  if (!orderId || !productId) return <ErrorPage message="Invalid download link." />;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, stripe_payment_intent_id")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (!order) return <ErrorPage message="Order not found." />;

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, is_bundle, download_limit, product_files(id, file_name, file_size, sort_order), bundle_items(product_id, sort_order, products(name, product_files(id, file_name, file_size, sort_order)))")
    .eq("id", productId)
    .single();

  if (!product) return <ErrorPage message="Product not found." />;

  const isBundle = (product as unknown as { is_bundle?: boolean }).is_bundle;

  // Find sibling bump orders (same payment intent, different product)
  const bumpGroups: ProductGroup[] = [];
  if (order.stripe_payment_intent_id) {
    const { data: siblingOrders } = await supabaseAdmin
      .from("orders")
      .select("id, product_id")
      .eq("stripe_payment_intent_id", order.stripe_payment_intent_id as string)
      .neq("id", orderId);

    if (siblingOrders && siblingOrders.length > 0) {
      const bumpProductIds = siblingOrders.map(o => o.product_id as string);
      const { data: bumpProducts } = await supabaseAdmin
        .from("products")
        .select("id, name, product_files(id, file_name, file_size, sort_order)")
        .in("id", bumpProductIds);

      if (bumpProducts) {
        for (const bp of bumpProducts) {
          const siblingOrder = siblingOrders.find(o => o.product_id === bp.id);
          if (!siblingOrder) continue;
          const files = ((bp as unknown as { product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] }).product_files ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(f => ({ ...f, product_id: bp.id as string, order_id: siblingOrder.id as string }));
          if (files.length > 0) {
            bumpGroups.push({ name: bp.name as string, files });
          }
        }
      }
    }
  }

  // Build product groups for display
  const mainGroups: ProductGroup[] = [];

  if (isBundle) {
    const bundleItems = (product as unknown as {
      bundle_items?: {
        product_id: string;
        sort_order: number;
        products: { name: string; product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] };
      }[]
    }).bundle_items ?? [];

    bundleItems
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach(item => {
        const files = (item.products.product_files ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(f => ({ ...f, product_id: item.product_id, order_id: orderId }));
        if (files.length > 0) {
          mainGroups.push({ name: item.products.name, files });
        }
      });
  } else {
    const files = ((product as unknown as { product_files?: { id: string; file_name: string; file_size: number | null; sort_order: number }[] }).product_files ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => ({ ...f, product_id: productId, order_id: orderId }));
    if (files.length > 0) {
      mainGroups.push({ name: product.name as string, files });
    }
  }

  const allGroups = [...mainGroups, ...bumpGroups];
  const showGroupHeaders = allGroups.length > 1;
  const totalFiles = allGroups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold">
            {showGroupHeaders ? "Your files are ready" : "Your file is ready"}
          </h1>
          <p className="text-muted-foreground text-sm">{product.name as string}</p>
          {showGroupHeaders && (
            <p className="text-xs text-muted-foreground">{allGroups.length} products · {totalFiles} files</p>
          )}
        </div>

        <div className="space-y-3">
          {allGroups.map(group => (
            <div key={group.name} className="rounded-xl border overflow-hidden">
              {showGroupHeaders && (
                <div className="px-4 py-2.5 bg-muted/40 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.name}</p>
                </div>
              )}
              <div className="divide-y">
                {group.files.map(f => (
                  <a
                    key={f.id}
                    href={`/api/products/${f.product_id}/download?order=${f.order_id}&file=${f.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <File size={18} className="text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{f.file_name}</span>
                    {f.file_size && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(f.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                    <Download size={16} className="text-primary shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Save these files — this link may expire.
        </p>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">{message}</p>
        <Link href="/" className="text-sm text-primary underline">Back to home</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/download/page.tsx
git commit -m "feat(order-bump): download page shows bump products via sibling orders"
```

---

## Task 12: Run all tests + update test checklist + push

**Files:**
- Modify: `docs/TEST-CHECKLIST.md`

- [ ] **Step 1: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass (including new order-bump-utils tests).

- [ ] **Step 2: Add order bump section to `docs/TEST-CHECKLIST.md`**

Add before the LP Builder section:

```markdown
## Order bumps (`/dashboard/products/[id]`)

### Dashboard
- [ ] "Order bumps" section visible below product form
- [ ] "Add bump" shows dropdown of other products
- [ ] Select a product → added as bump row with default label + price
- [ ] Edit label and price → auto-saves after 1s
- [ ] Remove bump → row disappears
- [ ] Add 5 bumps → "Add bump" button hides
- [ ] Bundle price field appears when 2+ bumps added
- [ ] Bundle price savings % shown when bundle < sum of individual

### Storefront (product page or LP)
- [ ] Bumps appear below checkout button when configured
- [ ] Each bump shows label, product name, price
- [ ] Checking a bump → price on Buy button updates
- [ ] Checking all bumps + bundle price set → bundle price applied, savings shown
- [ ] Unchecking a bump → price reverts
- [ ] Buy with 1 bump → Stripe total = main + bump price
- [ ] Buy with all bumps + bundle price → Stripe total = main + bundle_price

### Post-purchase
- [ ] Download page shows main product files
- [ ] Bump product files appear as separate sections below main product
- [ ] Each bump file downloads correctly
```

- [ ] **Step 3: Commit and push**

```bash
git add docs/TEST-CHECKLIST.md
git commit -m "test(order-bump): update test checklist with order bump scenarios"
git push
```

---

## Self-review

**Spec coverage:**
- ✅ Migration 014 — Task 1
- ✅ `OrderBumps`/`OrderBumpItem` types — Task 1
- ✅ `calculateBumpTotal` util + tests — Task 2
- ✅ `bump-products` GET route — Task 3
- ✅ `order_bumps` PATCH allowlist — Task 3
- ✅ `create-checkout` bump pricing — Task 4
- ✅ Webhook sibling orders — Task 5
- ✅ `OrderBumpsEditor` dashboard (add/remove/label/price/bundle/inline create) — Task 6
- ✅ Product edit page wired — Task 7
- ✅ `OrderBumpsSelector` storefront (checkboxes, bundle deal banner, running total) — Task 8
- ✅ `CheckoutButton` bumps props — Task 9
- ✅ `ProductPageClient` bump passthrough — Task 9
- ✅ Product page + LP blocks wired — Task 10
- ✅ Download page sibling orders — Task 11
- ✅ Max 5 bumps UI limit — Task 6
- ✅ Bundle price = applies when all selected and bundle_price not null — Tasks 2 + 8
