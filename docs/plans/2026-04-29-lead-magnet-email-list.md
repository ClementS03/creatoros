# Lead Magnet + Email List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let creators offer free products with email capture, manage subscribers with segmentation, and send broadcast emails.

**Architecture:** Lead magnet = product with `is_lead_magnet=true`. New `subscribers` + `broadcasts` tables. Storefront email capture modal → welcome email via Resend. Dashboard Audience page with filters + broadcast composer.

**Tech Stack:** Next.js 15 App Router, Supabase (service role for public writes), TypeScript, Tailwind, shadcn/ui, Resend batch API.

---

## File map

**New files:**
- `supabase/migrations/007_lead_magnet.sql`
- `supabase/migrations/008_subscribers.sql`
- `supabase/migrations/009_broadcasts.sql`
- `supabase/migrations/010_creator_send_domain.sql`
- `app/api/lead-magnet/subscribe/route.ts`
- `app/api/audience/route.ts`
- `app/api/audience/broadcast/route.ts`
- `app/api/audience/broadcast/preview/route.ts`
- `app/api/settings/send-domain/route.ts`
- `app/api/settings/send-domain/verify/route.ts`
- `app/unsubscribe/page.tsx`
- `app/dashboard/audience/page.tsx`
- `app/dashboard/audience/broadcast/page.tsx`
- `app/dashboard/settings/email/page.tsx`
- `components/storefront/LeadMagnetModal.tsx`

**Modified files:**
- `types/index.ts` — add Subscriber, Broadcast types
- `lib/email.ts` — add sendLeadMagnetEmail, sendBroadcastEmail
- `app/api/products/[id]/download/route.ts` — add subscriber param
- `app/api/stripe/webhook/route.ts` — auto-add buyers to subscribers
- `components/storefront/ProductCard.tsx` — "Get for free" + Free badge
- `components/products/ProductForm.tsx` — lead magnet toggle + welcome email editor
- `app/dashboard/products/page.tsx` — filter tabs All/Paid/Free
- `components/dashboard/Sidebar.tsx` — add Audience nav item

---

## Task 1: Migration files

**Files:**
- Create: `supabase/migrations/007_lead_magnet.sql`
- Create: `supabase/migrations/008_subscribers.sql`
- Create: `supabase/migrations/009_broadcasts.sql`
- Create: `supabase/migrations/010_creator_send_domain.sql`

- [ ] **Step 1: Create 007_lead_magnet.sql**

```sql
-- supabase/migrations/007_lead_magnet.sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_lead_magnet BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_email JSONB;
```

- [ ] **Step 2: Create 008_subscribers.sql**

```sql
-- supabase/migrations/008_subscribers.sql
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL CHECK (source IN ('lead_magnet', 'purchase', 'newsletter')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(creator_id, email)
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscribers_creator_select"
  ON subscribers FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "subscribers_creator_delete"
  ON subscribers FOR DELETE
  USING (auth.uid() = creator_id);

CREATE POLICY "subscribers_public_insert"
  ON subscribers FOR INSERT
  WITH CHECK (true);
```

- [ ] **Step 3: Create 009_broadcasts.sql**

```sql
-- supabase/migrations/009_broadcasts.sql
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  segment TEXT CHECK (segment IN ('all', 'lead_magnet', 'purchase', 'newsletter')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasts_creator"
  ON broadcasts FOR ALL
  USING (auth.uid() = creator_id);
```

- [ ] **Step 4: Create 010_creator_send_domain.sql**

```sql
-- supabase/migrations/010_creator_send_domain.sql
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS resend_domain_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_send_domain TEXT,
  ADD COLUMN IF NOT EXISTS send_domain_verified BOOLEAN DEFAULT false;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(migrations): add lead magnet, subscribers, broadcasts, send domain (007-010)"
```

> ⚠️ Apply these migrations in Supabase SQL Editor before running the feature.

---

## Task 2: TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add Subscriber and Broadcast types**

Add to the end of `types/index.ts`:

```ts
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

export type WelcomeEmail = {
  subject: string;
  body: string;
};
```

Also add `is_lead_magnet` and `welcome_email` to the Product type:

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
  welcome_email: WelcomeEmail | null;
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

Also add `send_domain_verified`, `custom_send_domain` to Creator type:

```ts
export type Creator = {
  // ... existing fields ...
  resend_domain_id: string | null;
  custom_send_domain: string | null;
  send_domain_verified: boolean;
  // ... rest of existing fields
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add Subscriber, Broadcast, WelcomeEmail types; extend Product and Creator"
```

---

## Task 3: Email helpers

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 1: Add sendLeadMagnetEmail and sendBroadcastEmail**

Add to the end of `lib/email.ts`:

