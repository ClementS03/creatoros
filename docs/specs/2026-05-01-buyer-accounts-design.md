# Buyer Accounts — Design Spec

**Date:** 2026-05-01
**Status:** Approved for implementation

---

## Goal

Give buyers a persistent account so they can access their purchased courses (and other purchases) without losing access. No new auth infrastructure — reuse Supabase Auth with magic link.

---

## Architecture

Same Supabase Auth instance as creators. Buyers get a Supabase user created at purchase time. Distinction between creator and buyer: presence/absence of a row in the `creators` table. No new `buyers` table — buyer identity = their Supabase `auth.users` row, purchases = `orders` rows where `buyer_email = user.email`.

---

## Data model

No new tables. One migration adds `buyer_user_id` to orders for fast lookups:

```sql
-- Migration 015
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS orders_buyer_user_id_idx ON orders(buyer_user_id);
```

---

## Webhook update

After creating an order in `checkout.session.completed`:

1. Call `supabase.auth.admin.getUserByEmail(buyerEmail)`
2. If not found: `supabase.auth.admin.createUser({ email: buyerEmail, email_confirm: true })`
3. Update the order: `orders.set({ buyer_user_id: user.id })`

No welcome email sent at account creation — buyer already receives the purchase email.

---

## Buyer auth flow

### Login page: `app/portal/login/page.tsx`

- Simple form: email input + "Send magic link" button
- On submit: POST `/api/portal/auth/magic-link` → calls `supabase.auth.signInWithOtp({ email, redirectTo: '/portal' })`
- Shows "Check your inbox" confirmation

### API route: `app/api/portal/auth/magic-link/route.ts`

```ts
POST { email: string }
→ supabase.auth.signInWithOtp({ email, redirectTo: `${APP_URL}/portal` })
→ 200 OK
```

Uses the **anon** Supabase client (public route, no auth required).

### Auth callback: `app/portal/auth/callback/route.ts`

Handles the `?code=` redirect from Supabase magic link:

```ts
const { code } = searchParams
await supabase.auth.exchangeCodeForSession(code)
redirect('/portal')
```

---

## Buyer portal: `app/portal/page.tsx`

Server component. Requires buyer session (redirect to `/portal/login` if none).

Queries:
```ts
const { data: { user } } = await supabase.auth.getUser()
// user.email is guaranteed — Supabase magic link always sets email

const { data: orders } = await supabase
  .from("orders")
  .select("id, product_id, amount_paid, currency, created_at, products(id, name, cover_image_url, type)")
  .eq("buyer_email", user.email)
  .order("created_at", { ascending: false })
```

Displays:
- Grid of purchased products (cover image, name, price paid, date)
- "Access course" button for `type = "course"` → `/course/[productId]`
- "Download" button for `type = "digital"` → existing download flow

### Guard helper: `lib/buyer-auth.ts`

```ts
export async function requireBuyer(supabase): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')
  // Ensure not a creator trying to access portal
  return user
}
```

---

## Navigation

- Footer on storefront pages: "Access your purchases →" link to `/portal`
- After purchase email: add "Access your account" link to `/portal`

---

## Out of scope

- Password-based auth
- Social OAuth for buyers
- Account settings / profile editing
- "My purchases" notification emails
