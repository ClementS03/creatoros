"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Block, BlockType } from "@/types/blocks";
import { defaultBlocks, generateId, reorderBlocks, LOCKED_BLOCKS, BLOCK_META } from "@/lib/lp-utils";
import { BlockList } from "@/components/lp-editor/BlockList";
import { BlockForm } from "@/components/lp-editor/BlockForm";
import { AddBlockMenu } from "@/components/lp-editor/AddBlockMenu";
import { LPPreview } from "@/components/lp-editor/LPPreview";

type ProductMeta = { name: string; price: number; is_lead_magnet: boolean; cover_image_url: string | null };
type MobileTab = "blocks" | "preview";

const INITIAL_BLOCK_DATA: Record<BlockType, unknown> = {
  hero:         { headline: "", subheading: "", button_label: "Buy now" },
  features:     { title: "What's included", items: [{ icon: "✅", title: "", description: "" }] },
  testimonials: { items: [{ quote: "", author: "", rating: 5 }] },
  faq:          { items: [{ question: "", answer: "" }] },
  text:         { title: "", body: "" },
  video:        { url: "", caption: "" },
  image:        { url: "", caption: "" },
  cta:          { headline: "Ready to get started?", button_label: "Buy now" },
};

export default function LandingPageEditor() {
  const params = useParams();
  const productId = params.id as string;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductMeta | null>(null);
  const [username, setUsername] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("blocks");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch("/api/storefront").then(r => r.json()),
    ]).then(([prod, creator]) => {
      const p = prod as Record<string, unknown>;
      const existingBlocks = p.lp_blocks as Block[] | null;
      setBlocks(existingBlocks?.length ? existingBlocks : defaultBlocks(p.name as string, p.price as number));
      setProduct({
        name: p.name as string,
        price: p.price as number,
        is_lead_magnet: p.is_lead_magnet as boolean,
        cover_image_url: p.cover_image_url as string | null,
      });
      setUsername((creator as { username: string }).username ?? "");
      setLoading(false);
    });
  }, [productId]);

  const save = useCallback(async (blocksToSave: Block[]) => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lp_blocks: blocksToSave }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [productId]);

  function triggerAutoSave(newBlocks: Block[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newBlocks), 1000);
  }

  function updateBlocks(newBlocks: Block[]) {
    setBlocks(newBlocks);
    triggerAutoSave(newBlocks);
  }

  function handleAddBlock(type: BlockType) {
    const newBlock: Block = {
      id: generateId(),
      type,
      order: 0,
      data: INITIAL_BLOCK_DATA[type],
    } as Block;

    const withoutCta = blocks.filter(b => b.type !== "cta");
    const cta = blocks.find(b => b.type === "cta");
    const newList = [
      ...withoutCta,
      newBlock,
      ...(cta ? [cta] : []),
    ].map((b, i) => ({ ...b, order: i }));

    updateBlocks(newList);
    setSelectedId(newBlock.id);
  }

  function handleDelete(id: string) {
    const newList = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    updateBlocks(newList);
    if (selectedId === id) setSelectedId(null);
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const block = blocks[fromIndex];
    if ((LOCKED_BLOCKS as BlockType[]).includes(block.type)) return;
    const clampedTo = Math.max(1, Math.min(toIndex, blocks.length - 2));
    updateBlocks(reorderBlocks(blocks, fromIndex, clampedTo));
  }

  function handleBlockChange(updated: Block) {
    const newList = blocks.map(b => b.id === updated.id ? updated : b);
    updateBlocks(newList);
  }

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const storefrontBase = isLocalhost ? appUrl : appUrl.replace("://", `://${username}.`);
  const lpUrl = `${storefrontBase.replace(/\/$/, "")}/${username}/${productId}`;

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-background gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={`/dashboard/products/${productId}`}><ArrowLeft size={14} /></Link>
          </Button>
          <span className="text-sm font-medium truncate hidden sm:block">{product.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />Saving…
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={11} />Saved
            </span>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={lpUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} className="mr-1.5" />View
            </a>
          </Button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b shrink-0">
        {(["blocks", "preview"] as MobileTab[]).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              mobileTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className={`w-full lg:w-72 shrink-0 flex flex-col border-r overflow-hidden ${mobileTab === "preview" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex-1 overflow-y-auto">
            <BlockList
              blocks={blocks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          </div>

          <div className="p-3 border-t shrink-0">
            <AddBlockMenu onAdd={handleAddBlock} />
          </div>

          {selectedBlock && (
            <div className="border-t p-3 overflow-y-auto max-h-80 shrink-0">
              <BlockForm block={selectedBlock} onChange={handleBlockChange} />
            </div>
          )}
        </div>

        {/* Right panel — preview */}
        <div className={`flex-1 overflow-y-auto bg-muted/20 p-6 ${mobileTab === "blocks" ? "hidden lg:block" : "block"}`}>
          <LPPreview
            blocks={blocks}
            product={{
              cover_image_url: product.cover_image_url,
              price: product.price,
              is_lead_magnet: product.is_lead_magnet,
            }}
          />
        </div>
      </div>
    </div>
  );
}
