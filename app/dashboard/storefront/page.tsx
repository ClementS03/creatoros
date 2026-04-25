"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Creator } from "@/types";

export default function StorefrontSettingsPage() {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [brandColor, setBrandColor] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/storefront")
      .then((r) => r.json())
      .then((c: Creator) => {
        setCreator(c);
        setUsername(c.username ?? "");
        setBio(c.bio ?? "");
        setBrandColor(c.brand_color ?? "#000000");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/storefront", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio, brand_color: brandColor }),
    });
    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      setError(error ?? "Failed to save");
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  if (!creator) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Storefront</h1>
      <p className="text-sm text-muted-foreground">
        Your storefront:{" "}
        <a
          href={`https://${creator.username}.creatoroshq.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {creator.username}.creatoroshq.com
        </a>
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your audience who you are"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Brand color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-9 w-12 rounded border cursor-pointer"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="font-mono w-32"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">Saved!</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