```ts
function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val),
    template
  );
}

function wrapEmailBody(body: string, fromName: string): string {
  const lines = body.split("\n").map(line => `<p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">${line}</p>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:#09090b;">${fromName}</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 36px;">
          ${lines}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Powered by CreatorOS</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendLeadMagnetEmail({
  to,
  name,
  productName,
  downloadUrl,
  welcomeEmail,
  fromName,
  fromEmail,
  replyTo,
  unsubscribeUrl,
}: {
  to: string;
  name: string;
  productName: string;
  downloadUrl: string;
  welcomeEmail: { subject: string; body: string } | null;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  unsubscribeUrl: string;
}) {
  const subject = welcomeEmail?.subject?.trim()
    ? interpolate(welcomeEmail.subject, { name })
    : `Here's your free ${productName}!`;

  let rawBody = welcomeEmail?.body?.trim()
    ? welcomeEmail.body
    : `Hi {{name}},\n\nHere's your download link: {{download_link}}\n\nEnjoy!`;

  rawBody = interpolate(rawBody, {
    name,
    download_link: `<a href="${downloadUrl}" style="color:#7c3aed;font-weight:600;">Download now →</a>`,
  });

  if (!rawBody.includes(downloadUrl)) {
    rawBody += `\n\n<a href="${downloadUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Download now →</a>`;
  }

  rawBody += `\n\n<a href="${unsubscribeUrl}" style="font-size:11px;color:#a1a1aa;">Unsubscribe</a>`;

  await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    reply_to: replyTo,
    subject,
    html: wrapEmailBody(rawBody, fromName),
  });
}

