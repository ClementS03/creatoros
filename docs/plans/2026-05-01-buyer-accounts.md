# Buyer Accounts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give buyers a magic-link Supabase account so they can log in, view their purchases, and access courses.

**Architecture:** Reuse existing Supabase Auth (same instance as creators). Magic link via `signInWithOtp` — creates user if not exists. Buyer identity = Supabase session user; purchases = `orders` rows queried by `buyer_email = user.email`. No migration needed for V1 (email-based queries are sufficient). Distinguish buyer from creator by absence of a `creators` row.

**Tech Stack:** Next.js 15 App Router, Supabase Auth (SSR), TypeScript, Tailwind, shadcn/ui.

---

## File map

**New files:**
- `lib/buyer-auth.ts` — `requireBuyer()` / `getBuyer()` server helpers
- `app/portal/login/page.tsx` — email form + send magic link
- `app/api/portal/auth/magic-link/route.ts` — POST: calls `signInWithOtp`
- `app/portal/auth/callback/route.ts` — exchanges `?code=` for session
- `app/portal/page.tsx` — buyer portal (list of purchases)

**Modified files:**
- `middleware.ts` — protect `/portal` (→ `/portal/login`) and `/course` (→ `/portal/login?next=...`)
- `lib/email.ts` — add portal footer link to `sendPurchaseEmail`
- `docs/TEST-CHECKLIST.md` — add Buyer accounts section

---

## Task 1: `lib/buyer-auth.ts` — server auth helpers

**Files:**
- Create: `lib/buyer-auth.ts`

- [ ] **Step 1: Create the helper**

```ts
// lib/buyer-auth.ts
import { createSupabaseServer } from "./supabase-server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export async function requireBuyer(): Promise<User> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");
  return user;
}

export async function getBuyer(): Promise<User | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/buyer-auth.ts
git commit -m "feat(buyer-auth): requireBuyer / getBuyer server helpers"
```

---

## Task 2: Portal login page + magic-link API

**Files:**
- Create: `app/portal/login/page.tsx`
- Create: `app/api/portal/auth/magic-link/route.ts`

- [ ] **Step 1: Create `app/api/portal/auth/magic-link/route.ts`**

```ts
// app/api/portal/auth/magic-link/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email, next } = await request.json() as { email: string; next?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const callbackUrl = `${appUrl}/portal/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `app/portal/login/page.tsx`**

```tsx
// app/portal/login/page.tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";

export default function PortalLoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/portal/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, next }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h1 className="text-xl font-bold">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>. Click it to access your purchases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Access your purchases</h1>
          <p className="text-sm text-muted-foreground">Enter the email you used to buy.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Mail size={14} className="mr-2" />}
            Send magic link
          </Button>
        </form>
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
git add app/portal/login/page.tsx app/api/portal/auth/magic-link/route.ts
git commit -m "feat(buyer-auth): portal login page + magic-link API"
```

---

## Task 3: Auth callback route

**Files:**
- Create: `app/portal/auth/callback/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/portal/auth/callback/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/portal/auth/callback/route.ts
git commit -m "feat(buyer-auth): auth callback route exchanges code for session"
```

---

## Task 4: Portal page — buyer purchases

**Files:**
- Create: `app/portal/page.tsx`

- [ ] **Step 1: Create the portal page**

