# Storefront V2 — Feature Spec

_Written: 2026-04-29_

---

## Context

Current storefront (`username.creatoroshq.com`) is a minimal page: avatar + name + bio + plain product cards. No images, no social links, no theming, no personality.

Reference: Stan.store — full profile page with background customization, product images, social links, booking, reviews, discounts, font/button style control.

Goal: make the storefront a real landing page that converts, feels personal, and gives creators enough control without overwhelming them.

---

## Feature List

### 1. Storefront Theme & Visual Customization

**What:** Let creators fully control the look of their storefront page.

**Options to expose:**
- **Background** — solid color, gradient (2 colors), or image upload
- **Foreground / text color** — auto-derived from background (dark/light detection), or manual override
- **Button style** — rounded pill / square / soft (medium radius)
- **Button color** — defaults to `brand_color`, can be overridden
- **Font** — pick from 5-6 curated Google Fonts (e.g. Inter, Playfair Display, DM Sans, Poppins, Space Grotesk, Sora)
- **Layout** — list (current) / grid 2-col / grid 3-col (mobile always 1-col)

**DB changes:**
Add to `creators` table:
```sql
ALTER TABLE creators ADD COLUMN theme JSONB DEFAULT '{}';
```
`theme` stores: `{ bg_color, bg_type ("color"|"gradient"|"image"), bg_gradient_end, bg_image_url, text_color, button_style ("pill"|"rounded"|"square"), button_color, font, layout ("list"|"grid2"|"grid3") }`

**UI:** Settings → Storefront tab. Live preview in an iframe or side panel. No external visual editor needed — shadcn controls are enough.

---

### 2. Pre-made Storefront Templates

**What:** 5-8 curated theme presets a creator can apply in one click, then customize.

**Examples:**
- **Minimal** — white bg, black text, Inter, square buttons
- **Dark Pro** — #0a0a0a bg, white text, DM Sans, pill buttons
- **Warm** — #faf5ee bg, #2d2013 text, Playfair Display, soft buttons
- **Bold** — brand_color as bg, white text, Space Grotesk, square buttons
- **Pastel** — #f0f4ff bg, #1e2a4a text, Poppins, pill buttons

**Implementation:** Hardcoded array of template objects in `lib/storefront-templates.ts`. Applying a template = writing its values into `creators.theme`.

---

### 3. Product Images

**What:** Each product can have a cover image (thumbnail) shown on the product card.

**DB changes:**
```sql
ALTER TABLE products ADD COLUMN cover_image_url TEXT;
```

**Storage:** `avatars` bucket (public) — or a new `product-covers` public bucket. Path: `{creatorId}/products/{productId}.jpg`.

**UI in ProductForm:** Image upload zone above the name field. Shows preview. Max 5MB, jpg/png/webp.

**Storefront:** In grid layout, image fills the card top. In list layout, image shown as a thumbnail on the left side of the card.

---

### 4. Social Links Display on Storefront

**DB:** `social_links JSONB` already exists on `creators` (twitter, instagram, youtube, tiktok, website).

**What's missing:** The storefront page doesn't display them. Just needs to render icons with links.

**Platforms:** X/Twitter, Instagram, YouTube, TikTok, LinkedIn, Website.

**UI on storefront:** Row of icon buttons below the bio. Small, subtle.

**UI in dashboard:** Settings → Storefront → Social Links section (already partially there as `social_links` in DB, just needs the form fields).

---

### 5. Discount Badges on Products

**What:** Creator can set a "compare at price" (original price) on a product. The storefront shows a crossed-out original price + a discount % badge.

**DB changes:**
```sql
ALTER TABLE products ADD COLUMN compare_at_price INTEGER; -- original price in cents, NULL = no discount
```

**Display logic:**
- If `compare_at_price > price` → show crossed price + `−XX%` badge (amber/red pill)
- Example: `$97` ~~$197~~ `−51% OFF`

**UI in ProductForm:** Optional "Compare at price" field below the price. If filled and greater than price, badge will appear.

---

### 6. Product Reviews & Ratings

**What:** Buyers can leave a star rating (1–5) + optional text review after purchasing. Creator can choose to display them publicly on the storefront.

