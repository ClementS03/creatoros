# CreatorOS — Product Design Spec

**Date:** 2026-04-25
**Status:** Approved for implementation planning
**Author:** Clément Seguin

---

## 1. Overview

CreatorOS is a standalone creator monetization platform — a direct competitor to stan.store, Gumroad, and Kajabi — priced lower, designed better, and with native integration for FreelanceOS users.

**Positioning:** Everything creators need to monetize their audience, with zero transaction fees on paid plans.

**URL:** `creatoroshq.com`

**Tagline:** *"Everything you need to monetize your audience. No per-sale fees."*

**Language:** English only at launch. No i18n in V1.

---

## 2. Boilerplate — ShipFast

The project is bootstrapped with **ShipFast** (shipfa.st) — Marc Lou's Next.js SaaS starter — configured to match FreelanceOS conventions as closely as possible.

ShipFast provides out of the box:
- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Supabase auth (Google OAuth + email/password)
- Stripe billing (subscription + one-time)
- Resend transactional emails
- SEO utilities (metadata, OG, sitemap, robots.txt)
- Landing page template (to be fully redesigned)
- Vercel-ready config

**Customization on top of ShipFast:**
- Replace ShipFast's Stripe with Stripe Connect (creator payouts)
- Add Mux for video
- Adopt FreelanceOS API patterns (auth checks, RLS, PATCH allowlist)
- Add PostHog EU analytics (same as FreelanceOS)
- Replace ShipFast LP with a custom high-quality design
- Enforce same security patterns as FreelanceOS

---

## 3. Target Audience

General creator market — YouTubers, TikTokers, coaches, consultants, designers, developers, educators. Not niche-specific at launch.

Secondary audience: FreelanceOS users who want to sell digital products alongside their freelance business.

---

## 4. Business Model

| Tier | Price | Transaction Fee | Notes |
|---|---|---|---|
| Free | $0/mo | 8% per sale | Max 3 products, 500 email subscribers, 1 course (max 5 lessons) |
| Pro | $19/mo | 0% | Full features, custom domain, email automations |
| FreelanceOS Bundle | $9/mo | 0% | Pro features + native FreelanceOS integration, auto-detected |

