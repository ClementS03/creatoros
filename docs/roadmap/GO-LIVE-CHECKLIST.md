# CreatorOS — Go-Live Checklist

Everything to do once the domain is configured.

---

## 1. Domain & DNS

- [ ] Acheter domaine `creatoroshq.com` (ou confirmer si déjà acheté)
- [ ] Configurer DNS dans Vercel : `A` record + `CNAME` pour le root domain
- [ ] Activer les **sous-domaines wildcard** pour les storefronts créateurs :
  - Dans Vercel : ajouter `*.creatoroshq.com` comme domaine custom
  - Dans le DNS provider : `CNAME *.creatoroshq.com → cname.vercel-dns.com`
- [ ] Vérifier que `username.creatoroshq.com` fonctionne pour un créateur test

---

## 2. Supabase — Migrations SQL à appliquer

Appliquer dans l'ordre dans le SQL Editor Supabase :

```sql
-- 1. Fix RLS products (creator_id au lieu de email)
CREATE POLICY "products_creator_insert"
ON products FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- 2. Autoriser INSERT analytics pour visiteurs anonymes
CREATE POLICY "analytics_insert"
ON analytics_events FOR INSERT
WITH CHECK (true);

-- 3. Migration 006 — cover_image_url + compare_at_price sur products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS compare_at_price INTEGER;

-- 4. Table product_files (multi-fichiers)
CREATE TABLE IF NOT EXISTS product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_mime TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_files_creator" ON product_files
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_files.product_id
        AND p.creator_id = auth.uid()
    )
  );
```

---

## 3. Stripe — Configuration webhook

1. Dashboard Stripe → **Developers → Webhooks → Add endpoint**
2. URL : `https://creatoroshq.com/api/stripe/webhook`
3. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copier le **Signing secret** (commence par `whsec_`)
5. Ajouter dans Vercel env vars : `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Redéployer Vercel après ajout env var

---

## 4. Stripe — Connect settings

1. Dashboard Stripe → **Settings → Connect settings**
2. Redirect URI après onboarding : `https://creatoroshq.com/api/stripe/connect/return`
3. Activer le mode "Express accounts"

---

## 5. Supabase Auth — Email templates

Dans Supabase Dashboard → **Authentication → Email Templates** :

Remplacer les templates par défaut par les versions brandées (fichiers dans `docs/email-templates/`) :
- `confirm-signup.html` → template "Confirm your email"
- `magic-link.html` → template "Sign in to CreatorOS"

Pour les variables : `{{ .ConfirmationURL }}` reste la variable Supabase standard.

---

## 6. Resend — Configuration domaine

1. Dashboard Resend → **Domains → Add domain**
2. Ajouter `creatoroshq.com`
3. Configurer les DNS records DKIM/SPF/DMARC fournis par Resend
4. Vérifier le domaine
5. Les emails partiront de `hello@creatoroshq.com` (déjà configuré dans le code)

---

## 7. Variables d'environnement Vercel (vérification)

S'assurer que toutes ces vars sont présentes en production :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET          ← à ajouter après étape 3
RESEND_API_KEY
NEXT_PUBLIC_APP_URL=https://creatoroshq.com
```

---

## 8. Tests post-déploiement

- [ ] Créer un compte → recevoir email de confirmation branded
- [ ] Confirmer email → recevoir email de bienvenue avec checklist
- [ ] Configurer un username → `username.creatoroshq.com` accessible
- [ ] Connecter Stripe → compléter l'onboarding Express
- [ ] Créer un produit avec fichier + cover image
- [ ] Acheter le produit (test card `4242 4242 4242 4242`) → recevoir email avec download link
- [ ] Vérifier que les storefront views s'incrémentent en analytics
- [ ] Tester le billing Pro (upgrade → portail → downgrade)
