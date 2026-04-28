"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowser } from "@/lib/supabase-client";

export default function AccountSettingsPage() {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  async function handleDelete() {
    if (confirm !== "DELETE") return;
    setDeleting(true);
    setError(null);

    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json() as { error: string };
      setError(d.error ?? "Failed to delete account");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/login?deleted=true";
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings.</p>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data — storefront, products, orders, analytics. This action cannot be undone.
          </p>
        </div>

        {!showConfirm ? (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="border-destructive/50 focus:ring-destructive"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirm !== "DELETE" || deleting}
              >
                {deleting ? "Deleting…" : "Confirm deletion"}
              </Button>
              <Button variant="outline" onClick={() => { setShowConfirm(false); setConfirm(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
