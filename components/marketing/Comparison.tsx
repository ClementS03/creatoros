import { Check, X, Minus } from "lucide-react";

type Val = "yes" | "no" | "partial";

const rows: { feature: string; creatorOS: Val; stan: Val; gumroad: Val; linktree: Val }[] = [
  { feature: "Digital products",       creatorOS: "yes", stan: "yes", gumroad: "yes",     linktree: "no" },
  { feature: "Online courses",         creatorOS: "yes", stan: "yes", gumroad: "no",      linktree: "no" },
  { feature: "Coaching & booking",     creatorOS: "yes", stan: "yes", gumroad: "no",      linktree: "no" },
  { feature: "Memberships",            creatorOS: "yes", stan: "no",  gumroad: "no",      linktree: "no" },
  { feature: "Email list built-in",    creatorOS: "yes", stan: "yes", gumroad: "partial", linktree: "no" },
  { feature: "0% transaction fees",    creatorOS: "yes", stan: "yes", gumroad: "partial", linktree: "yes" },
  { feature: "Custom domain",          creatorOS: "yes", stan: "yes", gumroad: "yes",     linktree: "yes" },
  { feature: "Revenue analytics",      creatorOS: "yes", stan: "yes", gumroad: "partial", linktree: "no" },
  { feature: "Community / forum",      creatorOS: "yes", stan: "no",  gumroad: "no",      linktree: "no" },
  { feature: "FreelanceOS integration",creatorOS: "yes", stan: "no",  gumroad: "no",      linktree: "no" },
  { feature: "Price",                  creatorOS: "yes", stan: "no",  gumroad: "partial", linktree: "partial" },
];

const priceRow = {
  creatorOS: "$19/mo",
  stan: "$29/mo",
  gumroad: "$10/mo + 0% or free + 10%",
  linktree: "$9/mo (links only)",
};

function Cell({ val }: { val: Val }) {
  if (val === "yes") return <Check size={16} className="text-green-500 mx-auto" />;
  if (val === "no") return <X size={16} className="text-red-400 mx-auto" />;
  return <Minus size={16} className="text-yellow-500 mx-auto" />;
}

export function Comparison() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How we compare</h2>
          <p className="text-muted-foreground text-lg">
            More features. Lower price. Honest comparison.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold w-52">Feature</th>
                <th className="p-4 text-center font-bold text-primary w-32">
                  CreatorOS
                </th>
                <th className="p-4 text-center text-muted-foreground w-32">Stan.store</th>
                <th className="p-4 text-center text-muted-foreground w-32">Gumroad</th>
                <th className="p-4 text-center text-muted-foreground w-32">Linktree</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ feature, creatorOS, stan, gumroad, linktree }) =>
                feature === "Price" ? (
                  <tr key="price" className="border-b bg-muted/20">
                    <td className="p-4 font-semibold">Monthly price</td>
                    <td className="p-4 text-center font-bold text-primary">{priceRow.creatorOS}</td>
                    <td className="p-4 text-center text-muted-foreground">{priceRow.stan}</td>
                    <td className="p-4 text-center text-muted-foreground text-xs">{priceRow.gumroad}</td>
                    <td className="p-4 text-center text-muted-foreground text-xs">{priceRow.linktree}</td>
                  </tr>
                ) : (
                  <tr key={feature} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-muted-foreground">{feature}</td>
                    <td className="p-4"><Cell val={creatorOS} /></td>
                    <td className="p-4"><Cell val={stan} /></td>
                    <td className="p-4"><Cell val={gumroad} /></td>
                    <td className="p-4"><Cell val={linktree} /></td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Comparison based on publicly available information. Prices as of 2026.
        </p>
      </div>
    </section>
  );
}
