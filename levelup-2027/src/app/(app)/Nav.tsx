"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bot, LineChart, CalendarDays, CheckSquare, Home, MoreHorizontal, Settings, Target, Wallet, X } from "lucide-react";
import { cn } from "@/ui/cn";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/reviews", label: "Reviews", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
const PRIMARY = ["/", "/calendar", "/tasks", "/money"];

const active = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-ink-800 px-3 py-6 lg:flex">
      <Link href="/" className="mb-8 px-3 font-display text-lg font-extrabold tracking-tight">
        LEVEL UP <span className="text-go">2027</span>
      </Link>
      <ul className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(path, href) ? "page" : undefined}
              className={cn("flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", active(path, href) ? "bg-ink-800 text-white" : "text-mute-400 hover:bg-ink-850 hover:text-white")}
            >
              <Icon size={18} className={active(path, href) ? "text-go" : undefined} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const moreActive = !PRIMARY.some((h) => active(path, h));
  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {ITEMS.filter((i) => PRIMARY.includes(i.href)).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={active(path, href) ? "page" : undefined} className={cn("flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium", active(path, href) ? "text-go" : "text-mute-400")}>
                <Icon size={21} />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setMore(true)} aria-expanded={more} className={cn("flex min-h-[56px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium", moreActive ? "text-go" : "text-mute-400")}>
              <MoreHorizontal size={21} />
              More
            </button>
          </li>
        </ul>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-ink-700 bg-ink-850 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="eyebrow">More</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setMore(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {ITEMS.filter((i) => !PRIMARY.includes(i.href)).map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setMore(false)} className={cn("flex min-h-[56px] items-center gap-3 rounded-2xl border border-ink-700 px-4 text-sm font-semibold", active(path, href) ? "border-go/50 text-go" : "text-white")}>
                    <Icon size={18} /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
