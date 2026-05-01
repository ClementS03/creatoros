# Video Courses — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "course" product type with sections + lessons (YouTube/Vimeo embed), a dashboard editor, a gated player with progress tracking, drip content, and manual unlock per buyer.

**Architecture:** Three new tables (`course_sections`, `course_lessons`, `lesson_progress`, `lesson_unlocks`). Course editor in dashboard mirrors LP-builder split layout using dnd-kit. Course player at `/course/[productId]` requires buyer session (from buyer-accounts spec). Progress stored by buyer email. Drip = `order.created_at + drip_days <= now` OR manual unlock row exists.

**Tech Stack:** Next.js 15 App Router, Supabase, TypeScript, Tailwind, shadcn/ui, @dnd-kit/sortable (already installed).

**Depends on:** Buyer Accounts plan (2026-05-01) must be deployed first.

---

## File map

**New files:**
- `supabase/migrations/016_courses.sql`
- `supabase/migrations/017_lesson_progress.sql`
- `lib/course-utils.ts` — `isLessonAvailable()`, `parseVideoEmbedUrl()`
- `__tests__/lib/course-utils.test.ts`
- `app/api/courses/[productId]/structure/route.ts` — GET + PUT course tree
- `app/api/courses/[productId]/progress/route.ts` — GET + POST progress
- `app/api/courses/[productId]/students/route.ts` — GET enrolled buyers
- `app/api/courses/[productId]/students/unlock/route.ts` — POST + DELETE unlock
- `components/course-editor/SectionList.tsx` — dnd-kit sortable tree
- `components/course-editor/LessonForm.tsx` — lesson edit form
- `app/dashboard/products/[id]/course/page.tsx` — course editor
- `app/dashboard/courses/[productId]/students/page.tsx` — students + unlock UI
- `components/course-player/CourseSidebar.tsx` — lesson outline with lock/progress
- `components/course-player/CourseVideoPlayer.tsx` — iframe + postMessage auto-complete
- `app/course/[productId]/page.tsx` — public course player (requires buyer auth)

**Modified files:**
- `types/index.ts` — add `CourseSection`, `CourseLesson`, `LessonProgress`, extend `ProductType`
- `app/dashboard/products/[id]/page.tsx` — add "Edit course" button for course products
- `lib/email.ts` — add `sendCourseAccessEmail()`
- `app/api/stripe/webhook/route.ts` — for course purchases: send course email, skip download
- `docs/TEST-CHECKLIST.md` — add Video Courses section

---

## Task 1: Migrations

**Files:**
- Create: `supabase/migrations/016_courses.sql`
- Create: `supabase/migrations/017_lesson_progress.sql`

- [ ] **Step 1: Create `016_courses.sql`**

```sql
-- supabase/migrations/016_courses.sql
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
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

ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own course content
CREATE POLICY "creators_manage_sections" ON course_sections
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

CREATE POLICY "creators_manage_lessons" ON course_lessons
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

-- Anyone can read published course structure (gating is done in the player, not here)
CREATE POLICY "public_read_sections" ON course_sections
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE is_published = true AND is_active = true)
  );

CREATE POLICY "public_read_lessons" ON course_lessons
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE is_published = true AND is_active = true)
  );
```

- [ ] **Step 2: Create `017_lesson_progress.sql`**

```sql
-- supabase/migrations/017_lesson_progress.sql
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(buyer_email, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_email, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_unlocks ENABLE ROW LEVEL SECURITY;

-- Buyers can read/write their own progress
CREATE POLICY "buyer_own_progress" ON lesson_progress
  FOR ALL USING (buyer_email = auth.jwt()->>'email');

-- Buyers can read their unlocks; creators can manage all unlocks for their products
CREATE POLICY "buyer_read_unlocks" ON lesson_unlocks
  FOR SELECT USING (buyer_email = auth.jwt()->>'email');

CREATE POLICY "creator_manage_unlocks" ON lesson_unlocks
  FOR ALL USING (creator_id = auth.uid());
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/016_courses.sql supabase/migrations/017_lesson_progress.sql
git commit -m "feat(courses): migrations 016-017 — course_sections, course_lessons, lesson_progress, lesson_unlocks"
```

> ⚠️ Apply both migrations in Supabase SQL Editor before testing.

---

## Task 2: Types + course-utils + unit tests

**Files:**
- Modify: `types/index.ts`
- Create: `lib/course-utils.ts`
- Create: `__tests__/lib/course-utils.test.ts`

- [ ] **Step 1: Add types to `types/index.ts`**

Change `ProductType`:
```ts
export type ProductType = "digital" | "course";
```

Add after `LessonProgress` (add before `Order`):
```ts
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

- [ ] **Step 2: Write failing tests**

```ts
// __tests__/lib/course-utils.test.ts
import { describe, it, expect } from "vitest";
import { isLessonAvailable, parseVideoEmbedUrl } from "../../lib/course-utils";

