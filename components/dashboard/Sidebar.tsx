"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BarChart2,
  Store,
  Settings,
  CreditCard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard",                    label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/products",           label: "Products",   icon: Package },
  { href: "/dashboard/storefront",         label: "Storefront", icon: Store },
  { href: "/dashboard/analytics",          label: "Analytics",  icon: BarChart2 },
];

const settingsNav = [
  { href: "/dashboard/settings/billing",   label: "Billing",    icon: CreditCard },
  { href: "/dashboard/settings/account",   label: "Account",    icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) => cn(
    "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
    (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/"))
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  );

  return (
    <aside className="w-56 border-r h-screen flex flex-col p-4 gap-1 shrink-0">
      <Link href="/dashboard" className="font-bold text-lg px-2 py-3">
        Creator<span className="text-primary">OS</span>
      </Link>

      <div className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon size={16} />{label}
          </Link>
        ))}
      </div>

      <div className="space-y-1 pt-2 border-t">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Settings</p>
        {settingsNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon size={16} />{label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
