"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Send, Trash2 } from "lucide-react";
import type { Subscriber, Broadcast } from "@/types";

type SegmentFilter = "all" | "lead_magnet" | "purchase" | "newsletter";
type SubscriberWithProduct = Subscriber & { products?: { name: string } | null };

export default function AudiencePage() {
  const [subscribers, setSubscribers] = useState<SubscriberWithProduct[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ segment });
    if (search) params.set("search", search);
    const res = await fetch(`/api/audience?${params}`);
    if (res.ok) setSubscribers(await res.json());
    setLoading(false);
  }, [segment, search]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);
  useEffect(() => {
    fetch("/api/audience/broadcast/history").then(r => r.ok ? r.json() : []).then(setBroadcasts);
  }, []);

  async function handleUnsubscribe(id: string) {
    await fetch(`/api/audience/${id}`, { method: "DELETE" });
    setSubscribers(prev => prev.filter(s => s.id !== id));
  }

  function handleExport() {
    const params = new URLSearchParams({ segment, export: "csv" });
    if (search) params.set("search", search);
    window.location.href = `/api/audience?${params}`;
  }

  const tabs: { id: SegmentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "purchase", label: "Buyers" },
    { id: "lead_magnet", label: "Lead magnet" },
    { id: "newsletter", label: "Newsletter" },
  ];

  const sourceBadge = (source: string) => {
    const map: Record<string, string> = {
      purchase: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      lead_magnet: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      newsletter: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return map[source] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audience</h1>
          <p className="text-sm text-muted-foreground mt-1">{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/audience/broadcast"><Send size={14} className="mr-2" />Send broadcast</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 border-b flex-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSegment(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                segment === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >{tab.label}</button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="w-40" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-1.5" />CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No subscribers yet.</td></tr>
            ) : subscribers.map(s => (
              <tr key={s.id} className={`border-t ${s.unsubscribed_at ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">{s.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadge(s.source)}`}>
                    {s.source.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {(s.products as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                  {new Date(s.subscribed_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {!s.unsubscribed_at && (
                    <button onClick={() => handleUnsubscribe(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors" title="Unsubscribe">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {broadcasts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-base">Broadcast history</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recipients</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sent</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{b.segment ?? "all"}</td>
                    <td className="px-4 py-3">{b.recipient_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(b.sent_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
