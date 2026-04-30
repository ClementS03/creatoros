import type { TestimonialsData } from "@/types/blocks";

export function TestimonialsBlock({ data }: { data: TestimonialsData }) {
  return (
    <section className="py-10 px-4 border-t bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="bg-background rounded-xl border p-5 space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} className={j < item.rating ? "text-amber-400" : "text-muted"}>★</span>
                ))}
              </div>
              <p className="text-sm italic text-muted-foreground">"{item.quote}"</p>
              <div className="flex items-center gap-2">
                {item.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar_url} alt={item.author} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {item.author[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">{item.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
