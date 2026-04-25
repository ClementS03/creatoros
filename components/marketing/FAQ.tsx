const faqs = [
  {
    q: "Is there really no transaction fee on Pro?",
    a: "Correct. On Pro ($19/mo) and the FreelanceOS Bundle ($9/mo), we take 0% of your sales. On the free plan, we take 8% — which is still less than Gumroad's 10%.",
  },
  {
    q: "How does Stripe Connect work?",
    a: "You connect your own Stripe account during onboarding. Payments go directly to your Stripe account (minus our platform fee on free). You control your money.",
  },
  {
    q: "What's the FreelanceOS Bundle?",
    a: "If you use FreelanceOS (our freelance management tool), you can get CreatorOS Pro for just $9/mo instead of $19. Plus you get deep integration: auto-invoicing, CRM sync, and revenue widgets.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Pro and Bundle plans. You get a free subdomain (username.creatoroshq.com) on all plans, and you can connect a custom domain on paid plans.",
  },
  {
    q: "Do I need to host videos myself?",
    a: "No. Video hosting for courses is included via our infrastructure. Upload your videos and we handle the rest.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q} className="space-y-2">
              <h3 className="font-semibold">{q}</h3>
              <p className="text-muted-foreground text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