describe("isLessonAvailable", () => {
  const now = new Date("2026-05-01T12:00:00Z");
  const orderDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  it("returns true when drip_days = 0", () => {
    expect(isLessonAvailable({ drip_days: 0 }, orderDate(0), new Set(), now)).toBe(true);
  });

  it("returns true when drip days have passed", () => {
    expect(isLessonAvailable({ drip_days: 7 }, orderDate(8), new Set(), now)).toBe(true);
  });

  it("returns false when drip days have not passed", () => {
    expect(isLessonAvailable({ drip_days: 7 }, orderDate(3), new Set(), now)).toBe(false);
  });

  it("returns true when lesson is manually unlocked regardless of drip", () => {
    expect(isLessonAvailable({ drip_days: 7, id: "lesson-1" }, orderDate(1), new Set(["lesson-1"]), now)).toBe(true);
  });

  it("returns false at exact drip boundary (not yet)", () => {
    // ordered exactly 7 days ago but < 7 days in hours
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(d.getHours() + 1); // 1 hour short
    expect(isLessonAvailable({ drip_days: 7 }, d.toISOString(), new Set(), now)).toBe(false);
  });
});

describe("parseVideoEmbedUrl", () => {
  it("converts youtube.com/watch to embed URL", () => {
    expect(parseVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1");
  });

  it("converts youtu.be to embed URL", () => {
    expect(parseVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1");
  });

  it("converts vimeo to embed URL", () => {
    expect(parseVideoEmbedUrl("https://vimeo.com/123456789"))
      .toBe("https://player.vimeo.com/video/123456789");
  });

  it("returns null for unsupported URL", () => {
    expect(parseVideoEmbedUrl("https://example.com/video")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseVideoEmbedUrl("not-a-url")).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests, verify FAIL**

```bash
node_modules/.bin/vitest run __tests__/lib/course-utils.test.ts --reporter=verbose
```

Expected: FAIL — `isLessonAvailable` not defined.

- [ ] **Step 4: Create `lib/course-utils.ts`**

```ts
// lib/course-utils.ts

export function isLessonAvailable(
  lesson: { drip_days: number; id?: string },
  orderCreatedAt: string,
  unlockedIds: Set<string>,
  now: Date = new Date()
): boolean {
  if (lesson.id && unlockedIds.has(lesson.id)) return true;
  if (lesson.drip_days === 0) return true;
  const unlockAt = new Date(orderCreatedAt);
  unlockAt.setDate(unlockAt.getDate() + lesson.drip_days);
  return now >= unlockAt;
}

export function parseVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
node_modules/.bin/vitest run __tests__/lib/course-utils.test.ts --reporter=verbose
```

Expected: all 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add types/index.ts lib/course-utils.ts __tests__/lib/course-utils.test.ts
git commit -m "feat(courses): types + course-utils (isLessonAvailable, parseVideoEmbedUrl) + 9 tests"
```

---

## Task 3: Course structure API

**Files:**
- Create: `app/api/courses/[productId]/structure/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/courses/[productId]/structure/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { CourseSection, CourseLesson } from "@/types/index";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };

async function getOwnCourseProduct(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, productId: string, userId: string) {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("creator_id", userId)
    .eq("type", "course")
    .single();
  return data;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnCourseProduct(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sections } = await supabaseAdmin
    .from("course_sections")
    .select("id, title, sort_order, course_lessons(id, title, video_url, description, drip_days, sort_order)")
    .eq("product_id", productId)
    .order("sort_order");

  const sorted = (sections ?? []).map(s => ({
    ...s,
    course_lessons: (s.course_lessons as CourseLesson[] ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return NextResponse.json(sorted);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await getOwnCourseProduct(supabase, productId, user.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sections = await request.json() as Array<{
    id: string;
    title: string;
    sort_order: number;
    lessons: Array<{ id: string; title: string; video_url: string | null; description: string | null; drip_days: number; sort_order: number }>;
  }>;

  // Upsert sections
  if (sections.length > 0) {
    await supabaseAdmin.from("course_sections").upsert(
      sections.map(s => ({ id: s.id, product_id: productId, title: s.title, sort_order: s.sort_order }))
    );
  }

  // Upsert lessons
  const allLessons = sections.flatMap(s =>
    s.lessons.map(l => ({
      id: l.id,
      section_id: s.id,
      product_id: productId,
      title: l.title,
      video_url: l.video_url ?? null,
      description: l.description ?? null,
      drip_days: l.drip_days ?? 0,
      sort_order: l.sort_order,
    }))
  );
  if (allLessons.length > 0) {
    await supabaseAdmin.from("course_lessons").upsert(allLessons);
  }

  // Delete removed sections
  const incomingSectionIds = sections.map(s => s.id);
  await supabaseAdmin
    .from("course_sections")
    .delete()
    .eq("product_id", productId)
    .not("id", "in", `(${incomingSectionIds.map(id => `'${id}'`).join(",") || "''"})` );

  // Delete removed lessons
  const incomingLessonIds = allLessons.map(l => l.id);
  await supabaseAdmin
    .from("course_lessons")
    .delete()
    .eq("product_id", productId)
    .not("id", "in", `(${incomingLessonIds.map(id => `'${id}'`).join(",") || "''"})` );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/courses/[productId]/structure/route.ts
git commit -m "feat(courses): course structure GET/PUT API"
```

---

## Task 4: Progress + students + unlock APIs

**Files:**
- Create: `app/api/courses/[productId]/progress/route.ts`
- Create: `app/api/courses/[productId]/students/route.ts`
- Create: `app/api/courses/[productId]/students/unlock/route.ts`

- [ ] **Step 1: Create `progress/route.ts`**

```ts
// app/api/courses/[productId]/progress/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify purchase
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, created_at")
    .eq("product_id", productId)
    .eq("buyer_email", user.email!)
    .order("created_at")
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No purchase found" }, { status: 403 });

  const { data: progress } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("buyer_email", user.email!);

  const { data: unlocks } = await supabaseAdmin
    .from("lesson_unlocks")
    .select("lesson_id")
    .eq("buyer_email", user.email!);

  return NextResponse.json({
    progress: progress ?? [],
    unlockedLessonIds: (unlocks ?? []).map(u => u.lesson_id as string),
    orderCreatedAt: order.created_at as string,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify purchase
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_email", user.email!)
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No purchase found" }, { status: 403 });

  const { lessonId, completed } = await request.json() as { lessonId: string; completed: boolean };

  await supabaseAdmin.from("lesson_progress").upsert({
    buyer_email: user.email!,
    lesson_id: lessonId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: "buyer_email,lesson_id" });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `students/route.ts`**

```ts
// app/api/courses/[productId]/students/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify creator owns product
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("creator_id", user.id)
    .single();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get all buyers (orders for this product)
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, buyer_email, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  // Get total lesson count
  const { count: totalLessons } = await supabaseAdmin
    .from("course_lessons")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  // Get progress per buyer
  const buyerEmails = [...new Set((orders ?? []).map(o => o.buyer_email as string))];
  const { data: progress } = await supabaseAdmin
    .from("lesson_progress")
    .select("buyer_email, lesson_id")
    .in("buyer_email", buyerEmails)
    .eq("completed", true);

  // Get unlocks
  const { data: unlocks } = await supabaseAdmin
    .from("lesson_unlocks")
    .select("buyer_email, lesson_id")
    .in("buyer_email", buyerEmails);

  const progressByEmail = new Map<string, number>();
  (progress ?? []).forEach(p => {
    const key = p.buyer_email as string;
    progressByEmail.set(key, (progressByEmail.get(key) ?? 0) + 1);
  });

  const unlocksByEmail = new Map<string, string[]>();
  (unlocks ?? []).forEach(u => {
    const key = u.buyer_email as string;
    if (!unlocksByEmail.has(key)) unlocksByEmail.set(key, []);
    unlocksByEmail.get(key)!.push(u.lesson_id as string);
  });

  const students = buyerEmails.map(email => ({
    email,
    orderId: (orders ?? []).find(o => o.buyer_email === email)?.id,
    orderCreatedAt: (orders ?? []).find(o => o.buyer_email === email)?.created_at,
    completedLessons: progressByEmail.get(email) ?? 0,
    totalLessons: totalLessons ?? 0,
    unlockedLessonIds: unlocksByEmail.get(email) ?? [],
  }));

  return NextResponse.json(students);
}
```

- [ ] **Step 3: Create `students/unlock/route.ts`**

```ts
// app/api/courses/[productId]/students/unlock/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ productId: string }> };
type Body = { buyerEmail: string; lessonIds: string[] | "all" };

async function getCreatorLessonIds(productId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("course_lessons")
    .select("id")
    .eq("product_id", productId);
  return (data ?? []).map(l => l.id as string);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("creator_id", user.id).single();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { buyerEmail, lessonIds } = await request.json() as Body;
  const ids = lessonIds === "all" ? await getCreatorLessonIds(productId) : lessonIds;

  await supabaseAdmin.from("lesson_unlocks").upsert(
    ids.map(lessonId => ({ buyer_email: buyerEmail, lesson_id: lessonId, creator_id: user.id })),
    { onConflict: "buyer_email,lesson_id" }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("creator_id", user.id).single();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { buyerEmail, lessonIds } = await request.json() as Body;
  const ids = lessonIds === "all" ? await getCreatorLessonIds(productId) : lessonIds;

  await supabaseAdmin
    .from("lesson_unlocks")
    .delete()
    .eq("buyer_email", buyerEmail)
    .in("lesson_id", ids);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/courses/[productId]/progress/route.ts app/api/courses/[productId]/students/route.ts app/api/courses/[productId]/students/unlock/route.ts
git commit -m "feat(courses): progress, students, unlock APIs"
```

---

## Task 5: Course editor components

**Files:**
- Create: `components/course-editor/SectionList.tsx`
- Create: `components/course-editor/LessonForm.tsx`

- [ ] **Step 1: Create `SectionList.tsx`**

```tsx
// components/course-editor/SectionList.tsx
"use client";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { CourseSection, CourseLesson } from "@/types/index";

type Props = {
  sections: CourseSection[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string, sectionId: string) => void;
  onUpdate: (sections: CourseSection[]) => void;
};

function generateId() { return Math.random().toString(36).slice(2, 10); }

export function SectionList({ sections, selectedLessonId, onSelectLesson, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function addSection() {
    const newSection: CourseSection = {
      id: generateId(),
      product_id: "",
      title: "New section",
      sort_order: sections.length,
      lessons: [],
    };
    onUpdate([...sections, newSection]);
  }

  function deleteSection(sectionId: string) {
    onUpdate(sections.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, sort_order: i })));
  }

  function updateSectionTitle(sectionId: string, title: string) {
    onUpdate(sections.map(s => s.id === sectionId ? { ...s, title } : s));
  }

  function addLesson(sectionId: string) {
    const newLesson: CourseLesson = {
      id: generateId(),
      section_id: sectionId,
      product_id: "",
      title: "New lesson",
      video_url: null,
      description: null,
      drip_days: 0,
      sort_order: (sections.find(s => s.id === sectionId)?.lessons?.length ?? 0),
    };
    onUpdate(sections.map(s => s.id === sectionId ? { ...s, lessons: [...(s.lessons ?? []), newLesson] } : s));
    onSelectLesson(newLesson.id, sectionId);
  }

  function deleteLesson(sectionId: string, lessonId: string) {
    onUpdate(sections.map(s => s.id !== sectionId ? s : {
      ...s,
      lessons: (s.lessons ?? []).filter(l => l.id !== lessonId).map((l, i) => ({ ...l, sort_order: i })),
    }));
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sections.findIndex(s => s.id === active.id);
    const to = sections.findIndex(s => s.id === over.id);
    const reordered = [...sections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onUpdate(reordered.map((s, i) => ({ ...s, sort_order: i })));
  }

  function toggleCollapse(sectionId: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  return (
    <div className="space-y-1 p-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(section => (
            <SortableSection
              key={section.id}
              section={section}
              collapsed={collapsed.has(section.id)}
              selectedLessonId={selectedLessonId}
              onToggleCollapse={() => toggleCollapse(section.id)}
              onTitleChange={title => updateSectionTitle(section.id, title)}
              onDelete={() => deleteSection(section.id)}
              onSelectLesson={lessonId => onSelectLesson(lessonId, section.id)}
              onAddLesson={() => addLesson(section.id)}
              onDeleteLesson={lessonId => deleteLesson(section.id, lessonId)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button size="sm" variant="outline" className="w-full mt-2" onClick={addSection}>
        <Plus size={13} className="mr-1.5" />Add section
      </Button>
    </div>
  );
}

function SortableSection({ section, collapsed, selectedLessonId, onToggleCollapse, onTitleChange, onDelete, onSelectLesson, onAddLesson, onDeleteLesson }: {
  section: CourseSection;
  collapsed: boolean;
  selectedLessonId: string | null;
  onToggleCollapse: () => void;
  onTitleChange: (t: string) => void;
  onDelete: () => void;
  onSelectLesson: (id: string) => void;
  onAddLesson: () => void;
  onDeleteLesson: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="space-y-0.5">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded-md group">
        <button {...attributes} {...listeners} className="text-muted-foreground cursor-grab shrink-0 touch-none">
          <GripVertical size={13} />
        </button>
        <button onClick={onToggleCollapse} className="text-muted-foreground shrink-0">
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <Input
          value={section.title}
          onChange={e => onTitleChange(e.target.value)}
          className="h-6 text-xs font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
        />
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0">
          <X size={12} />
        </button>
      </div>

      {!collapsed && (
        <div className="ml-4 space-y-0.5">
          {(section.lessons ?? []).map(lesson => (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group text-xs ${
                selectedLessonId === lesson.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/40 border border-transparent"
              }`}
            >
              <span className="flex-1 truncate">{lesson.title}</span>
              {lesson.drip_days > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">⏳ {lesson.drip_days}d</span>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={onAddLesson}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={11} />Add lesson
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `LessonForm.tsx`**

```tsx
// components/course-editor/LessonForm.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseVideoEmbedUrl } from "@/lib/course-utils";
import type { CourseLesson } from "@/types/index";

type Props = {
  lesson: CourseLesson;
  onChange: (updated: CourseLesson) => void;
};

export function LessonForm({ lesson, onChange }: Props) {
  function set<K extends keyof CourseLesson>(key: K, value: CourseLesson[K]) {
    onChange({ ...lesson, [key]: value });
  }

  const embedUrl = lesson.video_url ? parseVideoEmbedUrl(lesson.video_url) : null;

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Edit lesson</p>

      <div className="space-y-1">
        <Label className="text-xs">Title *</Label>
        <Input value={lesson.title} onChange={e => set("title", e.target.value)} placeholder="Lesson title" />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Video URL</Label>
        <Input
          value={lesson.video_url ?? ""}
          onChange={e => set("video_url", e.target.value || null)}
          placeholder="https://youtube.com/watch?v=..."
        />
        {lesson.video_url && (
          <p className={`text-xs mt-1 ${embedUrl ? "text-green-600" : "text-destructive"}`}>
            {embedUrl ? "✓ Valid URL" : "⚠ Unsupported URL (YouTube or Vimeo only)"}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
          value={lesson.description ?? ""}
          onChange={e => set("description", e.target.value || null)}
          placeholder="What will students learn in this lesson?"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Drip: available after purchase (days)</Label>
        <Input
          type="number"
          min="0"
          value={lesson.drip_days}
          onChange={e => set("drip_days", parseInt(e.target.value, 10) || 0)}
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">0 = available immediately</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/course-editor/SectionList.tsx components/course-editor/LessonForm.tsx
git commit -m "feat(courses): SectionList (dnd-kit) + LessonForm editor components"
```

---

## Task 6: Course editor page (dashboard)

**Files:**
- Create: `app/dashboard/products/[id]/course/page.tsx`

- [ ] **Step 1: Create the editor page**

```tsx
// app/dashboard/products/[id]/course/page.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CourseSection, CourseLesson } from "@/types/index";
import { SectionList } from "@/components/course-editor/SectionList";
import { LessonForm } from "@/components/course-editor/LessonForm";

type MobileTab = "structure" | "edit";

export default function CourseEditorPage() {
  const params = useParams();
  const productId = params.id as string;

  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("structure");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/courses/${productId}/structure`).then(r => r.json()),
    ]).then(([product, structure]) => {
      setProductName((product as { name: string }).name);
      setSections((structure as CourseSection[]).map(s => ({
        ...s,
        lessons: (s as unknown as { course_lessons?: CourseLesson[] }).course_lessons ?? [],
      })));
      setLoading(false);
    });
  }, [productId]);

  const save = useCallback(async (newSections: CourseSection[]) => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/courses/${productId}/structure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSections),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [productId]);

  function triggerSave(newSections: CourseSection[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newSections), 1000);
  }

  function handleUpdate(newSections: CourseSection[]) {
    setSections(newSections);
    triggerSave(newSections);
  }

  function handleSelectLesson(lessonId: string, sectionId: string) {
    setSelectedLessonId(lessonId);
    setSelectedSectionId(sectionId);
    setMobileTab("edit");
  }

  function handleLessonChange(updated: CourseLesson) {
    const newSections = sections.map(s =>
      s.id !== selectedSectionId ? s : {
        ...s,
        lessons: (s.lessons ?? []).map(l => l.id === updated.id ? updated : l),
      }
    );
    handleUpdate(newSections);
  }

  const selectedLesson = sections
    .find(s => s.id === selectedSectionId)
    ?.lessons?.find(l => l.id === selectedLessonId) ?? null;

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-background gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={`/dashboard/products/${productId}`}><ArrowLeft size={14} /></Link>
          </Button>
          <span className="text-sm font-medium truncate hidden sm:block">{productName}</span>
          {totalLessons > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {sections.length} sections · {totalLessons} lessons
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving…</span>}
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} />Saved</span>}
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/courses/${productId}/students`}>
              Students
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b shrink-0">
        {(["structure", "edit"] as MobileTab[]).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              mobileTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >{tab === "structure" ? "Structure" : "Edit lesson"}</button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: course structure */}
        <div className={`w-full lg:w-72 shrink-0 border-r overflow-y-auto ${mobileTab === "edit" ? "hidden lg:block" : "block"}`}>
          <SectionList
            sections={sections}
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            onUpdate={handleUpdate}
          />
        </div>

        {/* Right: lesson form */}
        <div className={`flex-1 overflow-y-auto ${mobileTab === "structure" ? "hidden lg:block" : "block"}`}>
          {selectedLesson ? (
            <LessonForm lesson={selectedLesson} onChange={handleLessonChange} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a lesson to edit it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add "Edit course" button to product edit page**

In `app/dashboard/products/[id]/page.tsx`, import `BookOpen` from lucide-react and add a second button:

```tsx
// In app/dashboard/products/[id]/page.tsx
// Add import:
import { LayoutTemplate, BookOpen } from "lucide-react";

// Add to the header div (after "Edit landing page" button):
{(product.type as string) === "course" && (
  <Button asChild variant="outline" size="sm">
    <Link href={`/dashboard/products/${id}/course`}>
      <BookOpen size={14} className="mr-1.5" />
      Edit course
    </Link>
  </Button>
)}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/products/[id]/course/page.tsx app/dashboard/products/[id]/page.tsx
git commit -m "feat(courses): course editor page + Edit course button on product edit"
```

---

## Task 7: Students dashboard page

**Files:**
- Create: `app/dashboard/courses/[productId]/students/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/dashboard/courses/[productId]/students/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Unlock, Lock } from "lucide-react";
import Link from "next/link";

type Student = {
  email: string;
  orderId: string;
  orderCreatedAt: string;
  completedLessons: number;
  totalLessons: number;
  unlockedLessonIds: string[];
};

export default function StudentsPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${productId}/students`)
      .then(r => r.json())
      .then(data => { setStudents(data as Student[]); setLoading(false); });
  }, [productId]);

  async function handleUnlockAll(email: string) {
    setUnlocking(email);
    await fetch(`/api/courses/${productId}/students/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail: email, lessonIds: "all" }),
    });
    setStudents(prev => prev.map(s =>
      s.email !== email ? s : { ...s, unlockedLessonIds: Array.from({ length: s.totalLessons }, (_, i) => String(i)) }
    ));
    setUnlocking(null);
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/products/${productId}/course`}><ArrowLeft size={14} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Students</h1>
        <span className="text-sm text-muted-foreground">({students.length})</span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Enrolled</th>
                <th className="px-4 py-3 text-right font-medium text-xs text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(student => (
                <tr key={student.email} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{student.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-24">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: student.totalLessons > 0 ? `${(student.completedLessons / student.totalLessons) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {student.completedLessons}/{student.totalLessons}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(student.orderCreatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleUnlockAll(student.email)}
                      disabled={unlocking === student.email}
                    >
                      <Unlock size={11} className="mr-1.5" />
                      Unlock all
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/courses/[productId]/students/page.tsx
git commit -m "feat(courses): students page with unlock-all per buyer"
```

---

## Task 8: Course player components

**Files:**
- Create: `components/course-player/CourseSidebar.tsx`
- Create: `components/course-player/CourseVideoPlayer.tsx`

- [ ] **Step 1: Create `CourseSidebar.tsx`**

```tsx
// components/course-player/CourseSidebar.tsx
"use client";
import { CheckCircle2, Lock, PlayCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CourseSection, CourseLesson } from "@/types/index";
import { isLessonAvailable } from "@/lib/course-utils";

type Props = {
  sections: CourseSection[];
  completedIds: Set<string>;
  unlockedIds: Set<string>;
  orderCreatedAt: string;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: CourseLesson) => void;
};

