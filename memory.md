# Memory — CreatorOS

## 2026-04-25 — d133545
**Changements :** Bootstrap depuis ShipFast (ship-fast-ts-supabase), suppression DaisyUI, ajout shadcn/ui + vitest
**Pourquoi :** Base propre pour le projet
**Impact :** Stack figée : Next.js 15, Supabase, TypeScript, Tailwind, shadcn/ui

---

## 2026-04-25 — 095bb0c
**Changements :** Fix type Supabase setAll cookie callback
**Pourquoi :** Erreur TypeScript sur le helper SSR
**Impact :** /

---

## 2026-04-25 — 365667d
**Changements :** Types TypeScript core (Creator, Product, Order, AnalyticsEvent, PlanLimits)
**Pourquoi :** Types partagés utilisés dans toute l'app
**Impact :** Base pour toutes les API routes et composants

---

## 2026-04-25 — 96a33ae
**Changements :** Middleware subdomain routing + dashboard auth guard
**Pourquoi :** `username.creatoroshq.com` → storefront, apex → marketing/dashboard
**Impact :** Toute la navigation de l'app dépend de ce middleware

---

## 2026-04-25 — 5e332a1
**Changements :** Migrations SQL 001-004 (creators, products, orders, analytics) + RLS + trigger auto-création profil
**Pourquoi :** Schéma BDD complet Phase 1
**Impact :** À appliquer dans l'ordre dans Supabase SQL Editor

---

## 2026-04-25 — b05a84c
**Changements :** Auth flow — login, signup, Google OAuth callback
**Pourquoi :** Entry point utilisateur
**Impact :** /

---

## 2026-04-25 — 82d1727
**Changements :** Plan limits (free: 3 produits, 8% fee / pro: illimité, 0%) + tests Vitest
**Pourquoi :** Gating des features selon le plan
**Impact :** Utilisé dans products API et checkout

---

## 2026-04-25 — b3a8028
**Changements :** Stripe lib + calculatePlatformFee() + apiVersion 2025-02-24.acacia
**Pourquoi :** Instance Stripe partagée + calcul de la commission plateforme
**Impact :** Utilisé partout dans les API Stripe

---

## 2026-04-25 — 8529159
**Changements :** Stripe Connect onboarding routes (POST + return)
**Pourquoi :** Les créateurs doivent connecter leur compte Stripe pour recevoir des paiements
**Impact :** stripe_account_id stocké sur le creator

---

## 2026-04-25 — a5cc710
**Changements :** Dashboard layout + sidebar
**Pourquoi :** Shell de l'interface créateur
**Impact :** /

---

## 2026-04-25 — b3a8028
**Changements :** Storefront API (PATCH settings) + page publique + StorefrontPage + ProductCard + dashboard settings
**Pourquoi :** Page publique accessible sur username.creatoroshq.com
**Impact :** Dépend du subdomain middleware

---

## 2026-04-25 — 1992ca8
**Changements :** File upload avec validation MIME + signed URLs Supabase Storage
**Pourquoi :** Stockage sécurisé des fichiers produits
**Impact :** Bucket `products` (privé) requis dans Supabase Storage

---

## 2026-04-25 — 96ae341
**Changements :** Stripe Connect checkout flow + CheckoutButton
**Pourquoi :** Paiement avec application_fee_amount pour la commission plateforme
**Impact :** /

---

## 2026-04-25 — 6ac9e2d
**Changements :** Download sécurisé avec vérification de la commande + compteur de téléchargements
**Pourquoi :** Le fichier ne doit être accessible qu'après achat vérifié
**Impact :** /

---

## 2026-04-25 — 257f1a9
**Changements :** Products CRUD API + dashboard UI
**Pourquoi :** Gestion des produits par le créateur
**Impact :** Limite à 3 produits sur plan free

---

## 2026-04-25 — 6a0ad94
**Changements :** Pro subscription + billing portal
**Pourquoi :** Upgrade vers le plan Pro via Stripe
**Impact :** STRIPE_PRO_PRICE_ID requis en env var

---

## 2026-04-25 — f0ae294
**Changements :** Stripe webhook handler + envoi email post-achat
**Pourquoi :** checkout.session.completed → créer order + envoyer lien de téléchargement
**Impact :** STRIPE_WEBHOOK_SECRET requis + webhook à enregistrer dans Stripe Dashboard

---

## 2026-04-25 — ccfdf47
**Changements :** Analytics API + dashboard home + page analytics complète
**Pourquoi :** Suivi revenus, ventes, vues
**Impact :** /

---

## 2026-04-25 — cb5c645
**Changements :** PostHog EU + Vercel Analytics
**Pourquoi :** Analytics produit
**Impact :** NEXT_PUBLIC_POSTHOG_KEY requis

---

## 2026-04-25 — f0ae294
**Changements :** Landing page marketing — Hero, Features, Pricing, FAQ
**Pourquoi :** Page d'acquisition
**Impact :** /

---

## 2026-04-25 — 9b62dd2
**Changements :** vercel.json (security headers) + cleanup final
**Pourquoi :** Préparation au déploiement
**Impact :** /

---

## 2026-04-27 — 9dcabd1
**Changements :** CLAUDE.md + .claude/settings.local.json
**Pourquoi :** Contexte projet et permissions pour Claude Code
**Impact :** /
