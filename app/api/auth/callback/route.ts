import { createSupabaseServer } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Send welcome email to brand-new users (created within last 60s)
    const user = data?.user;
    if (user?.email && user.created_at) {
      const isNew = Date.now() - new Date(user.created_at).getTime() < 60_000;
      if (isNew) {
        const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
        sendWelcomeEmail({ to: user.email, name }).catch(() => null);
      }
    }
  }

  // Only allow relative paths to prevent open redirect
  const safePath = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safePath, request.url));
}
