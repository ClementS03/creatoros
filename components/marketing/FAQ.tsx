const faqs = [
  {
    q: "Is there really 0% transaction fee on Pro?",
    a: "Yes. On Pro ($19/mo) and the FreelanceOS Bundle ($9/mo), we take 0% of your sales. On the free plan we take 8% — still less than Gumroad's 10%. Stripe's standard processing fees (2.9% + 30¢) still apply — those go to Stripe, not us.",
  },
  {
    q: "How does getting paid work?",
    a: "You connect your own Stripe account during onboarding (takes 5 minutes). When someone buys, Stripe sends the money directly to your account — minus our platform fee if you're on free, and minus Stripe's processing fee. You're in full control of your money.",
  },
  {
    q: "What's the FreelanceOS Bundle?",
    a: "FreelanceOS is our separate tool for freelancers — it handles clients, projects, invoicing, time tracking, and expenses. If you use both, you get CreatorOS Pro for $9/mo instead of $19/mo, plus deep integration: when you sell a coaching session, an invoice is auto-created in FreelanceOS; your coaching clients sync with your CRM; and a revenue widget appears in your FreelanceOS dashboard.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Pro and Bundle plans. Every account gets a free subdomain (yourname.creatoroshq.com). On paid plans you can connect your own domain (yourname.com). SSL is included automatically.",
  },
  {
    q: "What types of files can I sell?",
    a: "PDFs, ZIPs, images, videos, PowerPoint files, and more. Buyers get a secure time-limited download link after payment. You can set a download limit (e.g. 3 downloads max) to prevent sharing.",
  },
  {
    q: "Can I sell video courses?",
    a: "Yes. You can create multi-module courses with video lessons, drip release schedules, and completion certificates. Video hosting is included — no external tool required.",
  },
  {
    q: "How does coaching booking work?",
    a: "You define your available time slots and session price. Clients pick a slot, pay upfront, and you both get a calendar invite. No more chasing payments for sessions already delivered.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "You can start on the free plan with no credit card required. When you're ready to upgrade, it's $19/mo with no long-term commitment — cancel anytime.",
  },
  {
    q: "What happens to my products if I cancel?",
    a: "Your storefront stays up but you revert to the free plan limits (3 products, 8% fee). Your customers keep their download access. You don't lose any data.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
          <p className="text-muted-foreground">Everything you need to know before signing up.</p>
        </div>
        <div className="space-y-0 divide-y rounded-xl border overflow-hidden">
          {faqs.map(({ q, a }) => (
            <div key={q} className="p-5 space-y-2 bg-card">
              <h3 className="font-semibold">{q}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
