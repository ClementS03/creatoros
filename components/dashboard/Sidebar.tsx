"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, BarChart2, Store,
  CreditCard, User, PanelLeft, LogOut, Users, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { createSupabaseBrowser } from "@/lib/supabase-client";

const nav = [
  { href: "/dashboard",                  label: "Overview",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products",         label: "Products",   icon: Package },
  { href: "/dashboard/audience",         label: "Audience",   icon: Users },
  { href: "/dashboard/storefront",       label: "Storefront", icon: Store },
  { href: "/dashboard/analytics",        label: "Analytics",  icon: BarChart2 },
];

const settingsNav = [
  { href: "/dashboard/settings/billing", label: "Billing",    icon: CreditCard },
  { href: "/dashboard/settings/email",   label: "Email",      icon: Mail },
  { href: "/dashboard/settings/account", label: "Account",    icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(JSON.parse(stored) as boolean);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(!v));
      return !v;
    });
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function NavLink({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ElementType; exact?: boolean }) {
    const active = isActive(href, exact);
    const link = (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
          collapsed && "justify-center px-2",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon size={16} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "border-r h-screen flex flex-col p-3 gap-1 shrink-0 transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}>
        {/* Logo + collapse toggle */}
        <div className={cn("flex items-center py-2 px-1 mb-1", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/dashboard" className="font-bold text-base tracking-tight">
              Creator<span className="text-primary">OS</span>
            </Link>
          )}
          <button
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
          >
            <PanelLeft size={16} />
          </button>
        </div>

        {/* Main nav */}
        <div className="flex-1 space-y-0.5">
          {nav.map((item) => <NavLink key={item.href} {...item} />)}
        </div>

        {/* Settings */}
        <div className="space-y-0.5 pt-2 border-t">
          {!collapsed && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Settings
            </p>
          )}
          {settingsNav.map((item) => <NavLink key={item.href} {...item} />)}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
