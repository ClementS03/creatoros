# Primer — CreatorOS
_Dernière mise à jour : 2026-04-27_

## État actuel
Phase 1 MVP complet et pushé sur GitHub (ClementS03/creatoros). Tous les tests passent.

## Blockers
Infrastructure non configurée — 3 étapes manuelles à faire dans l'ordre :
1. **Supabase** — nouveau projet, 4 migrations SQL, 2 storage buckets, auth redirect URLs
2. **Stripe** — créer prix Pro ($19/mo), enregistrer webhook, copier les clés
3. **Vercel** — déployer depuis GitHub, env vars, domaine + wildcard `*.creatoroshq.com`

## Next steps
1. Clément crée le projet Supabase et partage les 3 clés
2. Puis Stripe : prix Pro + webhook
3. Puis Vercel : déploiement + env vars + domaine

## Décisions récentes
- Stack confirmée : Next.js 15 + Supabase + Stripe Connect + Resend + shadcn/ui
- Pas d'i18n — English only
- Plan free : 8% commission, max 3 produits / Plan pro : 0%, illimité, $19/mo
- Subdomain routing via middleware Next.js (`username.creatoroshq.com`)
