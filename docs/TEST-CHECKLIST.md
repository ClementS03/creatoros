# CreatorOS — Test Checklist

> Updated after each feature delivery. Check items manually in browser.
> Test card Stripe: `4242 4242 4242 4242` exp `12/34` cvv `123`

---

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
- [ ] "Create new product" → modal opens, creates draft product and adds it as bump

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

---

## LP Builder (`/dashboard/products/[id]/landing-page`)

- [ ] "Edit landing page" button visible on product edit page
- [ ] Editor opens with default hero + cta blocks
- [ ] Hero and CTA blocks show lock icon — cannot be deleted or dragged
- [ ] Click "+ Add block" → dropdown shows all 6 addable types
- [ ] Add Features block → appears in list, form shows below
- [ ] Fill in Features items → live preview updates
- [ ] Drag a block → reorders, order preserved
- [ ] Cannot drag to position 0 (hero) or last (cta)
- [ ] Delete a non-locked block → removed from list and preview
- [ ] Auto-save fires 1s after any change (spinner then checkmark)
- [ ] Click "View" → product page opens with full LP
- [ ] Mobile: Blocks and Preview tabs work
- [ ] Public LP renders all 8 block types correctly
- [ ] Video block: YouTube URL → embeds correctly
- [ ] Video block: invalid URL → block not rendered
- [ ] If lp_blocks null → simple product page shown (no regression)

---

## Bundles (`/dashboard/products/bundle`)

- [ ] "Create bundle" button visible in products list
- [ ] Select < 2 products → error "at least 2 products"
- [ ] Select 2+ products → pricing summary shows individual value + savings %
- [ ] Create bundle → appears in list with "Bundle" badge
- [ ] Filter tab "Bundles" shows only bundles
- [ ] Bundle not shown in product selection when creating another bundle
- [ ] Bundle page on storefront shows normally with price
- [ ] Buy bundle → Stripe checkout shows bundle price
- [ ] After purchase → download page shows files grouped by product name
- [ ] Each file in bundle downloads correctly

---

## Product page (`/[username]/[productId]`)

- [ ] Click product name on storefront → opens dedicated product page
- [ ] Direct URL works: `username.creatoroshq.com/username/[id]`
- [ ] Cover image shows large (square aspect ratio)
- [ ] Full description displayed (not truncated)
- [ ] Price + discount badge shown
- [ ] Paid product: Buy button with promo code field works
- [ ] Lead magnet: "Get for free" opens modal
- [ ] "Back to [creator name]" link returns to storefront
- [ ] Non-existent product → 404
- [ ] Unpublished product → 404
- [ ] OG meta tags correct (title, description, image) for social sharing

---

## Discount codes (`/dashboard/discount-codes`)

- [ ] Create percentage code (e.g. `SUMMER20` → 20%)
- [ ] Create fixed amount code (e.g. `5OFF` → $5 off)
- [ ] Code auto-uppercased, invalid chars stripped
- [ ] Duplicate code → "Code already exists" error
- [ ] Set usage limit → respects limit after N uses
- [ ] Set expiry date → expired code rejected
- [ ] Copy button copies code to clipboard
- [ ] Delete code → disappears from list

### On storefront

- [ ] "Have a promo code?" link appears under Buy button
- [ ] Enter valid code → "SUMMER20 applied (-20%)" shown, price updates
- [ ] Enter invalid code → error message shown
- [ ] Enter expired code → error message shown
- [ ] Buy with discount applied → Stripe checkout shows discounted price
- [ ] After purchase → `used_count` increments on code

---

## Auth

- [ ] Sign up with email → receive branded confirmation email
- [ ] Click confirmation link → redirected to dashboard
- [ ] Receive branded welcome email with onboarding checklist
- [ ] Sign in with magic link → receive branded email
- [ ] Sign in with Google OAuth
- [ ] Logout button works → redirected to login

---

## Storefront settings (`/dashboard/storefront`)

- [ ] Save username with hyphens (`my-brand`) → works
- [ ] Save username with underscores → works
- [ ] Username too short → error shown
- [ ] Username already taken → error shown
- [ ] Save bio + brand color
- [ ] "View storefront" button → opens correct URL

---

## Products (`/dashboard/products`)

