"use client";
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCK_META } from "@/lib/lp-utils";
import type { BlockType } from "@/types/blocks";

const ADDABLE: BlockType[] = ["features", "testimonials", "faq", "text", "video", "image"];

type Props = { onAdd: (type: BlockType) => void };

export function AddBlockMenu({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen(v => !v)} className="w-full">
        <Plus size={14} className="mr-1.5" />
        Add block
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-background border rounded-lg shadow-lg overflow-hidden">
          {ADDABLE.map(type => {
            const meta = BLOCK_META[type];
            return (
              <button
                key={type}
                onClick={() => { onAdd(type); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-base">{meta.emoji}</span>
                <div>
                  <p className="font-medium leading-none">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
