import type { FeaturesData } from "@/types/blocks";

export function FeaturesBlock({ data }: { data: FeaturesData }) {
  return (
    <section className="py-10 px-4 border-t">
      <div className="max-w-3xl mx-auto">
        {data.title && (
          <h2 className="text-2xl font-bold mb-8 text-center">{data.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              {item.icon && <span className="text-2xl shrink-0">{item.icon}</span>}
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
