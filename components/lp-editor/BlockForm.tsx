"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Block, FeaturesItem, TestimonialItem, FAQItem } from "@/types/blocks";
import { BLOCK_META } from "@/lib/lp-utils";

type Props = {
  block: Block;
  onChange: (updated: Block) => void;
};

export function BlockForm({ block, onChange }: Props) {
  function set(data: Partial<typeof block.data>) {
    onChange({ ...block, data: { ...block.data, ...data } } as Block);
  }

  const title = BLOCK_META[block.type].label;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
        Edit: {title}
      </p>

      {block.type === "hero" && (
        <>
          <Field label="Headline *">
            <Input value={block.data.headline} onChange={e => set({ headline: e.target.value })} placeholder="Your product name" />
          </Field>
          <Field label="Subheading">
            <textarea className="w-full min-h-[64px] rounded-md border bg-background px-3 py-2 text-sm" value={block.data.subheading} onChange={e => set({ subheading: e.target.value })} placeholder="A short description..." />
          </Field>
          <Field label="Button label">
            <Input value={block.data.button_label} onChange={e => set({ button_label: e.target.value })} placeholder="Buy now" />
          </Field>
        </>
      )}

      {block.type === "features" && (
        <>
          <Field label="Section title">
            <Input value={block.data.title} onChange={e => set({ title: e.target.value })} placeholder="What's included" />
          </Field>
          <div className="space-y-2">
            <Label className="text-xs">Items</Label>
            {(block.data.items as FeaturesItem[]).map((item, i) => (
              <div key={i} className="border rounded-md p-2 space-y-1.5 bg-muted/20">
                <div className="flex gap-1.5">
                  <Input value={item.icon} onChange={e => {
                    const items = [...block.data.items as FeaturesItem[]];
                    items[i] = { ...item, icon: e.target.value };
                    set({ items });
                  }} placeholder="✅" className="w-12 text-center px-1" />
                  <Input value={item.title} onChange={e => {
                    const items = [...block.data.items as FeaturesItem[]];
                    items[i] = { ...item, title: e.target.value };
                    set({ items });
                  }} placeholder="Feature title" className="flex-1" />
                  <button onClick={() => {
                    const items = (block.data.items as FeaturesItem[]).filter((_, j) => j !== i);
                    set({ items });
                  }} className="text-muted-foreground hover:text-destructive shrink-0"><X size={13} /></button>
                </div>
                <Input value={item.description} onChange={e => {
                  const items = [...block.data.items as FeaturesItem[]];
                  items[i] = { ...item, description: e.target.value };
                  set({ items });
                }} placeholder="Short description..." className="text-xs h-7" />
              </div>
            ))}
            {(block.data.items as FeaturesItem[]).length < 8 && (
              <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => {
                const items = [...block.data.items as FeaturesItem[], { icon: "", title: "", description: "" }];
                set({ items });
              }}><Plus size={11} className="mr-1" />Add item</Button>
            )}
          </div>
        </>
      )}

      {block.type === "testimonials" && (
        <div className="space-y-2">
          <Label className="text-xs">Testimonials</Label>
          {(block.data.items as TestimonialItem[]).map((item, i) => (
            <div key={i} className="border rounded-md p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1.5 items-start">
                <textarea className="flex-1 min-h-[60px] rounded-md border bg-background px-2 py-1.5 text-xs" value={item.quote} onChange={e => {
                  const items = [...block.data.items as TestimonialItem[]];
                  items[i] = { ...item, quote: e.target.value };
                  set({ items });
                }} placeholder="Customer quote..." />
                <button onClick={() => {
                  const items = (block.data.items as TestimonialItem[]).filter((_, j) => j !== i);
                  set({ items });
                }} className="text-muted-foreground hover:text-destructive shrink-0 mt-1"><X size={13} /></button>
              </div>
              <div className="flex gap-1.5">
                <Input value={item.author} onChange={e => {
                  const items = [...block.data.items as TestimonialItem[]];
                  items[i] = { ...item, author: e.target.value };
                  set({ items });
                }} placeholder="Author name" className="flex-1 h-7 text-xs" />
                <select value={item.rating} onChange={e => {
                  const items = [...block.data.items as TestimonialItem[]];
                  items[i] = { ...item, rating: Number(e.target.value) };
                  set({ items });
                }} className="h-7 rounded-md border bg-background text-xs px-1">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                </select>
              </div>
              <Input value={item.avatar_url ?? ""} onChange={e => {
                const items = [...block.data.items as TestimonialItem[]];
                items[i] = { ...item, avatar_url: e.target.value };
                set({ items });
              }} placeholder="Avatar URL (optional)" className="h-7 text-xs" />
            </div>
          ))}
          {(block.data.items as TestimonialItem[]).length < 10 && (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => {
              const items = [...block.data.items as TestimonialItem[], { quote: "", author: "", rating: 5 }];
              set({ items });
            }}><Plus size={11} className="mr-1" />Add testimonial</Button>
          )}
        </div>
      )}

      {block.type === "faq" && (
        <div className="space-y-2">
          <Label className="text-xs">Questions</Label>
          {(block.data.items as FAQItem[]).map((item, i) => (
            <div key={i} className="border rounded-md p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1.5 items-center">
                <Input value={item.question} onChange={e => {
                  const items = [...block.data.items as FAQItem[]];
                  items[i] = { ...item, question: e.target.value };
                  set({ items });
                }} placeholder="Question?" className="flex-1 h-7 text-xs" />
                <button onClick={() => {
                  const items = (block.data.items as FAQItem[]).filter((_, j) => j !== i);
                  set({ items });
                }} className="text-muted-foreground hover:text-destructive shrink-0"><X size={13} /></button>
              </div>
              <textarea className="w-full min-h-[48px] rounded-md border bg-background px-2 py-1.5 text-xs" value={item.answer} onChange={e => {
                const items = [...block.data.items as FAQItem[]];
                items[i] = { ...item, answer: e.target.value };
                set({ items });
              }} placeholder="Answer..." />
            </div>
          ))}
          {(block.data.items as FAQItem[]).length < 15 && (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => {
              const items = [...block.data.items as FAQItem[], { question: "", answer: "" }];
              set({ items });
            }}><Plus size={11} className="mr-1" />Add question</Button>
          )}
        </div>
      )}

      {block.type === "text" && (
        <>
          <Field label="Title (optional)">
            <Input value={block.data.title ?? ""} onChange={e => set({ title: e.target.value })} placeholder="Section title" />
          </Field>
          <Field label="Body *">
            <textarea className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm" value={block.data.body} onChange={e => set({ body: e.target.value })} placeholder="Write your content here..." />
          </Field>
        </>
      )}

      {block.type === "video" && (
        <>
          <Field label="Video URL *">
            <Input value={block.data.url} onChange={e => set({ url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
          </Field>
          <Field label="Caption (optional)">
            <Input value={block.data.caption ?? ""} onChange={e => set({ caption: e.target.value })} placeholder="Short description of the video" />
          </Field>
        </>
      )}

      {block.type === "image" && (
        <>
          <Field label="Image URL *">
            <Input value={block.data.url} onChange={e => set({ url: e.target.value })} placeholder="https://example.com/image.jpg" />
          </Field>
          <Field label="Caption (optional)">
            <Input value={block.data.caption ?? ""} onChange={e => set({ caption: e.target.value })} placeholder="Image caption" />
          </Field>
        </>
      )}

      {block.type === "cta" && (
        <>
          <Field label="Headline">
            <Input value={block.data.headline} onChange={e => set({ headline: e.target.value })} placeholder="Ready to get started?" />
          </Field>
          <Field label="Button label">
            <Input value={block.data.button_label} onChange={e => set({ button_label: e.target.value })} placeholder="Buy now" />
          </Field>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
