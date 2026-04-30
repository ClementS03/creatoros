import type { FAQData } from "@/types/blocks";

export function FAQBlock({ data }: { data: FAQData }) {
  return (
    <section className="py-10 px-4 border-t">
      <div className="max-w-3xl mx-auto space-y-3">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently asked questions</h2>
        {data.items.map((item, i) => (
          <details key={i} className="group border rounded-lg overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer font-medium text-sm list-none hover:bg-muted/40 transition-colors">
              {item.question}
              <span className="ml-2 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