export function CourseSidebar({
  sections, completedIds, unlockedIds, orderCreatedAt, selectedLessonId, onSelectLesson,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);
  const completedCount = completedIds.size;

  function toggleSection(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="h-full flex flex-col border-r">
      {/* Progress header */}
      <div className="p-4 border-b shrink-0">
        <p className="text-xs font-semibold mb-1.5">{completedCount}/{totalLessons} lessons</p>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: totalLessons > 0 ? `${(completedCount / totalLessons) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto">
        {sections.map(section => {
          const isCollapsed = collapsed.has(section.id);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b text-left hover:bg-muted/50 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}
                <span className="text-xs font-semibold flex-1 truncate">{section.title}</span>
              </button>
              {!isCollapsed && (
                <div>
                  {(section.lessons ?? []).map(lesson => {
                    const available = isLessonAvailable(lesson, orderCreatedAt, unlockedIds);
                    const completed = completedIds.has(lesson.id);
                    const selected = selectedLessonId === lesson.id;
                    const unlockDate = !available ? (() => {
                      const d = new Date(orderCreatedAt);
                      d.setDate(d.getDate() + lesson.drip_days);
                      return d.toLocaleDateString();
                    })() : null;

                    return (
                      <button
                        key={lesson.id}
                        disabled={!available}
                        onClick={() => available && onSelectLesson(lesson)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-b transition-colors ${
                          selected ? "bg-primary/10" :
                          available ? "hover:bg-muted/40 cursor-pointer" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span className="shrink-0">
                          {completed ? <CheckCircle2 size={14} className="text-primary" /> :
                           !available ? <Lock size={14} className="text-muted-foreground" /> :
                           <PlayCircle size={14} className="text-muted-foreground" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{lesson.title}</p>
                          {unlockDate && (
                            <p className="text-xs text-muted-foreground">Available {unlockDate}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `CourseVideoPlayer.tsx`**

```tsx
// components/course-player/CourseVideoPlayer.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { parseVideoEmbedUrl } from "@/lib/course-utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import type { CourseLesson } from "@/types/index";

type Props = {
  lesson: CourseLesson;
  productId: string;
  completed: boolean;
  onComplete: (lessonId: string) => void;
  onNext: (() => void) | null;
};

export function CourseVideoPlayer({ lesson, productId, completed, onComplete, onNext }: Props) {
  const embedUrl = lesson.video_url ? parseVideoEmbedUrl(lesson.video_url) : null;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [markedComplete, setMarkedComplete] = useState(completed);

  useEffect(() => {
    setMarkedComplete(completed);
  }, [lesson.id, completed]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // YouTube: state 0 = ended
      if (typeof event.data === "string") {
        try {
          const data = JSON.parse(event.data) as { event?: string; info?: number };
          if (data.event === "onStateChange" && data.info === 0) {
            handleMarkComplete();
          }
          // Vimeo finish event
          if (data.event === "finish") {
            handleMarkComplete();
          }
        } catch {}
      } else if (event.data?.event === "onStateChange" && event.data?.info === 0) {
        handleMarkComplete();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, markedComplete]);

  async function handleMarkComplete() {
    if (markedComplete) return;
    setMarkedComplete(true);
    await fetch(`/api/courses/${productId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: true }),
    });
    onComplete(lesson.id);
  }

  async function handleToggleComplete() {
    const newValue = !markedComplete;
    setMarkedComplete(newValue);
    await fetch(`/api/courses/${productId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: newValue }),
    });
    if (newValue) onComplete(lesson.id);
  }

  return (
    <div className="space-y-4">
      {/* Video */}
      {embedUrl ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full rounded-xl bg-muted aspect-video flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No video set for this lesson</p>
        </div>
      )}

      {/* Lesson info + actions */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant={markedComplete ? "default" : "outline"}
            size="sm"
            onClick={handleToggleComplete}
            className="gap-1.5"
          >
            {markedComplete
              ? <><CheckCircle2 size={14} />Completed</>
              : <><Circle size={14} />Mark as complete</>}
          </Button>
          {onNext && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next lesson →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/course-player/CourseSidebar.tsx components/course-player/CourseVideoPlayer.tsx
git commit -m "feat(courses): CourseSidebar + CourseVideoPlayer with auto-complete detection"
```

---

## Task 9: Course player page

**Files:**
- Create: `app/course/[productId]/page.tsx`

- [ ] **Step 1: Create the course player page**

```tsx
// app/course/[productId]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CourseSidebar } from "@/components/course-player/CourseSidebar";
import { CourseVideoPlayer } from "@/components/course-player/CourseVideoPlayer";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CourseSection, CourseLesson } from "@/types/index";

type MobileTab = "lessons" | "player";

type ProgressData = {
  progress: { lesson_id: string; completed: boolean }[];
  unlockedLessonIds: string[];
  orderCreatedAt: string;
};

export default function CoursePlayerPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [sections, setSections] = useState<CourseSection[]>([]);
  const [productName, setProductName] = useState("");
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("player");

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/courses/${productId}/structure`).then(r => r.json()),
      fetch(`/api/courses/${productId}/progress`).then(r => r.json()),
    ]).then(([product, structure, progress]) => {
      const prod = product as { name: string; type: string; error?: string };
      if (prod.error) { setError("Course not found."); setLoading(false); return; }

      const prog = progress as ProgressData & { error?: string };
      if (prog.error) { setError("You don't have access to this course."); setLoading(false); return; }

      setProductName(prod.name);

      const mappedSections = (structure as CourseSection[]).map(s => ({
        ...s,
        lessons: (s as unknown as { course_lessons?: CourseLesson[] }).course_lessons ?? [],
      }));
      setSections(mappedSections);
      setProgressData(prog);
      setCompletedIds(new Set(prog.progress.filter(p => p.completed).map(p => p.lesson_id)));

      // Auto-select first available lesson
      const unlockedSet = new Set(prog.unlockedLessonIds);
      for (const section of mappedSections) {
        for (const lesson of (section.lessons ?? [])) {
          const available = lesson.drip_days === 0 || unlockedSet.has(lesson.id) ||
            new Date() >= new Date(new Date(prog.orderCreatedAt).getTime() + lesson.drip_days * 86400000);
          if (available) { setSelectedLesson(lesson); break; }
        }
        if (selectedLesson) break;
      }

      setLoading(false);
    }).catch(() => { setError("Failed to load course."); setLoading(false); });
  }, [productId]);

  function handleLessonComplete(lessonId: string) {
    setCompletedIds(prev => new Set([...prev, lessonId]));
  }

  function getNextLesson(current: CourseLesson): CourseLesson | null {
    const allLessons = sections.flatMap(s => s.lessons ?? []);
    const idx = allLessons.findIndex(l => l.id === current.id);
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center space-y-3">
        <div>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/portal" className="text-sm text-primary underline mt-2 block">Back to my purchases</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b shrink-0 bg-background gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/portal" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <span className="text-sm font-medium truncate">{productName}</span>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b shrink-0">
        {(["lessons", "player"] as MobileTab[]).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              mobileTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full lg:w-72 shrink-0 overflow-hidden ${mobileTab === "player" ? "hidden lg:block" : "block"}`}>
          {progressData && (
            <CourseSidebar
              sections={sections}
              completedIds={completedIds}
              unlockedIds={new Set(progressData.unlockedLessonIds)}
              orderCreatedAt={progressData.orderCreatedAt}
              selectedLessonId={selectedLesson?.id ?? null}
              onSelectLesson={lesson => { setSelectedLesson(lesson); setMobileTab("player"); }}
            />
          )}
        </div>

        {/* Player */}
        <div className={`flex-1 overflow-y-auto p-6 ${mobileTab === "lessons" ? "hidden lg:block" : "block"}`}>
          {selectedLesson && progressData ? (
            <CourseVideoPlayer
              lesson={selectedLesson}
              productId={productId}
              completed={completedIds.has(selectedLesson.id)}
              onComplete={handleLessonComplete}
              onNext={(() => {
                const next = getNextLesson(selectedLesson);
                return next ? () => setSelectedLesson(next) : null;
              })()}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a lesson to start
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/course/[productId]/page.tsx
git commit -m "feat(courses): course player page — sidebar + video + progress + drip"
```

---

## Task 10: Email + webhook + product card updates

**Files:**
- Modify: `lib/email.ts`
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Add `sendCourseAccessEmail` to `lib/email.ts`**

Add after `sendPurchaseEmail`:

```ts
export async function sendCourseAccessEmail({
  to,
  productName,
  courseUrl,
}: {
  to: string;
  productName: string;
  courseUrl: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://creatoroshq.com";
  await resend.emails.send({
    from: "CreatorOS <hello@creatoroshq.com>",
    to,
    subject: `You're enrolled: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">You're enrolled! 🎓</h1>
        <p style="color: #666; margin-bottom: 24px;">
          You now have access to <strong>${productName}</strong>. Click below to start learning.
        </p>
        <a href="${courseUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Start course
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          Access all your purchases at <a href="${appUrl}/portal" style="color: #6366f1;">${appUrl}/portal</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 8px;">Powered by CreatorOS</p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Update webhook for course purchases**

In `app/api/stripe/webhook/route.ts`, add the import at the top:

```ts
import { sendPurchaseEmail, sendCourseAccessEmail } from "@/lib/email";
```

Then in the order handling block, after creating the order, update the email sending:

```ts
    // After the existing order creation and subscribers upsert...
    // Replace the existing download email block with:
    if (order) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
      const productType = (product as unknown as { type?: string }).type;

      if (productType === "course") {
        // Send course access email
        const courseUrl = `${appUrl}/course/${productId}`;
        await sendCourseAccessEmail({
          to: buyerEmail,
          productName: product.name as string,
          courseUrl,
        });
      } else if (isBundle) {
        const downloadUrl = `${appUrl}/download?order=${order.id}&product=${productId}`;
        await sendPurchaseEmail({ to: buyerEmail, productName: product.name as string, downloadUrl });
      } else {
        const productFiles = (product as unknown as { product_files?: { id: string; sort_order: number }[] }).product_files ?? [];
        const hasFiles = productFiles.length > 0 || product.file_path;
        if (hasFiles) {
          const baseDownload = `${appUrl}/api/products/${productId}/download?order=${order.id}`;
          const downloadUrl = bumpProductIds.length > 0 || productFiles.length > 1
            ? `${appUrl}/download?order=${order.id}&product=${productId}`
            : productFiles.length === 1
              ? `${baseDownload}&file=${productFiles[0].id}`
              : baseDownload;
          await sendPurchaseEmail({ to: buyerEmail, productName: product.name as string, downloadUrl });
        }
      }
    }
```

Also update the product select query to include `type`:

```ts
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, file_path, price, currency, type, is_bundle, product_files(id, file_name, sort_order), bundle_items(product_id, products(name, file_path, product_files(id, file_name, sort_order)))")
      .eq("id", productId)
      .single();
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts app/api/stripe/webhook/route.ts
git commit -m "feat(courses): sendCourseAccessEmail + webhook handles course type"
```

---

## Task 11: Test checklist + push

**Files:**
- Modify: `docs/TEST-CHECKLIST.md`

- [ ] **Step 1: Add Video Courses section**

Add at the top of `docs/TEST-CHECKLIST.md` (before Buyer Accounts):

```markdown
## Video Courses

### Course creation (`/dashboard/products/[id]/course`)
- [ ] Create a product with type "course" → "Edit course" button appears on edit page
- [ ] Course editor opens with empty state
- [ ] Add section → appears in tree
- [ ] Add lesson to section → selects lesson, form appears on right
- [ ] Set lesson title, video URL (YouTube) → "Valid URL" confirmation shown
- [ ] Set drip_days = 7 → shown as "⏳ 7d" in tree
- [ ] Drag section → reorders
- [ ] Delete lesson → removed from tree
- [ ] Delete section → removed with all lessons
- [ ] Auto-save fires 1s after change
- [ ] "Students" button → opens students page

### Students page (`/dashboard/courses/[productId]/students`)
- [ ] Lists enrolled buyers with progress bar
- [ ] "Unlock all" button → all lessons unlocked for that buyer

### Course player (`/course/[productId]`)
- [ ] Visit without session → redirected to `/portal/login?next=/course/[id]`
- [ ] Visit without purchase → "You don't have access" error
- [ ] Visit after purchase → player loads with course outline
- [ ] Lesson with drip_days=0 → available immediately
- [ ] Lesson with drip_days=7, ordered today → locked, shows unlock date
- [ ] Lesson with drip_days=7, ordered 8+ days ago → available
- [ ] Manually unlocked lesson → available even if drip not passed
- [ ] Click available lesson → video loads in player
- [ ] Video ends (YouTube) → auto-marked complete in sidebar
- [ ] "Mark as complete" button → lesson checked in sidebar
- [ ] Progress bar updates after completing lessons
- [ ] "Next lesson →" navigates to next
- [ ] Mobile: Lessons / Player tabs work
- [ ] "Access course" in portal → redirects to player

### Email
- [ ] After course purchase → receive "You're enrolled!" email with course link
- [ ] Course link → `/course/[id]` (requires login)
```

- [ ] **Step 2: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 3: Commit and push**

```bash
git add docs/TEST-CHECKLIST.md
git commit -m "test(courses): update test checklist"
git push
```

---

## Self-review

**Spec coverage:**
- ✅ Migrations 016-017 — Task 1
- ✅ `ProductType = "digital" | "course"` — Task 2
- ✅ `CourseSection`, `CourseLesson`, `LessonProgress` types — Task 2
- ✅ `isLessonAvailable` + drip logic + tests — Task 2
- ✅ `parseVideoEmbedUrl` (enablejsapi=1 for YouTube) + tests — Task 2
- ✅ Course structure GET/PUT API — Task 3
- ✅ Progress GET/POST API — Task 4
- ✅ Students GET API — Task 4
- ✅ Unlock POST/DELETE API — Task 4
- ✅ SectionList with dnd-kit drag/drop — Task 5
- ✅ LessonForm (title, video, description, drip_days) — Task 5
- ✅ Course editor page (split layout, auto-save, mobile tabs) — Task 6
- ✅ "Edit course" button for course products — Task 6
- ✅ Students page with unlock-all — Task 7
- ✅ CourseSidebar (progress, drip lock, unlock state) — Task 8
- ✅ CourseVideoPlayer (postMessage auto-complete, YouTube + Vimeo) — Task 8
- ✅ Course player page (auth check via middleware, sidebar + player, mobile tabs) — Task 9
- ✅ `sendCourseAccessEmail` — Task 10
- ✅ Webhook: course purchase → access email (not download email) — Task 10
- ✅ Test checklist — Task 11
