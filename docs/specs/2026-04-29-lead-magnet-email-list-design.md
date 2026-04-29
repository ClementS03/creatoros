# Lead Magnet + Email List — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-04-29
**Status:** Approved for implementation planning
**Project:** CreatorOS

---

## Goal

Let creators offer free products (lead magnets) in exchange for a visitor's name + email. Build a full subscriber list with segmentation and broadcast email capabilities. Foundation for all future email marketing features.

## Architecture

Extend the existing product system — a lead magnet is a product with `is_lead_magnet = true` and `price = 0`. Reuses existing product form, storefront, file system, and download API. New: `subscribers` table, `broadcasts` table, Audience dashboard, email capture modal on storefront.

**Tech stack:** Next.js 15 App Router + Supabase + TypeScript + Tailwind + shadcn/ui + Resend API.

---

## 1. Database

### New column on `products`

```sql
ALTER TABLE products
  ADD COLUMN is_lead_magnet BOOLEAN DEFAULT false,
  ADD COLUMN welcome_email JSONB; -- { subject: string, body: string }
```

### New table: `subscribers`

```sql
CREATE TABLE subscribers (
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

-- Public INSERT (visitor signing up via lead magnet)
CREATE POLICY "subscribers_public_insert"
  ON subscribers FOR INSERT
  WITH CHECK (true);
```

### New table: `broadcasts`

```sql
CREATE TABLE broadcasts (
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

### New column on `creators` (custom sending domain)

```sql
ALTER TABLE creators
  ADD COLUMN resend_domain_id TEXT,      -- Resend domain ID after verification
  ADD COLUMN custom_send_domain TEXT,    -- e.g. "hello@julesupont.com"
  ADD COLUMN send_domain_verified BOOLEAN DEFAULT false;
```

---

## 2. Migrations

| # | File | Description |
|---|------|-------------|
| 007 | `007_lead_magnet.sql` | `is_lead_magnet`, `welcome_email` on products |
| 008 | `008_subscribers.sql` | `subscribers` table + RLS |
| 009 | `009_broadcasts.sql` | `broadcasts` table + RLS |
| 010 | `010_creator_send_domain.sql` | `resend_domain_id`, `custom_send_domain`, `send_domain_verified` on creators |

---

## 3. Storefront — Email capture flow

### Product card (ProductCard.tsx)
- Lead magnet products: button shows **"Get for free"** instead of CheckoutButton
- Badge shows **"Free"** (green) instead of price

### Email capture modal (new: `LeadMagnetModal.tsx`)
Triggered by "Get for free" button. Fields:
- **Full name** (required)
- **Email** (required)
- Submit button: "Send me the link"

On submit → `POST /api/lead-magnet/subscribe`:
1. Upsert into `subscribers` (ignore if already subscribed, still send email)
2. Send welcome email via Resend (creator's custom welcome_email or default template)
3. Return `{ ok: true }`

Modal confirms: **"Check your inbox! Your download link is on its way."**

### Download via subscriber token
Link in welcome email: `/api/products/[id]/download?subscriber=[subscriber_id]`

`GET /api/products/[id]/download` — extend existing route to accept `subscriber` param in addition to `order`. Validates that subscriber exists and has subscribed to that product.

---

## 4. Welcome email

Sent via Resend on each new lead magnet signup.

**From:** Creator's verified domain if `send_domain_verified = true`, else `"Creator Name" <hello@creatoroshq.com>`
**Reply-to:** Creator's email

**Template:** Creator writes custom subject + body in product form. Variables:
- `{{name}}` → subscriber's full name
- `{{download_link}}` → download URL (auto-appended at bottom if not included in body)

**Default subject** (if creator didn't write one): `"Here's your free [product name]!"`

**Default body** (if creator didn't write one):
```
Hi {{name}},

Here's your download link:
{{download_link}}

