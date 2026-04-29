import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let message = "Invalid or expired unsubscribe link.";
  let success = false;

  if (token) {
    const { data } = await supabaseAdmin
      .from("subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .is("unsubscribed_at", null)
      .select("id")
      .single();

    if (data) {
      message = "You've been unsubscribed. You won't receive any more emails.";
      success = true;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-2xl">{success ? "✅" : "❌"}</p>
        <h1 className="text-xl font-semibold">{success ? "Unsubscribed" : "Something went wrong"}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