**DB:**
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  reviewer_name TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Flow:**
1. After purchase, buyer gets email with download link + link to review page
2. Review page: `/review?order=[orderId]&product=[productId]`
3. Simple form: star picker + name + optional text
4. Creator can toggle visibility per review in their dashboard
5. Storefront shows average rating + review count on product card, expandable list

**Notes:**
- One review per order (unique constraint `order_id`)
- No auth required for buyer — order ID is the "token"

---

### 7. Booking / Coaching Page

**What:** Creators can create booking products (e.g. "1-hour coaching call"). Buyer picks a time slot, pays, gets a confirmation + meeting link.

**DB:**
```sql
CREATE TABLE booking_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  meeting_link TEXT, -- Zoom/Meet URL sent after booking
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_product_id UUID NOT NULL REFERENCES booking_products(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Flow:**
1. Creator creates a "Coaching" product with duration + meeting link + available slots
2. Storefront shows booking card with a calendar / slot picker
3. Buyer picks a slot + pays via Stripe Checkout
4. On webhook: slot marked as booked, confirmation email sent with meeting link + datetime
5. Creator gets notification email

**Notes:** No Google Calendar sync in MVP — creator manually adds slots. GCal sync = Phase 3.

---

### 8. Page Sections (Beyond Products)

**What:** Creator can add free-form sections to their storefront beyond just the product grid.

**Possible section types:**
- **Featured / Hero** — big headline, subtext, CTA button (link anywhere)
- **Text block** — rich text with formatting
- **Testimonial** — name, quote, optional avatar
- **Embed** — YouTube video URL → auto-embed
- **Divider / spacer**

**DB:**
```sql
CREATE TABLE storefront_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'hero' | 'text' | 'testimonial' | 'embed' | 'divider'
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:** This is a big feature. Minimal MVP = just Hero + Text block. Full drag-and-drop editor is Phase 4+.

---

## Priority Order

| Priority | Feature | Complexity | Impact |
|---|---|---|---|
| 🔴 P0 | Social links display | Low | Medium |
| 🔴 P0 | Product images | Medium | High |
| 🔴 P0 | Storefront theme (bg, button style, font) | Medium | Very High |
| 🟠 P1 | Pre-made templates | Low | High |
| 🟠 P1 | Discount badges | Low | High |
| 🟠 P1 | Layout options (list/grid) | Low | Medium |
| 🟡 P2 | Reviews & ratings | Medium | High |
| 🟡 P2 | Booking / coaching page | High | Very High |
| 🔵 P3 | Page sections (Hero, Text) | High | High |
| 🔵 P3 | Full visual editor | Very High | Medium |

---

## DB migration order

```
006_storefront_theme.sql     — ADD COLUMN theme JSONB to creators
007_product_images.sql       — ADD COLUMN cover_image_url, compare_at_price to products
008_product_reviews.sql      — CREATE TABLE product_reviews
009_booking.sql              — CREATE TABLE booking_products, booking_slots
010_storefront_sections.sql  — CREATE TABLE storefront_sections
```

---

## What stays on the LP vs storefront

- LP (`creatoroshq.com`) = marketing, conversions, sign up
- Storefront (`username.creatoroshq.com`) = creator's personal page, products, booking
- Never mix the two. Storefront has zero CreatorOS marketing on it (except small "Powered by CreatorOS" footer link — removable on Pro).

---

## Open questions

1. **Font loading** — use `next/font/google` on the storefront page dynamically? Or CSS variable swap? Dynamic font loading is complex with SSR. Alternative: ship all 6 fonts, conditionally apply CSS class.
2. **Background image** — store in `avatars` bucket (public) or a dedicated `storefront-bg` bucket?
3. **Reviews moderation** — auto-visible or creator must approve? Recommend: auto-visible, creator can hide individual ones.
4. **Booking payments** — use same Stripe Connect flow as products, or separate checkout session type? Recommend: same flow, `booking_product` treated as a product in Stripe metadata.
5. **"Powered by CreatorOS"** link — should free plan show it? Recommend: yes, removable on Pro (brand removal perk).
