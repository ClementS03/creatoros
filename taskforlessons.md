# Lessons — CreatorOS

## RÈGLE : Stripe apiVersion
**POURQUOI :** `"2025-03-31.basil"` n'est pas valide, cause une erreur runtime
**FAIRE :** Utiliser `"2025-02-24.acacia"`
**NE PAS FAIRE :** Utiliser une version inventée ou trop récente

---

## RÈGLE : Stripe.CheckoutSession vs Stripe.Checkout.Session
**POURQUOI :** `Stripe.CheckoutSession` n'existe pas en TypeScript, erreur de compilation
**FAIRE :** `event.data.object as Stripe.Checkout.Session`
**NE PAS FAIRE :** `event.data.object as Stripe.CheckoutSession`

---

## RÈGLE : Pas de Co-Authored-By dans les commits
**POURQUOI :** Clément est le seul auteur crédité
**FAIRE :** Commits sans trailer Co-Authored-By
**NE PAS FAIRE :** Ajouter `Co-Authored-By: Claude <noreply@anthropic.com>`

---
