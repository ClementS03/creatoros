# Video Courses — Design Spec

**Date:** 2026-05-01
**Status:** Approved for implementation
**Depends on:** Buyer Accounts spec (2026-05-01)

---

## Goal

Let creators build video courses (sections + lessons with YouTube/Vimeo embeds), sell them as products, and give buyers a gated course player with progress tracking and optional drip content. Creators can manually unlock lessons for individual buyers.

---

## Data model

### Migrations 016–018

```sql
-- 016: course product type
ALTER TABLE products ADD COLUMN IF NOT EXISTS type_v2 TEXT;
-- products.type is already 'digital' for all existing. New courses use type = 'course'.
-- No migration needed for type column — it already accepts any text.

-- 016: course structure
CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  drip_days INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 017: progress + manual unlocks
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(buyer_email, lesson_id)
);

CREATE TABLE lesson_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_email, lesson_id)
);
```

### RLS policies

- `course_sections`, `course_lessons`: readable by anyone (lesson content is gated in the player, not at DB level). Writable only by authenticated creator who owns the product.
- `lesson_progress`: readable/writable by buyer (matched by `buyer_email = auth.jwt()->>'email'`).
- `lesson_unlocks`: readable by buyer and creator. Writable by creator only.

---

## Product type

Add `"course"` to `ProductType` in `types/index.ts`:

```ts
export type ProductType = "digital" | "course";
```

Course products are created the same way as digital products — same form, same Stripe checkout. The "course" type unlocks the course editor and player instead of file download.

---

## Video URL parsing

Reuse `parseVideoUrl()` from `lib/lp-utils.ts` (already supports YouTube + Vimeo).

For progress auto-detection:
- **YouTube**: `youtube.com/embed/ID?enablejsapi=1` → listen for `postMessage` `{"event":"onStateChange","info":0}` (state 0 = ended)
- **Vimeo**: `player.vimeo.com/video/ID` → listen for `postMessage` `{"method":"addEventListener","value":"finish"}`

---

## Dashboard — Course editor

### Route: `app/dashboard/products/[id]/course/page.tsx`

Accessible via "Edit course" button on the product edit page (same pattern as "Edit landing page").

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back   "Mon cours React"   [Auto-saved ●]   [View ↗] │
├──────────────────────┬──────────────────────────────────┤
│  COURSE STRUCTURE    │  EDIT: Leçon 2                   │
│  ─────────────────── │  Title: [input]                  │
│  ▼ Section 1    ✕    │  Video URL: [input]              │
│    ⋮ Leçon 1    ✕    │  Description: [textarea]        │
│    ⋮ Leçon 2 ←  ✕    │  Drip: [0] days after purchase  │
│  [+ Add lesson]      │                                  │
│  ▼ Section 2    ✕    │                                  │
│    ⋮ Leçon 3    ✕    │                                  │
│  [+ Add section]     │                                  │
└──────────────────────┴──────────────────────────────────┘
```

- Left: tree of sections + lessons, drag handles (dnd-kit), add/delete
- Right: form for currently selected lesson or section
- Auto-save: debounced PATCH to `/api/courses/[productId]/structure` 1s after change

### Components

- `app/dashboard/products/[id]/course/page.tsx` — client component, full editor
- `components/course-editor/SectionList.tsx` — dnd-kit sortable sections + lessons
- `components/course-editor/LessonForm.tsx` — title, video URL, description, drip days

### API

```
GET  /api/courses/[productId]/structure   → { sections: [{id, title, lessons: [...]}] }
PUT  /api/courses/[productId]/structure   → full replace of sections+lessons (idempotent)
```

`PUT` receives the entire course tree and diffs/upserts. Simpler than PATCH per lesson.

---

## Dashboard — Students (manual unlock)

### Route: `app/dashboard/courses/[productId]/students/page.tsx`

Listed from `orders` where `product_id = productId`. Shows:
- Buyer email, purchase date
- Progress: "X/Y lessons completed"
- "Unlock all" button → inserts `lesson_unlocks` for all lessons for this buyer
- Per-section expand → per-lesson unlock toggle

### API

```
GET  /api/courses/[productId]/students            → list of buyers + progress
POST /api/courses/[productId]/students/unlock     → { buyerEmail, lessonIds: string[] | "all" }
DELETE /api/courses/[productId]/students/unlock   → { buyerEmail, lessonIds: string[] | "all" }
```

---

## Public course player

### Route: `app/course/[productId]/page.tsx`

Requires buyer auth (redirect to `/portal/login?next=/course/[productId]`).

Verifies buyer has purchased: query `orders` where `product_id = productId AND buyer_email = user.email`.

### Layout (desktop)

```
┌──────────────────────────────────────────────────────────┐
│  ← Portal   "Mon cours React"          2/8 ██░░░░░░ 25% │
├─────────────────┬────────────────────────────────────────┤
│  COURSE OUTLINE │  [VIDEO EMBED 16:9]                    │
│                 │                                        │
│  ▼ Section 1    │  Leçon 2 — Introduction à React       │
│  ✅ Leçon 1     │  Description de la leçon...           │
│  ▶ Leçon 2 ←   │                                        │
│  🔒 Leçon 3    │  [✓ Mark as complete]  [→ Next lesson] │
│                 │                                        │
│  ▼ Section 2    │                                        │
│  ○ Leçon 4     │                                        │
│  ○ Leçon 5     │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Mobile

