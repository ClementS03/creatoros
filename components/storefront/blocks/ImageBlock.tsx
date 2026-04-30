import type { ImageData } from "@/types/blocks";

export function ImageBlock({ data }: { data: ImageData }) {
  if (!data.url) return null;
  return (
    <section className="py-10 px-4 border-t">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.url} alt={data.caption ?? ""} className="w-full rounded-xl border object-cover" />
        {data.caption && (
          <p className="text-xs text-muted-foreground text-center">{data.caption}</p>
        )}
      </div>
    </section>
  );
}
