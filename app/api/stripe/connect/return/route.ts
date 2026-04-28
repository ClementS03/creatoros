import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
