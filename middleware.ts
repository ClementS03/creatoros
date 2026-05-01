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
