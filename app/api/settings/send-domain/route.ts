import { createSupabaseServer } from "@/lib/supabase-server";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await request.json() as { domain: string };
  if (!domain?.trim() || !domain.includes(".")) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const { data, error } = await resend.domains.create({ name: domain.trim() });
  if (error || !data) {
    const msg = (error as { message?: string } | null)?.message ?? "Failed to create domain";
    const hint = msg.toLowerCase().includes("restricted")
      ? "Your Resend API key only allows sending emails. In the Resend dashboard, go to API Keys and create a new key with Full access, then update your RESEND_API_KEY environment variable."
      : msg;
    return NextResponse.json({ error: hint }, { status: 500 });
  }

  await supabase
    .from("creators")
    .update({ resend_domain_id: data.id, send_domain_verified: false, custom_send_domain: null })
    .eq("id", user.id);

  return NextResponse.json({ records: data.records });
}

export async function DELETE() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("resend_domain_id")
    .eq("id", user.id)
    .single();

  if (creator?.resend_domain_id) {
    await resend.domains.remove(creator.resend_domain_id as string).catch(() => null);
  }

  await supabase
    .from("creators")
    .update({ resend_domain_id: null, send_domain_verified: false, custom_send_domain: null })
    .eq("id", user.id);

  return new NextResponse(null, { status: 204 });
}
