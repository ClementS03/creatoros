import type { TextData } from "@/types/blocks";

export function TextBlock({ data }: { data: TextData }) {
  return (
    <section className="py-10 px-4 border-t">
      <div className="max-w-3xl mx-auto">
        {data.title && <h2 className="text-2xl font-bold mb-4">{data.title}</h2>}
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.body}</p>
      </div>
    </section>
  );
}
