import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendBroadcastEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { subject: string; body: string; segment: string; product_id?: string };
  const { subject, body: emailBody, segment = "all", product_id } = body;

  if (!subject?.trim() || !emailBody?.trim()) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("email, full_name, send_domain_verified, custom_send_domain")
    .eq("id", user.id)
    .single();

  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  let query = supabaseAdmin
    .from("subscribers")
    .select("email, name, unsubscribe_token")
    .eq("creator_id", user.id)
    .is("unsubscribed_at", null);

  if (segment !== "all") query = query.eq("source", segment);
  if (product_id) query = query.eq("product_id", product_id);

  const { data: subscribers } = await query;
  const recipients = subscribers ?? [];

  if (recipients.length === 0) return NextResponse.json({ ok: true, recipientCount: 0 });

  const fromEmail = (creator.send_domain_verified as boolean) && creator.custom_send_domain
    ? creator.custom_send_domain as string
    : "hello@creatoroshq.com";

  await sendBroadcastEmail({
    recipients: recipients.map(r => ({
      email: r.email as string,
      name: r.name as string | null,
      unsubscribeToken: r.unsubscribe_token as string,
    })),
    subject,
    body: emailBody,
    fromName: (creator.full_name as string | null) ?? "Creator",
    fromEmail,
    replyTo: creator.email as string,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  });

  await supabaseAdmin.from("broadcasts").insert({
    creator_id: user.id,
    subject,
    body: emailBody,
    segment,
    product_id: product_id ?? null,
    recipient_count: recipients.length,
  });

  return NextResponse.json({ ok: true, recipientCount: recipients.length });
}
