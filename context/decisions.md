# Decisions — CreatorOS

## 2026-04-28 — Storage : limites actuelles et roadmap

**Décision actuelle :** Supabase Storage free tier
- `products` bucket (privé) — max 50MB/fichier (limite free tier)
- `avatars` bucket (public) — max 2MB/fichier (validation côté code)
- Validation : `validateUpload()` pour produits, `validateAvatarUpload()` pour avatars

**Pourquoi 50MB pour les produits :** Supabase free = limite fixe 50MB/upload.
Pro Supabase = configurable jusqu'à 500GB, mais pas justifié sans users.

**Roadmap storage (à implémenter quand la base users grandit) :**
1. **Upgrade Supabase Pro** → 500GB upload limit, suffisant pour ebooks, presets, packs de ressources
2. **Pour les vidéos / formations** → ne pas stocker dans Supabase. Utiliser :
   - **Mux** (video hosting + streaming HLS, pay-per-minute) — recommandé
   - **Cloudflare Stream** (moins cher, $5/1000min stockées)
   - Les vidéos seraient un nouveau type de produit `"video"` avec `mux_asset_id` à la place de `file_path`
3. **Plan "Creator Pro Max"** (hypothétique) — si les créateurs ont besoin de beaucoup de stockage,
   facturer au GB supplémentaire ou créer un 3ème plan.

**Ne pas faire avant d'avoir des utilisateurs** : toute infrastructure vidéo est du sur-engineering prématuré.
