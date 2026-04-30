# LP Builder — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-04-30
**Status:** Approved for implementation planning
**Project:** CreatorOS

---

## Goal

Let creators build a full landing page per product, with drag-and-drop blocks, a split editor (form left / live preview right), and a responsive public-facing LP replacing the simple product page when configured.

---

## Architecture

### Data model

One new JSONB column on `products`. No new table.

```sql
-- Migration 013
ALTER TABLE products ADD COLUMN IF NOT EXISTS lp_blocks JSONB;
```

`lp_blocks` is an ordered array of block objects. `null` = LP not configured → show existing simple product page. Non-null = render full LP.

### Block schema (TypeScript)

```ts
type BlockType = "hero" | "features" | "testimonials" | "faq" | "text" | "video" | "image" | "cta";

type HeroBlock         = { id: string; type: "hero";         order: number; data: { headline: string; subheading: string; button_label: string } };
type FeaturesBlock     = { id: string; type: "features";     order: number; data: { title: string; items: { icon: string; title: string; description: string }[] } };
type TestimonialsBlock = { id: string; type: "testimonials"; order: number; data: { items: { quote: string; author: string; avatar_url?: string; rating: number }[] } };
type FAQBlock          = { id: string; type: "faq";          order: number; data: { items: { question: string; answer: string }[] } };
type TextBlock         = { id: string; type: "text";         order: number; data: { title?: string; body: string } };
type VideoBlock        = { id: string; type: "video";        order: number; data: { url: string; caption?: string } };
type ImageBlock        = { id: string; type: "image";        order: number; data: { url: string; caption?: string } };
type CTABlock          = { id: string; type: "cta";          order: number; data: { headline: string; button_label: string } };

type Block = HeroBlock | FeaturesBlock | TestimonialsBlock | FAQBlock | TextBlock | VideoBlock | ImageBlock | CTABlock;
```

**Rules:**
- `hero` is always at `order: 0`, locked (not deletable, not movable)
- `cta` is always last, locked
- All other blocks are freely orderable and deletable
- Multiple blocks of the same type are allowed (e.g. two testimonial sections)

### API

Add `lp_blocks` to the PATCH allowlist in `app/api/products/[id]/route.ts`. No new API route needed.

Auto-save: debounced PATCH 1s after any change.

---

## Editor

### Route

New page: `app/dashboard/products/[id]/landing-page/page.tsx`

Accessible via a **"Edit landing page"** button on the product edit page (`app/dashboard/products/[id]/page.tsx`).

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to product   "Ultimate Kit"   [Auto-saved ●]   [View LP ↗] │
├──────────────────────┬──────────────────────────────────────┤
│  BLOCK LIST          │  LIVE PREVIEW                        │
│  ─────────────────── │                                      │
│  ⋮⋮ 🏆 Hero     🔒  │  [scrollable preview of the LP]      │
│  ⋮⋮ ✨ Features  ✕   │  with real data from the forms       │
│  ⋮⋮ 🎥 Video    ✕   │                                      │
│  ⋮⋮ ⭐ Testimonials ✕│                                      │
│  ⋮⋮ ❓ FAQ       ✕   │                                      │
│  ⋮⋮ 🛒 CTA      🔒  │                                      │
│  ─────────────────── │                                      │
│  [+ Add block]       │                                      │
│  ─────────────────── │                                      │
│  EDIT: Hero          │                                      │
│  Headline: [input]   │                                      │
│  Subheading: [input] │                                      │
│  Button: [input]     │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

- Left panel: **300px fixed**, scrollable
- Right panel: **flex-1**, scrollable, shows LP preview iframe-like
- Header: back button, product name, auto-save indicator, "View LP" link

### Responsive (editor)

On mobile (`< lg`): two tabs — **"Blocks"** and **"Preview"** — instead of split layout.

### Block management

- **Add block**: click "+ Add block" → dropdown/modal showing all block types → click to add at the end (before CTA)
- **Reorder**: drag handle (`⋮⋮`) using `@dnd-kit/sortable` — hero and cta locked
- **Delete**: `✕` button → removes block (hero and cta have lock icon, no `✕`)
- **Edit**: click on a block row → form appears in the bottom of the left panel

### Per-block forms

**Hero**
- Headline (text input, required)
- Subheading (textarea)
- Button label (text input, default: "Buy now")

**Features**
- Section title (text input)
- Items list (repeater): icon (emoji picker or text input), title, description
- "+ Add item" button, remove per item
- Min 1 item, max 8

**Testimonials**
- Items list (repeater): quote (textarea), author name, avatar URL (optional), rating (1-5 stars selector)
- "+ Add testimonial", remove per item
- Min 1, max 10

**FAQ**
- Items list (repeater): question (input), answer (textarea)
- "+ Add question", remove per item
- Min 1, max 15

**Text**
- Title (optional text input)
- Body (textarea, supports line breaks)

**Video**
- URL (text input — YouTube or Vimeo)
- Caption (optional text input)
- Preview: extract thumbnail from URL and show it

**Image**
- Upload or URL input
- Caption (optional)

**CTA**
- Headline (text input)
- Button label (text input, default: "Buy now")

---

## Public LP rendering

### Route: `app/[username]/[productId]/page.tsx`

Current logic (simple page) stays unchanged if `lp_blocks` is null.

If `lp_blocks` is non-null and non-empty: render `<LandingPage blocks={lp_blocks} product={product} creator={creator} />` instead.

### `components/storefront/LandingPage.tsx`

Server component. Renders blocks in order. Each block type has its own renderer component in `components/storefront/blocks/`.

```
components/storefront/blocks/
  HeroBlock.tsx
  FeaturesBlock.tsx
  TestimonialsBlock.tsx
  FAQBlock.tsx
  TextBlock.tsx
  VideoBlock.tsx
  ImageBlock.tsx
  CTABlock.tsx
```

### Block rendering — responsive

All blocks are `max-w-3xl mx-auto px-4` centered, mobile-first.

**Hero:** Cover image top, headline, subheading, buy button (with promo code). On mobile: stacked vertically.

**Features:** 1 column on mobile → 2-3 columns on md+. Icon + title + description per item.

**Testimonials:** 1 column on mobile → 2 columns on md+. Card with quote, author, stars.

**FAQ:** Accordion (`<details>/<summary>`). Full width, no columns.

**Text:** Prose text, full width.

**Video:** Responsive 16:9 iframe embed (YouTube/Vimeo). On mobile: full width.

**Image:** Full width, rounded corners, optional caption below.

**CTA:** Centered headline + buy button. Full width background tint.

### Video URL parsing

Support:
- `youtube.com/watch?v=ID` → `youtube.com/embed/ID`
- `youtu.be/ID` → `youtube.com/embed/ID`
- `vimeo.com/ID` → `player.vimeo.com/video/ID`

---

## Drag-and-drop dependency

Install `@dnd-kit/core` and `@dnd-kit/sortable` (already in many Next.js projects, ~50KB).

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Out of scope (future)

- Rich text (bold, italic, links) in text blocks — plain text for now
- Image upload in blocks — URL only for V1 (avoid complexity)
- Block templates / presets
- Custom colors per block
- SEO meta per block
