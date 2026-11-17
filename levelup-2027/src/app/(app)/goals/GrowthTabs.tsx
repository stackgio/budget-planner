"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/cn";

const TABS = [
  { href: "/goals", label: "Goals" },
  { href: "/goals/fitness", label: "Fitness" },
  { href: "/goals/faith", label: "Faith" },
  { href: "/goals/relationship", label: "Relationship" },
  { href: "/goals/education", label: "Education" },
  { href: "/goals/career", label: "Career" },
  { href: "/goals/growth", label: "Growth" },
];

export function GrowthTabs() {
  const path = usePathname();
  const active = (h: string) => (h === "/goals" ? path === "/goals" || /^\/goals\/c[a-z0-9]{20,}/.test(path) : path.startsWith(h));
  return (
    <nav aria-label="Goals sections" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined}
          className={cn("inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold", active(t.href) ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
