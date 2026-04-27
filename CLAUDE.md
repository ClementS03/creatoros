# CreatorOS — Claude Instructions

## Project
Stan.store alternative — creator monetization platform. Solo founder: Clément.

## Stack
Next.js 15 App Router · Supabase · TypeScript · Tailwind · shadcn/ui · Stripe Connect · Resend · Vitest

## Key conventions
- All UI strings in **English only** — never French
- Amounts in **cents** (integers), never floats
- No `Co-Authored-By` in commits — Clément is sole author
- Use RTK prefix for all terminal commands: `rtk git`, `rtk tsc`, `rtk vitest`, etc.
- Migrations applied via **Supabase MCP** (`mcp__claude_ai_Supabase__apply_migration`), never manually
- API routes: always verify auth, use allowlist for PATCH fields
- Plans: `free` (8% platform fee, 3 products max) · `pro` ($19/mo, 0% fee, unlimited)

## Architecture
- Subdomain routing: `username.creatoroshq.com` → storefront, `creatoroshq.com` → dashboard/marketing
- Middleware handles subdomain detection and dashboard auth guard
- Stripe Connect Express for creator payouts + `application_fee_amount` for platform fee
- Storage buckets: `products` (private, signed URLs) · `avatars` (public)

## Env vars required
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
STRIPE_PRO_PRICE_ID, RESEND_API_KEY, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

## Tests
`rtk vitest run` — all tests must pass before committing
