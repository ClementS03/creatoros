export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Create your storefront",
      desc: "Sign up, pick your username, and customize your page with your brand colors. Your storefront is live at yourname.creatoroshq.com — instantly.",
    },
    {
      step: "02",
      title: "Add what you're selling",
      desc: "Upload a PDF ebook, set up a coaching session, create a course with video lessons, or launch a membership. All from the same dashboard.",
    },
    {
      step: "03",
      title: "Share one link. Get paid.",
      desc: "Send your followers to your storefront. They pay via Stripe, you get the money directly in your account. We handle delivery, receipts, and downloads.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Up and running in 5 minutes</h2>
          <p className="text-muted-foreground text-lg">No tech skills required.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="space-y-4">
              <span className="text-5xl font-black text-primary/20">{step}</span>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
