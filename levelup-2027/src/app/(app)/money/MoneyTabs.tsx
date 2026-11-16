"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/cn";

const TABS = [
  { href: "/money", label: "Overview" },
  { href: "/money/payroll", label: "Regular Payroll" },
  { href: "/money/overtime", label: "Overtime Payroll" },
  { href: "/money/extra", label: "Extra Paycheck" },
  { href: "/money/challenges", label: "Challenges" },
];

export function MoneyTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Money sections" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}
          className={cn("inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold", path === t.href ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
