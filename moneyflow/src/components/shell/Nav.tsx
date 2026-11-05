"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight, CalendarClock, CreditCard, Gauge, LayoutGrid, Landmark, LineChart, PieChart, Settings, Target, TrendingUp, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, NAV } from "./nav-items";

const ICONS = {
  home: Gauge, wallet: Wallet, pie: PieChart, swap: ArrowLeftRight, bank: Landmark, calendar: CalendarClock,
  trend: TrendingUp, card: CreditCard, target: Target, chart: LineChart, settings: Settings, grid: LayoutGrid,
} as const;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function SidebarNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const Icon = ICONS[n.icon];
        const active = isActive(path, n.href);
        return (
          <Link key={n.href} href={n.href}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2 hover:text-fg")}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const moreActive = !MOBILE_NAV.some((n) => n.href !== "/more" && isActive(path, n.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-xl lg:hidden bottom-safe" aria-label="Primary">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {MOBILE_NAV.map((n) => {
          const Icon = ICONS[n.icon];
          const active = n.href === "/more" ? moreActive : isActive(path, n.href);
          return (
            <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium", active ? "text-brand" : "text-muted")}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.8} />
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
