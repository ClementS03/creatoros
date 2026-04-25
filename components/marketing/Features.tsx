import {
  Package,
  GraduationCap,
  Calendar,
  Users,
  Mail,
  BarChart2,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Digital Products",
    desc: "Sell ebooks, templates, presets, and any file. Automatic delivery post-purchase.",
  },
  {
    icon: GraduationCap,
    title: "Online Courses",
    desc: "Video modules, drip content, completion certificates. Built-in — no third-party tools.",
  },
  {
    icon: Calendar,
    title: "Booking & Coaching",
    desc: "1:1 and group sessions. Calendar integration, auto-payment before confirmation.",
  },
  {
    icon: Users,
    title: "Memberships & Community",
    desc: "Recurring subscriptions with gated content. Built-in forum — no Discord needed.",
  },
  {
    icon: Mail,
    title: "Email & Newsletter",
    desc: "Grow your list with lead magnets. Broadcasts and automation included.",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Revenue, storefront views, conversion rate. See what's working.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          One platform. Every tool you need.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