- [ ] Create paid product → required fields \* marked
- [ ] Submit without description → validation error
- [ ] Submit without file → validation error
- [ ] Upload cover image → thumbnail shows on left in form
- [ ] Upload multiple files → all listed
- [ ] Set discount % → live preview shows struck price + badge
- [ ] Publish product → badge changes to Published
- [ ] Filter tabs: All / Paid / Free work correctly
- [ ] Lead magnet badge shows in list for free products
- [ ] Duplicate product → "(Copy)" appears as draft
- [ ] Edit product → changes saved

### Lead magnet

- [ ] Toggle "This is a lead magnet" → price field hides
- [ ] Write custom welcome email (subject + body with `{{name}}` and `{{download_link}}`)
- [ ] Publish lead magnet
- [ ] Storefront shows "Free" badge + "Get for free" button
- [ ] Click "Get for free" → modal opens with name + email fields
- [ ] Submit modal → "Check your inbox!" confirmation
- [ ] Receive welcome email with download link
- [ ] Download link works → file downloads
- [ ] Unsubscribe link in email → "You've been unsubscribed" page
- [ ] Subscriber appears in Audience page

---

## Audience (`/dashboard/audience`)

- [ ] Subscriber from lead magnet shows with source "lead magnet"
- [ ] Buyer shows with source "purchase" (requires Stripe webhook)
- [ ] Filter tabs: All / Buyers / Lead magnet / Newsletter
- [ ] Search by name or email
- [ ] Export CSV → downloads file with correct columns
- [ ] Unsubscribe row action → marks as unsubscribed

### Broadcast (`/dashboard/audience/broadcast`)

- [ ] Select segment → dropdown works
- [ ] Write subject + body → live preview updates
- [ ] Click "Review and send" → confirmation modal with recipient count
- [ ] Confirm → emails sent, toast success
- [ ] Sent broadcast appears in history on Audience page
- [ ] Received email contains unsubscribe link
- [ ] `{{name}}` variable replaced correctly

---

## Email settings (`/dashboard/settings/email`)

- [ ] Update From name → saved, future emails use new name
- [ ] From address shows `hello@creatoroshq.com` (default)
- [ ] Custom domain flow (requires own domain + Full access Resend key):
  - [ ] Enter domain → DNS records displayed
  - [ ] Add records in DNS provider
  - [ ] Click "Verify DNS" → verified ✅
  - [ ] From address updates to `hello@yourdomain.com`

---

## Stripe Connect (`/dashboard/settings/billing`)

- [ ] Click "Connect Stripe" → redirected to Stripe Express
- [ ] Return mid-flow → Stripe Connect banner still shows
- [ ] Billing shows "Pending verification" + "Start over" (incomplete)
- [ ] Click "Start over" → inline confirm (no browser alert)
- [ ] Complete Stripe onboarding → banner disappears, billing shows "Active"
- [ ] Click "Disconnect" on active → inline confirm

---

## Checkout (requires Stripe webhook configured)

- [ ] Click "Buy" on a product → redirected to Stripe Checkout
- [ ] Pay with test card → redirected to success page
- [ ] Success page shows "Download now" button (not just "Back to home")
- [ ] Download link works
- [ ] Buyer receives purchase email with download link
- [ ] Buyer appears in Audience as source "purchase"
- [ ] Analytics: storefront views increment on visit
- [ ] Analytics: revenue chart shows sale

---

## Billing (`/dashboard/settings/billing`)

- [ ] Upgrade to Pro → redirected to Stripe Checkout
- [ ] Pro badge shows after upgrade
- [ ] "Manage subscription" button → Stripe portal
- [ ] Downgrade via portal → back to Free plan

---

## Storefront (public, anonymous)

- [ ] `username.creatoroshq.com` loads correctly
- [ ] Paid products show price + Buy button
- [ ] Lead magnet products show Free badge + Get for free button
- [ ] Discount badge shows when discount set
- [x] Cover image shows on left side of card
- [ ] Social links show if configured
- [ ] Analytics view tracked on each visit

---

## Go-live checklist (pending)

- [x] Apply migrations 007-010 in Supabase SQL Editor → **done per user**
- [x] Apply products RLS fix SQL
- [x] Apply analytics_insert policy SQL
- [ ] Configure Stripe webhook endpoint in Stripe dashboard
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Configure `*.creatoroshq.com` wildcard DNS
- [ ] Verify Resend domain for `creatoroshq.com`
- [ ] Upgrade Resend to Pro for unlimited domains (when needed)
- [ ] Test full purchase flow end-to-end in production
