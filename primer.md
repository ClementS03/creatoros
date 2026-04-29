# Primer — CreatorOS
_Dernière mise à jour : 2026-04-29_

## État actuel

Phase 1 MVP complet, déployé, infrastructure entièrement configurée.

- Supabase ✅ — projet live, 4 migrations appliquées, storage configuré
- Stripe ✅ — Connect Express fonctionnel, Pro price créé, webhook live
- Google OAuth ✅ — projet Google séparé de FreelanceOS
- Vercel ✅ — déployé, domaine creatoroshq.com + wildcard *.creatoroshq.com

## Bugs corrigés (session 2026-04-27/28)

- `stripe_account_enabled` inexistant → remplacé par `stripe_account_id`
- Création du creator record en lazy init dans le layout dashboard
- Page edit produit corrigée
- Sidebar collapsible ajoutée
- Widget statut Stripe Connect dans la page billing

## Blockers actuels

Aucun. Prêt pour Phase 2.

## Next steps (Phase 2)

1. Courses — upload vidéo (Mux ou Cloudflare Stream), modules, lessons
2. Coaching & booking — créneaux calendar, paiement Stripe à la réservation
3. Email list — lead magnets, broadcasts Resend
4. Custom domain — UI existe, DNS CNAME pas encore câblé
5. Avatar upload UI — champ `creators.avatar_url` existe en DB, pas de formulaire

## Décisions techniques

- Stack : Next.js 15 + Supabase + Stripe Connect + Resend + shadcn/ui
- Pas d'i18n — English only
- Free : 8% commission, max 3 produits / Pro : 0%, illimité, $19/mo
- Subdomain routing via middleware (`username.creatoroshq.com`)
- Google OAuth : projet séparé de FreelanceOS (recommandé, pas de conflit)
