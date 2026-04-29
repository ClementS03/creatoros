"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Segment = "all" | "lead_magnet" | "purchase" | "newsletter";

export default function BroadcastPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [confirming, setConfirming] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    const res = await fetch("/api/audience/broadcast/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segment }),
    });
    if (res.ok) {
      const { recipientCount: count } = await res.json() as { recipientCount: number };
      setRecipientCount(count);
      setConfirming(true);
    }
  }

  async function handleSend() {
    setSending(true);
    const res = await fetch("/api/audience/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, segment }),
    });
    if (res.ok) {
      toast.success(`Sent to ${recipientCount} subscriber${recipientCount !== 1 ? "s" : ""}!`);
      router.push("/dashboard/audience");
    } else {
      const data = await res.json() as { error?: string };
      toast.error(data.error ?? "Failed to send");
      setSending(false);
    }
  }

  const segmentOptions: { value: Segment; label: string }[] = [
    { value: "all", label: "All subscribers" },
    { value: "purchase", label: "Buyers only" },
    { value: "lead_magnet", label: "Lead magnet subscribers" },
    { value: "newsletter", label: "Newsletter subscribers" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/audience"><ArrowLeft size={14} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Send broadcast</h1>
      </div>

      <form onSubmit={handlePreview} className="space-y-5">
        <div className="space-y-2">
          <Label>To</Label>
          <select value={segment} onChange={e => setSegment(e.target.value as Segment)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            {segmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bc-subject">Subject <span className="text-destructive">*</span></Label>
          <Input id="bc-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your subject line" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bc-body">Message <span className="text-destructive">*</span></Label>
          <textarea id="bc-body"
            className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm"
            value={body} onChange={e => setBody(e.target.value)}
            placeholder={`Hi {{name}},\n\nYour message here…`} required />
          <p className="text-xs text-muted-foreground">Variable: <code className="bg-muted px-1 rounded">{"{{name}}"}</code></p>
        </div>
        {body && (
          <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
            <p className="text-sm font-medium">{subject || "No subject"}</p>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</div>
          </div>
        )}
        <Button type="submit" disabled={!subject.trim() || !body.trim()}>
          <Send size={14} className="mr-2" />Review and send
        </Button>
      </form>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-base">Send broadcast?</h2>
            <p className="text-sm text-muted-foreground">
              This will send <strong>{recipientCount}</strong> email{recipientCount !== 1 ? "s" : ""} to your{" "}
              {segment === "all" ? "entire audience" : `${segment.replace("_", " ")} segment`}.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSend} disabled={sending}>
                {sending ? "Sending…" : `Send to ${recipientCount}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