Enjoy!
```

Stored as `products.welcome_email = { subject: string, body: string }`.

---

## 5. API Routes

### `POST /api/lead-magnet/subscribe`
```ts
body: { productId: string; name: string; email: string }
```
- Fetch product (verify `is_lead_magnet = true`, `is_published = true`, `is_active = true`)
- Fetch creator (for from-name + send domain)
- Upsert subscriber (ignore conflict on `creator_id + email`)
- Send welcome email via Resend
- Return `{ ok: true }`

Error cases:
- Product not found / not a lead magnet → 404
- Invalid email → 400

### `GET /api/products/[id]/download` (extend existing)
- Accept `?subscriber=[id]` in addition to `?order=[id]`
- Validate subscriber exists + `product_id` matches + `unsubscribed_at IS NULL`

### `GET /api/audience` 
```
?segment=all|lead_magnet|purchase|newsletter
&product_id=uuid (optional)
&search=text (optional)
&export=csv (optional)
```
Returns paginated subscriber list for authenticated creator.
If `export=csv`: returns CSV file (name, email, source, product, date).

### `POST /api/audience/broadcast`
```ts
body: { subject: string; body: string; segment: string; product_id?: string }
```
- Count recipients matching segment (excluding unsubscribed)
- Send via `resend.batch.send()` — inject unsubscribe link in each email
- Insert into `broadcasts` table with `recipient_count`
- Return `{ ok: true; recipientCount: number }`

### `POST /api/audience/broadcast/preview`
```ts
body: { segment: string; product_id?: string }
```
Returns `{ recipientCount: number }` — used for confirmation modal before sending.

### `GET /unsubscribe` (public page)
`?token=[unsubscribe_token]`
- Sets `unsubscribed_at = now()` for matching subscriber
- Shows simple confirmation page: "You've been unsubscribed."

### `POST /api/settings/send-domain`
```ts
body: { domain: string } // e.g. "mysite.com"
```
- Calls Resend API to create domain → returns DNS records (SPF, DKIM, DMARC)
- Stores `resend_domain_id` on creator
- Returns DNS records to display

### `POST /api/settings/send-domain/verify`
- Calls Resend API to check domain verification status
- If verified: sets `send_domain_verified = true`, `custom_send_domain = "hello@{domain}"`

---

## 6. Dashboard — Product form changes (`ProductForm.tsx`)

New toggle: **"This is a lead magnet (free download)"**
- When ON: price field hidden, `is_lead_magnet = true`
- Reveals welcome email editor:
  - **Subject** field
  - **Body** textarea (with `{{name}}` and `{{download_link}}` hints)
  - Live preview panel

---

## 7. Dashboard — Audience page (`/dashboard/audience`)

### Subscriber list
- Table: Name, Email, Source (colored badge), Product, Date
- Filter tabs: **All** / **Buyers** / **Lead magnet** / **Newsletter**
- Search input (email or name)
- Export CSV button (respects active filter)
- Unsubscribe action per row (soft delete: sets `unsubscribed_at`)

### Broadcast section
Button "Send broadcast" → navigates to `/dashboard/audience/broadcast`

### Broadcast history
Table below list: Subject, Segment, Recipients, Date sent.

---

## 8. Dashboard — Broadcast page (`/dashboard/audience/broadcast`)

Form:
- **To**: dropdown → All subscribers / Buyers / Lead magnet subscribers / Newsletter / Specific product subscribers
- **Subject**: text input
- **Body**: textarea (markdown, `{{name}}` variable supported)
- **Preview**: live rendered email on the right

Send flow:
1. User clicks "Send" → calls preview API → shows confirmation modal: "Send to X subscribers?"
2. Confirms → POST to `/api/audience/broadcast`
3. Success toast + redirect to audience page

---

## 9. Dashboard — Email settings (`/dashboard/settings/email`)

New settings tab. Two sections:

**Sending identity**
- Display name (default: creator's full_name)
- Current sending address (Option A: `hello@creatoroshq.com` | Option B: custom)

**Custom sending domain (Option B)**
- Input: domain (e.g. `mysite.com`)
- Click "Configure" → shows 3 DNS records to add (SPF, DKIM, DMARC)
- "Verify DNS" button → calls verify API
- Status badge: Pending / Verified

---

## 10. Webhook — auto-add buyers to subscribers

In `app/api/stripe/webhook/route.ts`, after creating the order:

```ts
await supabaseAdmin.from("subscribers").upsert({
  creator_id: creatorId,
  email: buyerEmail,
  name: session.customer_details?.name ?? "",
  source: "purchase",
  product_id: productId,
}, { onConflict: "creator_id,email", ignoreDuplicates: true });
```

Buyers are automatically in the audience. Source = `purchase`.

---

## 11. Product list filter (`/dashboard/products`)

Existing product list gets a filter toggle: **All** / **Paid** / **Free (Lead magnets)**
- Filter applies `is_lead_magnet = true/false` to the query
- Lead magnet badge shown in list rows

---

## Out of scope (Phase 3+)

- Email open/click tracking
- Email sequences / automation
- Drag-and-drop email editor
- Newsletter signup widget (embeddable on external sites)
- Subscriber tagging