Two tabs: **"Lessons"** and **"Player"** — same pattern as LP editor.

### Lesson availability logic

```ts
function isLessonAvailable(
  lesson: CourseLesson,
  orderCreatedAt: Date,
  unlocks: Set<string> // lesson IDs manually unlocked
): boolean {
  if (unlocks.has(lesson.id)) return true;
  if (lesson.drip_days === 0) return true;
  const unlockDate = new Date(orderCreatedAt);
  unlockDate.setDate(unlockDate.getDate() + lesson.drip_days);
  return new Date() >= unlockDate;
}
```

### Progress API

```
GET  /api/courses/[productId]/progress   → { completedLessonIds: string[] }
POST /api/courses/[productId]/progress   → { lessonId: string, completed: boolean }
```

Requires buyer session. Validates buyer has purchased the course.

### Auto-complete (video end detection)

Client component `<CourseVideoPlayer>` wraps the iframe:

```ts
// YouTube: listen for onStateChange=0 (ended)
window.addEventListener('message', (e) => {
  if (e.data?.event === 'onStateChange' && e.data?.info === 0) {
    markComplete(lessonId)
  }
})

// Vimeo: listen for finish event
window.addEventListener('message', (e) => {
  try {
    const data = JSON.parse(e.data)
    if (data.event === 'finish') markComplete(lessonId)
  } catch {}
})
```

---

## Storefront changes

- Product card: "course" type shows "Enroll now" instead of "Buy now"
- After purchase: email contains "Access your course" link → `/course/[productId]` (buyer needs to log in first or already has session)
- Download page: for `type = "course"`, redirect to `/course/[productId]` instead of showing files

---

## Types

```ts
// types/index.ts additions
export type CourseSection = {
  id: string;
  product_id: string;
  title: string;
  sort_order: number;
  lessons?: CourseLesson[];
};

export type CourseLesson = {
  id: string;
  section_id: string;
  product_id: string;
  title: string;
  video_url: string | null;
  description: string | null;
  drip_days: number;
  sort_order: number;
};

export type LessonProgress = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};
```

---

## Out of scope

- Direct video upload (Mux, Bunny CDN)
- Downloadable resources per lesson
- Quizzes / certificates
- Comments per lesson
- Course preview (free first lesson) — add in next iteration
- Email notifications when drip lesson unlocks