```tsx
// app/portal/page.tsx
import { requireBuyer } from "@/lib/buyer-auth";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Download, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PortalPage() {
  const user = await requireBuyer();

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, amount_paid, currency, created_at, products(id, name, cover_image_url, type, product_files(id))")
    .eq("buyer_email", user.email!)
    .order("created_at", { ascending: false });

  type OrderRow = {
    id: string;
    product_id: string;
    amount_paid: number;
    currency: string;
    created_at: string;
    products: {
      id: string;
      name: string;
      cover_image_url: string | null;
      type: string;
      product_files: { id: string }[];
    } | null;
  };

  const rows = (orders ?? []) as OrderRow[];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My purchases</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <form action="/api/portal/auth/logout" method="POST">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut size={14} className="mr-1.5" />
              Sign out
            </Button>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No purchases found for this email.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rows.map(order => {
              const product = order.products;
              if (!product) return null;
              const isCourse = product.type === "course";
              const href = isCourse
                ? `/course/${product.id}`
                : `/download?order=${order.id}&product=${product.id}`;

              return (
                <Link key={order.id} href={href} className="group block">
                  <div className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted relative">
                      {product.cover_image_url ? (
                        <Image
                          src={product.cover_image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl">
                          {isCourse ? "🎓" : "📄"}
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-semibold text-sm leading-tight truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                        {isCourse ? (
                          <><BookOpen size={11} />Access course</>
                        ) : (
                          <><Download size={11} />Download</>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create logout route**

```ts
// app/api/portal/auth/logout/route.ts
import { createSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/portal/login", process.env.NEXT_PUBLIC_APP_URL!));
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/portal/page.tsx app/api/portal/auth/logout/route.ts
git commit -m "feat(buyer-auth): portal page lists purchases + logout"
```

---

## Task 5: Middleware — protect portal + course routes

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Update middleware**

Replace the contents of `middleware.ts` with:

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const rootDomain = new URL(appUrl).hostname;

  // Subdomain rewrite: username.creatoroshq.com → /[username]/...
  const isSubdomain =
    hostname !== rootDomain &&
    hostname !== `www.${rootDomain}` &&
    hostname.endsWith(`.${rootDomain}`);

  if (isSubdomain) {
    const username = hostname.replace(`.${rootDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/${username}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Supabase auth session refresh
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /dashboard → /login
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect /portal (except /portal/login and /portal/auth/*) → /portal/login
  const isPortalPublic =
    request.nextUrl.pathname === "/portal/login" ||
    request.nextUrl.pathname.startsWith("/portal/auth");

  if (request.nextUrl.pathname.startsWith("/portal") && !isPortalPublic && !user) {
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  // Protect /course/* → /portal/login?next=...
  if (request.nextUrl.pathname.startsWith("/course/") && !user) {
    const next = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/portal/login?next=${next}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(buyer-auth): protect /portal and /course routes in middleware"
```

---

## Task 6: Purchase email — add portal link

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 1: Add portal footer link to `sendPurchaseEmail`**

In `lib/email.ts`, find `sendPurchaseEmail` and update the HTML to include a portal link at the bottom:

```ts
export async function sendPurchaseEmail({
  to,
  productName,
  downloadUrl,
}: {
  to: string;
  productName: string;
  downloadUrl: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://creatoroshq.com";
  await resend.emails.send({
    from: "CreatorOS <hello@creatoroshq.com>",
    to,
    subject: `Your purchase: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Thank you for your purchase!</h1>
        <p style="color: #666; margin-bottom: 24px;">
          Here is your download link for <strong>${productName}</strong>. It expires in 24 hours.
        </p>
        <a href="${downloadUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Download now
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          Access all your purchases anytime at <a href="${appUrl}/portal" style="color: #6366f1;">${appUrl}/portal</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 8px;">Powered by CreatorOS</p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "feat(buyer-auth): add portal link to purchase email"
```

---

## Task 7: Test checklist + push

**Files:**
- Modify: `docs/TEST-CHECKLIST.md`

- [ ] **Step 1: Add Buyer Accounts section to checklist**

Add at the top of `docs/TEST-CHECKLIST.md` (before Order bumps):

```markdown
## Buyer Accounts (`/portal`)

- [ ] Visit `/portal` without session → redirected to `/portal/login`
- [ ] Visit `/course/[id]` without session → redirected to `/portal/login?next=/course/[id]`
- [ ] Enter email on login page → "Check your inbox" shown
- [ ] Click magic link in email → redirected to `/portal`
- [ ] Portal shows all products purchased with that email
- [ ] Digital product → "Download" link → existing download page
- [ ] Course product → "Access course" link → `/course/[id]` (pending course impl)
- [ ] Sign out → redirected to `/portal/login`
- [ ] Visit `/portal/login` while logged in → accessible (no redirect loop)
- [ ] Purchase email contains "Access your purchases" portal link
```

- [ ] **Step 2: Run all tests**

```bash
node_modules/.bin/vitest run
```

Expected: all pass.

- [ ] **Step 3: Commit and push**

```bash
git add docs/TEST-CHECKLIST.md
git commit -m "test(buyer-auth): update test checklist"
git push
```
