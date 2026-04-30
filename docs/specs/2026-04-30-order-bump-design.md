# Order Bump — Design Spec

**Date:** 2026-04-30
**Status:** Approved for implementation

---

## Goal

Let creators add up to 5 order bumps to a product. Buyers see them before checkout on the product/LP page, can select any combination, and pay a single total. If all bumps are selected, a special bundle price applies.

---

## Data model

One new JSONB column on `products`. No new table.

```sql
-- Migration 014
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_bumps JSONB;
```

`order_bumps` structure:

```ts
type OrderBumpItem = {
  product_id: string;   // references another product from same creator
  custom_price: number; // price in cents for this bump (overrides product price)
  label: string;        // short sales label, e.g. "Add the Bonus Pack"
};

type OrderBumps = {
  items: OrderBumpItem[];
  bundle_price: number | null; // price in cents if ALL bumps selected — null = no bundle deal
};
```

`null` = no order bumps configured. Max 5 items in `items`.

---

## API

Add `order_bumps` to PATCH allowlist in `app/api/products/[id]/route.ts`.

New route `app/api/products/[id]/bump-products/route.ts`:
- GET: returns creator's other published products (for the "pick a bump" dropdown)

Update `app/api/stripe/create-checkout/route.ts`:
- Accept `bumpProductIds: string[]` in body
- Resolve bump prices from `order_bumps.items` (or `bundle_price` if all selected)
- Pass `bumpProductIds` as JSON string in Stripe session metadata

Update `app/api/stripe/webhook/route.ts`:
- On `checkout.session.completed`: parse `bumpProductIds` from metadata, create an order record per bump product

---

## Dashboard — Product edit page

New `<OrderBumpsEditor>` section in `app/dashboard/products/[id]/page.tsx`, rendered below `<ProductForm>`.

### OrderBumpsEditor component (`components/products/OrderBumpsEditor.tsx`)

Client component. Fetches `order_bumps` from product, lets creator:

1. **Add bump** — dropdown list of their other products. Selecting one adds it with `custom_price = product.price`, editable label pre-filled as product name.
2. **Inline create** — "Create new product" option in the dropdown → opens a minimal modal (name + price + file upload via existing upload flow) → saves new product → adds it as bump automatically.
3. **Per-item editing** — label input + price input (in dollars, stored as cents).
4. **Bundle price** — "Bundle price if all selected" number input. Shows savings % vs sum of individual.
5. **Remove bump** — × button per row.
6. **Save** — auto-save via debounced PATCH 1s after any change.

Max 5 bumps enforced in UI (add button hidden at 5).

---

## Storefront — CheckoutButton / ProductPageClient

When `product.order_bumps?.items.length > 0`:

Show an `<OrderBumpsSelector>` component below the buy button (`components/storefront/OrderBumpsSelector.tsx`).

- Each bump: checkbox + label + price badge
- When all checked: show bundle price + savings badge, total updates
- When partial: total = main price + sum of checked bump prices
- Price summary line above the buy button: "Total: $XX"
- Checking/unchecking bumps updates the price shown on the buy button
- On "Buy now": calls create-checkout with `bumpProductIds` array of checked bump IDs

---

## Checkout flow

`create-checkout`:
1. Parse `bumpProductIds: string[]` from request body
2. Fetch `order_bumps` from main product
3. Calculate bump total:
   - If `bumpProductIds.length === order_bumps.items.length` and `bundle_price != null` → use `bundle_price`
   - Else → sum `custom_price` for each selected bump item
4. `unit_amount = mainPrice + bumpTotal`
5. Store `bumpProductIds: JSON.stringify(bumpProductIds)` in Stripe metadata

Webhook (`checkout.session.completed`):
1. Parse `bumpProductIds` from metadata
2. For each bump product ID: create an order record (`amount_paid: 0` — bump price is included in main order total, or allocate proportionally — keep it simple: `amount_paid: 0` for bumps)
3. Buyer receives download email listing all files (main + bumps)

Download page: already groups files by product — bump products appear as additional sections automatically.

---

## Out of scope

- Per-bump discount codes
- Bump-only products visible on storefront
- Time-limited bump offers (countdown timer)
- Analytics per bump conversion rate