export async function sendBroadcastEmail({
  recipients,
  subject,
  body,
  fromName,
  fromEmail,
  replyTo,
  appUrl,
}: {
  recipients: { email: string; name: string | null; unsubscribeToken: string }[];
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  appUrl: string;
}) {
  const emails = recipients.map(r => {
    const personalizedBody = interpolate(body, { name: r.name ?? r.email }) +
      `\n\n<a href="${appUrl}/unsubscribe?token=${r.unsubscribeToken}" style="font-size:11px;color:#a1a1aa;">Unsubscribe</a>`;
    return {
      from: `${fromName} <${fromEmail}>`,
      to: r.email,
      reply_to: replyTo,
      subject,
      html: wrapEmailBody(personalizedBody, fromName),
    };
  });

  // Resend batch limit is 100 per call — chunk if needed
  const chunks: (typeof emails)[] = [];
  for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100));
  for (const chunk of chunks) {
    await resend.batch.send(chunk);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "feat(email): add sendLeadMagnetEmail and sendBroadcastEmail helpers"
```

---

## Task 4: Subscribe API

**Files:**
- Create: `app/api/lead-magnet/subscribe/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/lead-magnet/subscribe/route.ts
import { createClient } from "@supabase/supabase-js";
import { sendLeadMagnetEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json() as { productId: string; name: string; email: string };
  const { productId, name, email } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, creator_id, is_lead_magnet, is_published, is_active, welcome_email, product_files(id, file_name, sort_order)")
    .eq("id", productId)
    .eq("is_lead_magnet", true)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("email, full_name, send_domain_verified, custom_send_domain")
    .eq("id", product.creator_id)
    .single();

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const { data: subscriber } = await supabaseAdmin
    .from("subscribers")
    .upsert({
      creator_id: product.creator_id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      source: "lead_magnet" as const,
      product_id: productId,
    }, { onConflict: "creator_id,email", ignoreDuplicates: false })
    .select("id, unsubscribe_token")
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const productFiles = (product as unknown as { product_files?: { id: string; file_name: string; sort_order: number }[] }).product_files ?? [];

  const downloadUrl = productFiles.length > 1
    ? `${appUrl}/download?order=${subscriber.id}&product=${productId}`
    : productFiles.length === 1
      ? `${appUrl}/api/products/${productId}/download?subscriber=${subscriber.id}&file=${productFiles[0].id}`
      : `${appUrl}/api/products/${productId}/download?subscriber=${subscriber.id}`;

  const fromEmail = creator.send_domain_verified && creator.custom_send_domain
    ? creator.custom_send_domain
    : "hello@creatoroshq.com";

  await sendLeadMagnetEmail({
    to: email.toLowerCase().trim(),
    name: name.trim(),
    productName: product.name as string,
    downloadUrl,
    welcomeEmail: product.welcome_email as { subject: string; body: string } | null,
    fromName: creator.full_name ?? "Creator",
    fromEmail,
    replyTo: creator.email,
    unsubscribeUrl: `${appUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`,
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/lead-magnet/
git commit -m "feat(api): POST /api/lead-magnet/subscribe — email capture + welcome email"
```

---

## Task 5: Extend download route for subscribers

**Files:**
- Modify: `app/api/products/[id]/download/route.ts`

- [ ] **Step 1: Add subscriber param support**

Replace the full file content:

```ts
// app/api/products/[id]/download/route.ts
import { createClient } from "@supabase/supabase-js";
import { getSignedDownloadUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const orderId      = request.nextUrl.searchParams.get("order");
  const subscriberId = request.nextUrl.searchParams.get("subscriber");
  const fileId       = request.nextUrl.searchParams.get("file");

  if (!orderId && !subscriberId) {
    return NextResponse.json({ error: "Missing order or subscriber" }, { status: 400 });
  }

  // Validate access
  if (orderId) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, download_count, product_id")
      .eq("id", orderId)
      .eq("product_id", productId)
      .single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("file_path, file_name, download_limit")
      .eq("id", productId)
      .single();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (
      product.download_limit !== null &&
      (order.download_count as number) >= (product.download_limit as number)
    ) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 403 });
    }

    await supabaseAdmin
      .from("orders")
      .update({ download_count: (order.download_count as number) + 1 })
      .eq("id", orderId);

  } else if (subscriberId) {
    const { data: subscriber } = await supabaseAdmin
      .from("subscribers")
      .select("id, product_id, unsubscribed_at")
      .eq("id", subscriberId)
      .eq("product_id", productId)
      .single();
    if (!subscriber) return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    if (subscriber.unsubscribed_at) return NextResponse.json({ error: "Unsubscribed" }, { status: 403 });
  }

  // Resolve file
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("file_path, file_name")
    .eq("id", productId)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let filePath: string;
  let fileName: string;

  if (fileId) {
    const { data: pf } = await supabaseAdmin
      .from("product_files")
      .select("file_path, file_name")
      .eq("id", fileId)
      .eq("product_id", productId)
      .single();
    if (!pf) return NextResponse.json({ error: "File not found" }, { status: 404 });
    filePath = pf.file_path as string;
    fileName = pf.file_name as string;
  } else {
    if (!product.file_path) return NextResponse.json({ error: "No file attached" }, { status: 404 });
    filePath = product.file_path as string;
    fileName = product.file_name as string ?? "download";
  }

  const signedUrl = await getSignedDownloadUrl(filePath, 3600);
  return NextResponse.redirect(signedUrl);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/products/
git commit -m "feat(api): extend download route to accept subscriber param"
```

---

## Task 6: Unsubscribe page

**Files:**
- Create: `app/unsubscribe/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/unsubscribe/page.tsx
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let message = "Invalid or expired unsubscribe link.";
  let success = false;

  if (token) {
    const { data } = await supabaseAdmin
      .from("subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .is("unsubscribed_at", null)
      .select("id")
      .single();

    if (data) {
      message = "You've been unsubscribed. You won't receive any more emails.";
      success = true;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-2xl">{success ? "✅" : "❌"}</p>
        <h1 className="text-xl font-semibold">{success ? "Unsubscribed" : "Something went wrong"}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/unsubscribe/
git commit -m "feat: public unsubscribe page via token"
```

---

## Task 7: LeadMagnetModal component

**Files:**
- Create: `components/storefront/LeadMagnetModal.tsx`

- [ ] **Step 1: Create the modal**

```tsx
// components/storefront/LeadMagnetModal.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  productId: string;
  productName: string;
  onClose: () => void;
};

export function LeadMagnetModal({ productId, productName, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/lead-magnet/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name: name.trim(), email: email.trim() }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-base">Get for free</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center space-y-2 py-4">
            <CheckCircle2 className="mx-auto text-green-500" size={40} strokeWidth={1.5} />
            <p className="font-medium">Check your inbox!</p>
            <p className="text-sm text-muted-foreground">
              Your download link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lm-name">Full name</Label>
              <Input
                id="lm-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-email">Email</Label>
              <Input
                id="lm-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 size={14} className="animate-spin mr-2" />Sending…</>
                : "Send me the link"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll receive an email with your download link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/storefront/LeadMagnetModal.tsx
git commit -m "feat(storefront): LeadMagnetModal — email + name capture for free products"
```

---

## Task 8: Update ProductCard for lead magnets

**Files:**
- Modify: `components/storefront/ProductCard.tsx`

- [ ] **Step 1: Update ProductCard**

Replace the full file:

```tsx
// components/storefront/ProductCard.tsx
"use client";
import { useState } from "react";
import type { Product } from "@/types";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";
import { LeadMagnetModal } from "./LeadMagnetModal";
import Image from "next/image";
import { calcDiscount, formatPrice } from "@/lib/storefront-utils";

type Props = {
  product: Pick<Product, "id" | "name" | "description" | "price" | "currency" | "type" | "cover_image_url" | "compare_at_price" | "is_lead_magnet">;
};

export function ProductCard({ product }: Props) {
  const [showModal, setShowModal] = useState(false);
  const price = formatPrice(product.price, product.currency);
  const comparePrice = product.compare_at_price
    ? formatPrice(product.compare_at_price, product.currency)
    : null;
  const discount = calcDiscount(product.price, product.compare_at_price);

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex">
        {/* Cover image — left side, full height */}
        <div className="shrink-0 w-28 self-stretch bg-muted flex items-center justify-center overflow-hidden">
          {product.cover_image_url ? (
            <Image
              src={product.cover_image_url}
              alt={product.name}
              width={112}
              height={200}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">📄</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-snug truncate">{product.name}</h3>
            {product.is_lead_magnet ? (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Free
              </span>
            ) : discount !== null ? (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                -{discount}%
              </span>
            ) : null}
          </div>

          {product.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {product.is_lead_magnet ? (
                <span className="font-bold text-base text-green-600 dark:text-green-400">Free</span>
              ) : (
                <>
                  <span className="font-bold text-base">{price}</span>
                  {comparePrice && (
                    <span className="text-sm text-muted-foreground line-through">{comparePrice}</span>
                  )}
                </>
              )}
            </div>
            {product.is_lead_magnet ? (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Get for free
              </button>
            ) : (
              <CheckoutButton productId={product.id} price={product.price} />
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <LeadMagnetModal
          productId={product.id}
          productName={product.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Update StorefrontPage to pass is_lead_magnet**

In `components/storefront/StorefrontPage.tsx`, ensure the product type passed includes `is_lead_magnet`. Check that the storefront query in `app/[username]/page.tsx` selects `is_lead_magnet`:

```ts
// In app/[username]/page.tsx, update the products select:
const { data: products } = await supabase
  .from("products")
  .select("id, name, description, price, currency, type, cover_image_url, compare_at_price, is_lead_magnet")
  .eq("creator_id", creator.id)
  .eq("is_published", true)
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/storefront/ app/[username]/page.tsx
git commit -m "feat(storefront): lead magnet card — Free badge, Get for free button, email modal"
```

---

## Task 9: ProductForm — lead magnet toggle + welcome email editor

**Files:**
- Modify: `components/products/ProductForm.tsx`

- [ ] **Step 1: Add isLeadMagnet state and welcome email state**

After the existing state declarations, add:

```ts
const [isLeadMagnet, setIsLeadMagnet] = useState(product?.is_lead_magnet ?? false);
const [welcomeSubject, setWelcomeSubject] = useState(
  (product?.welcome_email as { subject?: string } | null)?.subject ?? ""
);
const [welcomeBody, setWelcomeBody] = useState(
  (product?.welcome_email as { body?: string } | null)?.body ?? ""
);
```

- [ ] **Step 2: Update the body sent to API**

In `handleSubmit`, replace the `body` object:

```ts
const body = {
  name,
  description,
  price: isLeadMagnet ? 0 : Math.round(salePrice * 100),
  compare_at_price: isLeadMagnet ? null : (pct > 0 ? Math.round(reg * 100) : null),
  cover_image_url: coverImageUrl,
  currency: "usd",
  type: "digital" as const,
  is_published: published,
  is_lead_magnet: isLeadMagnet,
  welcome_email: isLeadMagnet
    ? { subject: welcomeSubject.trim(), body: welcomeBody.trim() }
    : null,
  files: files.map(f => ({ path: f.path, name: f.name, size: f.size, mime: f.mime })),
};
```

- [ ] **Step 3: Add lead magnet toggle to the form JSX**

Add before the `{/* Price */}` section:

```tsx
{/* Lead magnet toggle */}
<label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
  <input
    type="checkbox"
    checked={isLeadMagnet}
    onChange={e => setIsLeadMagnet(e.target.checked)}
    className="mt-0.5 rounded"
  />
  <div>
    <p className="text-sm font-medium">This is a lead magnet (free download)</p>
    <p className="text-xs text-muted-foreground mt-0.5">
      Visitors enter their name + email to get the download link. No payment required.
    </p>
  </div>
</label>

{/* Welcome email editor — shown only for lead magnets */}
{isLeadMagnet && (
  <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
    <p className="text-sm font-medium">Welcome email <span className="text-muted-foreground font-normal">(sent after signup)</span></p>
    <div className="space-y-1.5">
      <Label htmlFor="wm-subject">Subject</Label>
      <Input
        id="wm-subject"
        value={welcomeSubject}
        onChange={e => setWelcomeSubject(e.target.value)}
        placeholder={`Here's your free ${name || "product"}!`}
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="wm-body">Message</Label>
      <textarea
        id="wm-body"
        className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
        value={welcomeBody}
        onChange={e => setWelcomeBody(e.target.value)}
        placeholder={`Hi {{name}},\n\nHere's your download link: {{download_link}}\n\nEnjoy!`}
      />
      <p className="text-xs text-muted-foreground">
        Variables: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{download_link}}"}</code>
      </p>
    </div>
  </div>
)}
```

- [ ] **Step 4: Hide price section when lead magnet is on**

Wrap the `{/* Price */}` section:

```tsx
{!isLeadMagnet && (
  <div className="space-y-3">
    {/* ... existing price + discount section ... */}
  </div>
)}
```

- [ ] **Step 5: Update API allowlist in POST route to include new fields**

In `app/api/products/route.ts`, add `is_lead_magnet` and `welcome_email` to `allowedFields`:

```ts
const allowedFields = [
  "name", "description", "price", "currency", "type",
  "cover_image_url", "compare_at_price",
  "is_lead_magnet", "welcome_email",
  "file_path", "file_name", "file_size", "file_mime",
  "download_limit", "is_published",
];
```

In `app/api/products/[id]/route.ts`, add them to `allowedFields` in the PATCH handler too:

```ts
const allowedFields = [
  "name", "description", "price", "currency",
  "cover_image_url", "compare_at_price",
  "is_lead_magnet", "welcome_email",
  "file_path", "file_name", "file_size", "file_mime",
  "download_limit", "is_published",
];
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/products/ProductForm.tsx app/api/products/
git commit -m "feat(products): lead magnet toggle + welcome email editor in product form"
```

---

## Task 10: Product list filter

**Files:**
- Modify: `app/dashboard/products/page.tsx`

- [ ] **Step 1: Convert to client component with filter state**

Replace the full file:

```tsx
// app/dashboard/products/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/products/ProductActions";
import { ImageIcon } from "lucide-react";
import type { Product } from "@/types";

type Filter = "all" | "paid" | "free";

type PageData = {
  products: Product[];
  isFree: boolean;
  atLimit: boolean;
  freeLimit: number;
};

export default function ProductsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/products/page-data")
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const { products, isFree, atLimit, freeLimit } = data;

  const filtered = products.filter(p => {
    if (filter === "paid") return !p.is_lead_magnet;
    if (filter === "free") return p.is_lead_magnet;
    return true;
  });

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "free", label: "Free (Lead magnets)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        {atLimit ? (
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/billing">Upgrade for unlimited products</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/products/new">Add product</Link>
          </Button>
        )}
      </div>

      {isFree && (
        <p className="text-sm text-muted-foreground">
          {products.length} / {freeLimit} products on free plan
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(p => {
          const salePrice = p.price === 0 && !p.is_lead_magnet ? "Free" : p.is_lead_magnet ? "Free" : `$${(p.price / 100).toFixed(2)}`;
          const originalPrice = p.compare_at_price ? `$${(p.compare_at_price / 100).toFixed(2)}` : null;
          return (
            <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                {p.cover_image_url ? (
                  <Image src={p.cover_image_url} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.name}</p>
                  {p.is_lead_magnet && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                      Lead magnet
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium">{salePrice}</span>
                  {originalPrice && <span className="text-xs text-muted-foreground line-through">{originalPrice}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={p.is_published ? "default" : "secondary"}>
                  {p.is_published ? "Published" : "Draft"}
                </Badge>
                <ProductActions productId={p.id} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No products here yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `/api/products/page-data` route**

Create `app/api/products/page-data/route.ts`:

```ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { FREE_PRODUCT_LIMIT } from "@/lib/plan-limits";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: creator }, { data: products }] = await Promise.all([
    supabase.from("creators").select("plan").eq("id", user.id).single(),
    supabase
      .from("products")
      .select("id, name, description, price, currency, cover_image_url, compare_at_price, is_published, is_lead_magnet, created_at")
      .eq("creator_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const isFree = creator?.plan === "free";
  const atLimit = isFree && (products?.length ?? 0) >= FREE_PRODUCT_LIMIT;

  return NextResponse.json({
    products: products ?? [],
    isFree,
    atLimit,
    freeLimit: FREE_PRODUCT_LIMIT,
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/products/page.tsx app/api/products/page-data/
git commit -m "feat(products): filter tabs All/Paid/Free, lead magnet badge in list"
```

---

## Task 11: Audience API

**Files:**
- Create: `app/api/audience/route.ts`

- [ ] **Step 1: Create audience GET route**

```ts
// app/api/audience/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segment  = request.nextUrl.searchParams.get("segment") ?? "all";
  const productId = request.nextUrl.searchParams.get("product_id");
  const search   = request.nextUrl.searchParams.get("search") ?? "";
  const exportCsv = request.nextUrl.searchParams.get("export") === "csv";

  let query = supabase
    .from("subscribers")
    .select("id, email, name, source, product_id, subscribed_at, unsubscribed_at, products(name)")
    .eq("creator_id", user.id)
    .order("subscribed_at", { ascending: false });

  if (segment !== "all") query = query.eq("source", segment);
  if (productId) query = query.eq("product_id", productId);
  if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);

  const { data: subscribers } = await query;
  const list = subscribers ?? [];

  if (exportCsv) {
    const rows = [
      ["Name", "Email", "Source", "Product", "Subscribed at", "Status"],
      ...list.map(s => [
        s.name ?? "",
        s.email,
        s.source,
        (s.products as unknown as { name?: string } | null)?.name ?? "",
        new Date(s.subscribed_at as string).toISOString().split("T")[0],
        s.unsubscribed_at ? "unsubscribed" : "active",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers.csv"`,
      },
    });
  }

  return NextResponse.json(list);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/audience/
git commit -m "feat(api): GET /api/audience — subscriber list with filters + CSV export"
```

---

## Task 12: Broadcast APIs

**Files:**
- Create: `app/api/audience/broadcast/route.ts`
- Create: `app/api/audience/broadcast/preview/route.ts`

- [ ] **Step 1: Create broadcast preview route**

```ts
// app/api/audience/broadcast/preview/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { segment?: string; product_id?: string };
  const { segment = "all", product_id } = body;

  let query = supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id)
    .is("unsubscribed_at", null);

  if (segment !== "all") query = query.eq("source", segment);
  if (product_id) query = query.eq("product_id", product_id);

  const { count } = await query;
  return NextResponse.json({ recipientCount: count ?? 0 });
}
```

- [ ] **Step 2: Create broadcast send route**

```ts
// app/api/audience/broadcast/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendBroadcastEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    subject: string;
    body: string;
    segment: string;
    product_id?: string;
  };
  const { subject, body: emailBody, segment = "all", product_id } = body;

  if (!subject?.trim() || !emailBody?.trim()) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("email, full_name, send_domain_verified, custom_send_domain")
    .eq("id", user.id)
    .single();

  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  let query = supabaseAdmin
    .from("subscribers")
    .select("email, name, unsubscribe_token")
    .eq("creator_id", user.id)
    .is("unsubscribed_at", null);

  if (segment !== "all") query = query.eq("source", segment);
  if (product_id) query = query.eq("product_id", product_id);

  const { data: subscribers } = await query;
  const recipients = subscribers ?? [];

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, recipientCount: 0 });
  }

  const fromEmail = creator.send_domain_verified && creator.custom_send_domain
    ? creator.custom_send_domain
    : "hello@creatoroshq.com";

  await sendBroadcastEmail({
    recipients: recipients.map(r => ({
      email: r.email as string,
      name: r.name as string | null,
      unsubscribeToken: r.unsubscribe_token as string,
    })),
    subject,
    body: emailBody,
    fromName: creator.full_name ?? "Creator",
    fromEmail,
    replyTo: creator.email,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  });

  await supabaseAdmin.from("broadcasts").insert({
    creator_id: user.id,
    subject,
    body: emailBody,
    segment,
    product_id: product_id ?? null,
    recipient_count: recipients.length,
  });

  return NextResponse.json({ ok: true, recipientCount: recipients.length });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/audience/broadcast/
git commit -m "feat(api): broadcast preview + send routes"
```

---

## Task 13: Audience dashboard page

**Files:**
- Create: `app/dashboard/audience/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/dashboard/audience/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Send, Trash2 } from "lucide-react";
import type { Subscriber, Broadcast } from "@/types";

type SegmentFilter = "all" | "lead_magnet" | "purchase" | "newsletter";

type SubscriberWithProduct = Subscriber & { products?: { name: string } | null };

export default function AudiencePage() {
  const [subscribers, setSubscribers] = useState<SubscriberWithProduct[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ segment });
    if (search) params.set("search", search);
    const res = await fetch(`/api/audience?${params}`);
    if (res.ok) setSubscribers(await res.json());
    setLoading(false);
  }, [segment, search]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  useEffect(() => {
    fetch("/api/audience/broadcast/history")
      .then(r => r.ok ? r.json() : [])
      .then(setBroadcasts);
  }, []);

  async function handleUnsubscribe(id: string) {
    await fetch(`/api/audience/${id}`, { method: "DELETE" });
    setSubscribers(prev => prev.filter(s => s.id !== id));
  }

  function handleExport() {
    const params = new URLSearchParams({ segment, export: "csv" });
    if (search) params.set("search", search);
    window.location.href = `/api/audience?${params}`;
  }

  const tabs: { id: SegmentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "purchase", label: "Buyers" },
    { id: "lead_magnet", label: "Lead magnet" },
    { id: "newsletter", label: "Newsletter" },
  ];

  const sourceBadge = (source: string) => {
    const map: Record<string, string> = {
      purchase: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      lead_magnet: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      newsletter: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return map[source] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audience</h1>
          <p className="text-sm text-muted-foreground mt-1">{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/audience/broadcast">
            <Send size={14} className="mr-2" />
            Send broadcast
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 border-b flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSegment(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                segment === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Subscriber table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No subscribers yet.</td></tr>
            ) : subscribers.map(s => (
              <tr key={s.id} className={`border-t ${s.unsubscribed_at ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">{s.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadge(s.source)}`}>
                    {s.source.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {s.products?.name ?? "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                  {new Date(s.subscribed_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {!s.unsubscribed_at && (
                    <button
                      onClick={() => handleUnsubscribe(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Unsubscribe"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Broadcast history */}
      {broadcasts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-base">Broadcast history</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recipients</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sent</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{b.segment ?? "all"}</td>
                    <td className="px-4 py-3">{b.recipient_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(b.sent_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add DELETE /api/audience/[id] route**

Create `app/api/audience/[id]/route.ts`:

```ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Add GET /api/audience/broadcast/history route**

Create `app/api/audience/broadcast/history/route.ts`:

```ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("broadcasts")
    .select("id, subject, segment, product_id, recipient_count, sent_at")
    .eq("creator_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/audience/page.tsx app/api/audience/
git commit -m "feat(dashboard): Audience page with subscriber table, filters, CSV export, broadcast history"
```

---

## Task 14: Broadcast composer page

**Files:**
- Create: `app/dashboard/audience/broadcast/page.tsx`

- [ ] **Step 1: Create the broadcast page**

```tsx
// app/dashboard/audience/broadcast/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Segment = "all" | "lead_magnet" | "purchase" | "newsletter";

export default function BroadcastPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [confirming, setConfirming] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    const res = await fetch("/api/audience/broadcast/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segment }),
    });
    if (res.ok) {
      const { recipientCount: count } = await res.json() as { recipientCount: number };
      setRecipientCount(count);
      setConfirming(true);
    }
  }

  async function handleSend() {
    setSending(true);
    const res = await fetch("/api/audience/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, segment }),
    });
    if (res.ok) {
      toast.success(`Sent to ${recipientCount} subscriber${recipientCount !== 1 ? "s" : ""}!`);
      router.push("/dashboard/audience");
    } else {
      const data = await res.json() as { error?: string };
      toast.error(data.error ?? "Failed to send");
      setSending(false);
    }
  }

  const segmentOptions: { value: Segment; label: string }[] = [
    { value: "all", label: "All subscribers" },
    { value: "purchase", label: "Buyers only" },
    { value: "lead_magnet", label: "Lead magnet subscribers" },
    { value: "newsletter", label: "Newsletter subscribers" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/audience"><ArrowLeft size={14} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Send broadcast</h1>
      </div>

      <form onSubmit={handlePreview} className="space-y-5">
        <div className="space-y-2">
          <Label>To</Label>
          <select
            value={segment}
            onChange={e => setSegment(e.target.value as Segment)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {segmentOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bc-subject">Subject <span className="text-destructive">*</span></Label>
          <Input
            id="bc-subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Your subject line"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bc-body">Message <span className="text-destructive">*</span></Label>
          <textarea
            id="bc-body"
            className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`Hi {{name}},\n\nYour message here…`}
            required
          />
          <p className="text-xs text-muted-foreground">
            Variable: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> — personalized per subscriber
          </p>
        </div>

        {/* Email preview */}
        {body && (
          <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
            <p className="text-sm font-medium">{subject || "No subject"}</p>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</div>
          </div>
        )}

        <Button type="submit" disabled={!subject.trim() || !body.trim()}>
          <Send size={14} className="mr-2" />
          Review and send
        </Button>
      </form>

      {/* Confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-base">Send broadcast?</h2>
            <p className="text-sm text-muted-foreground">
              This will send <strong>{recipientCount}</strong> email{recipientCount !== 1 ? "s" : ""} to your {segment === "all" ? "entire audience" : `${segment.replace("_", " ")} segment`}.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSend} disabled={sending}>
                {sending ? "Sending…" : `Send to ${recipientCount}`}
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
git add app/dashboard/audience/broadcast/page.tsx
git commit -m "feat(dashboard): broadcast composer page with segment selector and confirmation"
```

---

## Task 15: Send domain APIs

**Files:**
- Create: `app/api/settings/send-domain/route.ts`
- Create: `app/api/settings/send-domain/verify/route.ts`

- [ ] **Step 1: Create domain setup route**

```ts
// app/api/settings/send-domain/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await request.json() as { domain: string };
  if (!domain?.trim() || !domain.includes(".")) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const { data, error } = await resend.domains.create({ name: domain.trim() });
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create domain" }, { status: 500 });
  }

  await supabase
    .from("creators")
    .update({ resend_domain_id: data.id, send_domain_verified: false, custom_send_domain: null })
    .eq("id", user.id);

  return NextResponse.json({ records: data.records });
}

export async function DELETE() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("resend_domain_id")
    .eq("id", user.id)
    .single();

  if (creator?.resend_domain_id) {
    await resend.domains.remove(creator.resend_domain_id as string).catch(() => null);
  }

  await supabase
    .from("creators")
    .update({ resend_domain_id: null, send_domain_verified: false, custom_send_domain: null })
    .eq("id", user.id);

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: Create domain verify route**

```ts
// app/api/settings/send-domain/verify/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("resend_domain_id")
    .eq("id", user.id)
    .single();

  if (!creator?.resend_domain_id) {
    return NextResponse.json({ error: "No domain configured" }, { status: 400 });
  }

  const { data } = await resend.domains.get(creator.resend_domain_id as string);

  if (data?.status === "verified") {
    const domainName = data.name;
    await supabase
      .from("creators")
      .update({ send_domain_verified: true, custom_send_domain: `hello@${domainName}` })
      .eq("id", user.id);
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false, status: data?.status });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/send-domain/
git commit -m "feat(api): send domain setup and verify routes (Resend programmatic domains)"
```

---

## Task 16: Email settings page

**Files:**
- Create: `app/dashboard/settings/email/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/dashboard/settings/email/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Creator } from "@/types";

export default function EmailSettingsPage() {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState<{ type: string; name: string; value: string }[] | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storefront").then(r => r.json()).then(setCreator);
  }, []);

  async function handleConfigure() {
    setConfiguring(true);
    setError(null);
    const res = await fetch("/api/settings/send-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    const data = await res.json() as { records?: { type: string; name: string; value: string }[]; error?: string };
    if (res.ok && data.records) {
      setRecords(data.records);
    } else {
      setError(data.error ?? "Failed to configure domain");
    }
    setConfiguring(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    const res = await fetch("/api/settings/send-domain/verify", { method: "POST" });
    const data = await res.json() as { verified?: boolean; status?: string; error?: string };
    if (data.verified) {
      const updated = await fetch("/api/storefront").then(r => r.json());
      setCreator(updated);
    } else {
      setError(`DNS not verified yet (status: ${data.status ?? "pending"}). Wait a few minutes and try again.`);
    }
    setVerifying(false);
  }

  async function handleRemove() {
    await fetch("/api/settings/send-domain", { method: "DELETE" });
    setRecords(null);
    setDomain("");
    const updated = await fetch("/api/storefront").then(r => r.json());
    setCreator(updated);
  }

  if (!creator) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Email settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure how your emails are sent to subscribers.</p>
      </div>

      {/* Current sending identity */}
      <div className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Sending identity</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">From name:</span> {creator.full_name ?? "Creator"}</p>
          <p>
            <span className="text-muted-foreground">From address:</span>{" "}
            {creator.send_domain_verified && creator.custom_send_domain
              ? creator.custom_send_domain
              : "hello@creatoroshq.com"}
            {creator.send_domain_verified && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Custom domain */}
      <div className="rounded-xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Custom sending domain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send emails from your own domain (e.g. <code>hello@yoursite.com</code>).
          </p>
        </div>

        {creator.send_domain_verified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 size={14} />
              <span>{creator.custom_send_domain} is verified and active.</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemove}>Remove custom domain</Button>
          </div>
        ) : records ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add these DNS records to your domain, then click Verify.</p>
            <div className="space-y-2">
              {records.map((r, i) => (
                <div key={i} className="rounded-lg border p-3 text-xs font-mono space-y-1 bg-muted/20">
                  <div><span className="text-muted-foreground">Type:</span> {r.type}</div>
                  <div><span className="text-muted-foreground">Name:</span> {r.name}</div>
                  <div className="break-all"><span className="text-muted-foreground">Value:</span> {r.value}</div>
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleVerify} disabled={verifying}>
                {verifying ? <><Loader2 size={14} className="animate-spin mr-2" />Checking…</> : "Verify DNS"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemove}>Start over</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Your domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="yoursite.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="sm" onClick={handleConfigure} disabled={configuring || !domain.trim()}>
              {configuring ? <><Loader2 size={14} className="animate-spin mr-2" />Configuring…</> : "Configure"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/settings/email/
git commit -m "feat(settings): email settings page with custom sending domain (Resend DNS)"
```

---

## Task 17: Webhook — auto-add buyers to subscribers

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Add subscriber upsert after order creation**

In `app/api/stripe/webhook/route.ts`, after the order insert and before the analytics insert, add:

```ts
// After: const { data: order } = await supabaseAdmin.from("orders").insert({...}).select().single();
// Add:
if (order) {
  await supabaseAdmin.from("subscribers").upsert({
    creator_id: creatorId,
    email: buyerEmail,
    name: (session.customer_details?.name as string | null | undefined) ?? "",
    source: "purchase",
    product_id: productId,
  }, { onConflict: "creator_id,email", ignoreDuplicates: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat(webhook): auto-add buyers to subscribers (source=purchase)"
```

---

## Task 18: Sidebar — add Audience nav item + Email settings

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Add Audience to nav and Email to settingsNav**

In `components/dashboard/Sidebar.tsx`:

```ts
import {
  LayoutDashboard, Package, BarChart2, Store,
  CreditCard, User, PanelLeft, LogOut, Users, Mail,
} from "lucide-react";

const nav = [
  { href: "/dashboard",                  label: "Overview",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products",         label: "Products",   icon: Package },
  { href: "/dashboard/audience",         label: "Audience",   icon: Users },
  { href: "/dashboard/storefront",       label: "Storefront", icon: Store },
  { href: "/dashboard/analytics",        label: "Analytics",  icon: BarChart2 },
];

const settingsNav = [
  { href: "/dashboard/settings/billing", label: "Billing",    icon: CreditCard },
  { href: "/dashboard/settings/email",   label: "Email",      icon: Mail },
  { href: "/dashboard/settings/account", label: "Account",    icon: User },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat(sidebar): add Audience nav item and Email settings link"
```

---

## Self-review checklist

**Spec coverage:**
- ✅ Task 1 — Migrations 007-010
- ✅ Task 2 — TypeScript types
- ✅ Task 3 — Email helpers (lead magnet + broadcast)
- ✅ Task 4 — POST /api/lead-magnet/subscribe
- ✅ Task 5 — Download route subscriber param
- ✅ Task 6 — /unsubscribe page
- ✅ Task 7 — LeadMagnetModal
- ✅ Task 8 — ProductCard lead magnet
- ✅ Task 9 — ProductForm toggle + welcome email editor
- ✅ Task 10 — Product list filter
- ✅ Task 11 — GET /api/audience
- ✅ Task 12 — Broadcast APIs
- ✅ Task 13 — Audience dashboard page
- ✅ Task 14 — Broadcast composer
- ✅ Task 15 — Send domain APIs
- ✅ Task 16 — Email settings page
- ✅ Task 17 — Webhook buyer → subscriber
- ✅ Task 18 — Sidebar

**Migrations note:** Apply 007→010 in Supabase SQL Editor before testing.
