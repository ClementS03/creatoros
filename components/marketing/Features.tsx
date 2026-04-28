import { Package, BarChart2, Download, Globe, Clock, GraduationCap, Calendar, Users, Mail } from "lucide-react";

const available = [
  {
    icon: Package,
    title: "Digital Products",
    desc: "Sell ebooks, templates, presets, Figma files, ZIP packs — anything. Secure automatic delivery after payment.",
    examples: ["PDF guides", "Design templates", "Preset packs"],
  },
  {
    icon: Download,
    title: "Secure Delivery",
    desc: "Buyers get a time-limited download link immediately after payment. Set a download count limit to prevent sharing.",
    examples: ["Auto-delivery", "Expiring links", "Download limits"],
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Revenue, storefront views, conversion rate, top products. Understand what's selling and double down on it.",
    examples: ["Revenue stats", "Conversion rate", "Top products"],
  },
  {
    icon: Globe,
    title: "Your Storefront",
    desc: "A beautiful public page at yourname.creatoroshq.com. Customize your brand colors, bio, and product lineup.",
    examples: ["Custom colors", "Your subdomain", "Mobile-ready"],
  },
];

const coming = [
  { icon: GraduationCap, title: "Online Courses", desc: "Video modules, drip content, completion certificates." },
  { icon: Calendar,      title: "Coaching & Booking", desc: "Sell 1:1 sessions with calendar integration and upfront payment." },
  { icon: Users,         title: "Memberships", desc: "Recurring subscriptions with gated content and community." },
  { icon: Mail,          title: "Email & Newsletter", desc: "Grow your list, send broadcasts and automations." },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 space-y-16">

        {/* Available now */}
        <div className="space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Available now</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to start selling digital products today.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {available.map(({ icon: Icon, title, desc, examples }) => (
              <div key={title} className="rounded-xl border bg-card p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {examples.map((ex) => (
                    <span key={ex} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm text-muted-foreground">
              <Clock size={13} /> Coming soon
            </div>
            <h3 className="text-2xl font-bold">More tools on the way</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coming.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card/50 p-5 space-y-3 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon size={20} className="text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-muted-foreground">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
