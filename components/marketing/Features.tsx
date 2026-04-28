import { Package, GraduationCap, Calendar, Users, Mail, BarChart2, Download, Globe } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Digital Products",
    desc: "Sell ebooks, templates, presets, Notion docs, Lightroom packs, Figma files, zips — anything. Automatic secure delivery after payment.",
    examples: ["PDF guides", "Design templates", "Preset packs"],
  },
  {
    icon: GraduationCap,
    title: "Online Courses",
    desc: "Build video courses with modules and lessons. Drip content, completion tracking, and certificates included. No Teachable needed.",
    examples: ["Video lessons", "Drip content", "Certificates"],
  },
  {
    icon: Calendar,
    title: "Coaching & Booking",
    desc: "Sell 1:1 or group sessions. Clients pick a time slot, pay upfront, and you get a calendar invite. No more chasing invoices.",
    examples: ["1:1 sessions", "Group calls", "Workshops"],
  },
  {
    icon: Users,
    title: "Memberships",
    desc: "Recurring monthly subscriptions with gated content. Built-in community forum — no Discord or Patreon needed.",
    examples: ["Monthly access", "Gated content", "Community"],
  },
  {
    icon: Mail,
    title: "Email & Newsletter",
    desc: "Grow your list with lead magnets. Send broadcasts, automated sequences, and product launches — all from one place.",
    examples: ["Lead magnets", "Broadcasts", "Automations"],
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Revenue, storefront views, conversion rate, top products. Understand what's selling and double down on it.",
    examples: ["Revenue stats", "Conversion rate", "Top products"],
  },
  {
    icon: Download,
    title: "Instant Delivery",
    desc: "Buyers get a secure download link immediately after payment. Time-limited, download-count limited. You're in control.",
    examples: ["Secure links", "Auto-expiry", "Download limits"],
  },
  {
    icon: Globe,
    title: "Custom Domain",
    desc: "Use your own domain on Pro. yourname.com instead of yourname.creatoroshq.com. Full DNS control, SSL included.",
    examples: ["your domain", "SSL included", "Instant setup"],
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">One platform. Every tool you need.</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Stop paying for 5 different tools. Everything is here, built to work together.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, examples }) => (
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
    </section>
  );
}
