import { createSupabaseServer } from "@/lib/supabase-server";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase
    .from("creators")
    .select("resend_domain_id")
    .eq("id", user.id)
    .single();

  if (!creator?.resend_domain_id) {
    return NextResponse.json({ error: "No domain configured" }, { status: 400 });
  }

  const { data } = await resend.domains.get(creator.resend_domain_id as string);

  if (data?.status === "verified") {
    await supabase
      .from("creators")
      .update({ send_domain_verified: true, custom_send_domain: `hello@${data.name}` })
      .eq("id", user.id);
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false, status: data?.status });
}