**Rationale:**
- Free with 8% fee (vs Gumroad's 10%) — lower barrier, still monetizes
- Pro at $19 undercuts stan.store ($29) — same feature parity, better price
- Bundle at $9 is a real concrete perk (0% fees + deep integration), not just a discount

**Stripe architecture:** Stripe Connect. Each creator connects their Stripe account via Express onboarding. Platform collects `application_fee_amount` on Free tier. Pro/Bundle users pay their abo via standard Stripe with 0% fee on sales.

---

## 5. Feature Scope

### 5.1 Storefront
- Customizable creator page: bio, avatar, social links, brand colors
- Free subdomain: `username.creatoroshq.com`
- Custom domain (Pro): `shop.yourcreatorsite.com` via Vercel Domains API
- Drag-and-drop section reordering
- Mobile-first, conversion-optimized layout
- Public storefront fully SEO-optimized (OG tags, sitemap, structured data)

### 5.2 Digital Products
- File upload (PDF, ZIP, MP4, PSD, Figma, any format)
- Product variants (e.g. template in multiple formats)
- Upsells and bundles
- Free preview (PDF excerpt, video teaser)
- Automatic delivery post-purchase via email (Resend)
- Secure download links (signed URLs, 24h expiry, download limit configurable by creator per product)

### 5.3 Online Courses
- Modules + lessons (video, text, PDF attachments)
- Drip content (time-based or milestone unlock)
- Completion certificates
- Per-lesson analytics (completion rate, drop-off)
- Video hosting via **Mux** (adaptive streaming, custom player)

### 5.4 Booking / Coaching
- Configurable availability calendar
- 1:1 and group sessions
- Google Calendar sync (read + write)
- Auto-generated Zoom/Google Meet link
- Payment required before booking confirmation
- Email reminders (24h + 1h before session)

### 5.5 Memberships
- Recurring subscriptions (monthly / annual)
- Tiered membership plans (Basic, Pro, VIP…)
- Gated content per plan
- Member management dashboard
- Dunning handling (failed payments, grace period)

### 5.6 Community
- Built-in threaded forum (no Discord redirect)
- Public and private spaces
- Email notifications for new posts/replies
- Free or paid (gated by membership tier)
- Creator pinned posts and announcements

### 5.7 Email / Newsletter
- Native email list (no Mailchimp dependency)
- Lead magnets: offer free product in exchange for email opt-in
- Broadcast newsletters (one-shot sends)
- Basic automations: welcome sequence, post-purchase follow-up
- **Pro:** Advanced sequences, audience segmentation, conditional logic
- Powered by Resend (same as FreelanceOS)

### 5.8 Analytics
- Revenue by product, date range, plan
- Storefront conversion rate (visits → purchases)
- Traffic sources
- Email stats (open rate, click rate, unsubscribe rate)
- Course completion analytics
- CSV export

### 5.9 AutoDM (Pro)
- Automated Instagram DM replies on comment keyword trigger
- Configurable trigger keyword + product link
- **Note:** Requires Instagram Basic Display API + Webhooks. Subject to Meta policy changes — treat as best-effort feature, decouple cleanly so it can be removed without affecting core product if API access is revoked.

---

## 6. Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres + auth + storage + RLS) |
| Payments | Stripe Connect |
| Video | Mux |
| Email | Resend |
| Deployment | Vercel |
| Analytics | Vercel Analytics + PostHog EU |
| Boilerplate | ShipFast |

### Multi-tenant Routing
- `creatoroshq.com` → marketing LP + auth
- `username.creatoroshq.com` → public creator storefront
- `creatoroshq.com/dashboard` → creator dashboard (authed)
- Middleware reads `request.headers.get('host')` to route subdomains

### Stripe Connect Flow
1. Creator signs up → prompted to connect Stripe account
2. `stripe.accounts.create({ type: 'express' })` → redirect to Stripe onboarding
3. On return: store `stripe_account_id` on creator profile
4. Sales: `stripe.paymentIntents.create({ transfer_data: { destination: account_id }, application_fee_amount: feeInCents })`
5. Free tier: 8% fee deducted. Pro/Bundle: no fee.

### Storage
- Supabase Storage private buckets: `product-files`, `creator-avatars`, `course-videos-thumbnails`
- All paths prefixed with `{creatorId}/`
- Download delivery: server-side signed URL (24h expiry, download count limit enforced in DB)
- Never expose raw bucket paths to client

### Database Schema (high level)
- `creators` — profile, plan, stripe_account_id, subdomain, custom_domain, freelanceos_user_id
- `products` — type: `digital | course | booking | membership`, price, variants
- `courses` → `modules` → `lessons` (video: mux_asset_id, mux_playback_id)
- `orders` → `order_items`
- `bookings` → `availability_slots`
- `membership_tiers` → `member_subscriptions`
- `community_spaces` → `community_posts` → `community_replies`
- `email_subscribers` → `email_broadcasts` → `email_sequences`
- `analytics_events` — lightweight pageview + conversion tracking

---

## 7. Security

- All API routes: Supabase `getUser()` auth, never trust client user IDs
- RLS on all tables: `auth.uid() = creator_id`
- Stripe webhook: signature verification via `stripe.webhooks.constructEvent`
- File delivery: server-side signed URLs only, never expose raw storage paths
- MIME type validation server-side on upload (not just file extension)
- Max file size enforced server-side
- Rate limiting on checkout and auth endpoints (Vercel Edge middleware or Upstash)
- CSRF protection on all mutations
- Content Security Policy headers
- Custom domain DNS validation before activation
- No PII in logs

---

## 8. Responsive Design

- Mobile-first on all surfaces — storefront, checkout, dashboard
- Storefront optimized for phone (majority of creator traffic is mobile)
- Dashboard usable on tablet minimum
- Touch-friendly interactions (drag-and-drop, product reorder)

---

## 9. Landing Page

High-converting marketing LP — primary acquisition channel.

**Sections:**
1. Hero — headline, CTA ("Start free"), product mockup/screenshot
2. Social proof — logos or testimonials (placeholder until real users)
3. Features overview (storefront, products, courses, booking, community, email)
4. Pricing — 3 tiers with comparison table, FreelanceOS Bundle highlighted
5. FreelanceOS integration section — "Already on FreelanceOS? Get Pro for $9/mo"
6. FAQ
7. Final CTA

**Design:** Clean, modern, high-contrast — inspired by Linear, Vercel, Lemon Squeezy. Not generic SaaS template. Dark mode default with light toggle.

**SEO from day one:** Meta tags, OG images, JSON-LD, sitemap.xml, robots.txt.

---

## 10. FreelanceOS Integration

Activated when a FreelanceOS account shares the same email or is explicitly linked.

**In FreelanceOS:**
- "CreatorOS Revenue" dashboard widget (monthly revenue)
- Coaching session sold → auto-creates invoice in FreelanceOS
- Store customer → auto-added as CRM contact
- Revenue included in financial reports

**In CreatorOS:**
- `freelanceos_user_id` on creator profile → $9/mo Bundle auto-applied
- Import product catalogue from FreelanceOS
- Unified auth (same Supabase email, no second account)
- Badge "Powered by FreelanceOS" on storefront (optional, opt-in)

**Implementation:** Webhook-based sync in V1 (decoupled, each product stays independent). Shared Supabase project considered but deferred to V2 if needed.

---

## 11. Phasing

### Phase 1 — MVP (3-4 months)
- Auth + creator onboarding (Stripe Connect setup)
- Storefront (subdomain, customization, public page)
- Digital products (upload, checkout, Stripe Connect, email delivery)
- Basic analytics (revenue, sales)
- Free (8% fee) + Pro ($19/mo, 0% fee) billing
- Marketing LP
- Transactional emails (purchase confirmation, download link, welcome)
- Security: RLS, signed URLs, webhook verification, CSP

### Phase 2 — Retention (2-3 months)
- Online courses (Mux, modules, drip content)
- Email list + lead magnets + broadcasts
- Booking / coaching (calendar, Google Calendar sync, reminders)
- Custom domains (Vercel Domains API)

### Phase 3 — Differentiation (2-3 months)
- Memberships + community (forum)
- Email automations (sequences, segmentation)
- AutoDM Instagram
- FreelanceOS integration (widget, invoice sync, CRM sync)
- FreelanceOS Bundle pricing ($9/mo)

### Phase 4 — Scale (ongoing)
- Advanced analytics (funnel, attribution)
- Upsells / order bumps at checkout
- Affiliate program
- Public API

**Solo timeline:** Phase 1+2 ≈ 7 months. Phase 3 included ≈ 10-12 months.

---

## 12. Out of Scope (V1)

- Mobile app (web only)
- i18n / multi-language (English only at launch)
- Live streaming
- Marketplace / creator discovery
- White-label
- Team accounts / collaborators
