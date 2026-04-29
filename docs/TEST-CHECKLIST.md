# CreatorOS — Test Checklist

> Updated after each feature delivery. Check items manually in browser.
> Test card Stripe: `4242 4242 4242 4242` exp `12/34` cvv `123`

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

- [ ] Create paid product → required fields * marked
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
- [ ] Cover image shows on left side of card
- [ ] Social links show if configured
- [ ] Analytics view tracked on each visit

---

## Go-live checklist (pending)

- [ ] Apply migrations 007-010 in Supabase SQL Editor → **done per user**
- [ ] Apply products RLS fix SQL
- [ ] Apply analytics_insert policy SQL
- [ ] Configure Stripe webhook endpoint in Stripe dashboard
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Configure `*.creatoroshq.com` wildcard DNS
- [ ] Verify Resend domain for `creatoroshq.com`
- [ ] Upgrade Resend to Pro for unlimited domains (when needed)
- [ ] Test full purchase flow end-to-end in production
