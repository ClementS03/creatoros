# Architecture — CreatorOS

## Routing
- `creatoroshq.com` → marketing LP + dashboard auth
- `username.creatoroshq.com` → storefront public (géré par middleware.ts)
- `/dashboard/*` → interface créateur (auth guard dans middleware)

## Auth
- Supabase Auth (Google OAuth + email/password)
- Trigger SQL `on_auth_user_created` auto-crée le profil `creators` à l'inscription
- Username généré automatiquement depuis email ou full_name

## Stripe Connect
- Express accounts — les créateurs connectent leur Stripe
- `stripe_account_id` stocké sur `creators`
- Checkout via `transfer_data.destination` + `application_fee_amount`
- Fee : 8% plan free, 0% plan pro

## Storage
- Bucket `products` (privé) — fichiers produits, accès via signed URLs
- Bucket `avatars` (public) — photos de profil créateurs

## Plans
| Plan | Prix | Produits | Commission |
|------|------|----------|------------|
| free | $0   | 3 max    | 8%         |
| pro  | $19/mo | illimité | 0%       |

## Tables principales
- `creators` — profil créateur (plan, stripe_account_id, username, brand_color...)
- `products` — produits digitaux (name, price, file_path, download_limit...)
- `orders` — achats (product_id, buyer_email, amount_paid, platform_fee...)
- `analytics_events` — events (view, purchase) par créateur/produit
