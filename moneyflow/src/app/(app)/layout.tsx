import Link from "next/link";
import { loadWorkspace } from "@/lib/workspace";
import { BottomNav, SidebarNav } from "@/components/shell/Nav";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { switchWorkspace, logout } from "@/app/actions";
import { authEnabled } from "@/lib/session";
import { LogOut } from "lucide-react";
import { QuickAdd } from "@/components/QuickAdd";
import { primaryAccount } from "@/lib/overview";
import { addDays, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-brand-fg shadow-sm">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15c2.5-4 4-4 6.5-1.5S14 16 21 8" /></svg>
      </span>
      <span className="text-[17px]">MoneyFlow</span>
    </Link>
  );
}

function WorkspaceSwitch({ mode }: { mode: string }) {
  return (
    <form action={switchWorkspace} className="grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-[12px] font-semibold">
      {(["personal", "demo"] as const).map((m) => (
        <button key={m} name="mode" value={m} className={`rounded-lg py-1.5 capitalize transition ${mode === m ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"}`}>{m}</button>
      ))}
    </form>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ws = await loadWorkspace();
  const demo = ws.user.mode === "demo";
  // Quick add: most-used expense categories in the last 60 days come first.
  const since = addDays(todayISO(), -60);
  const usage = new Map<string, number>();
  for (const t of ws.transactions) if (t.type === "expense" && t.categoryId && t.date >= since) usage.set(t.categoryId, (usage.get(t.categoryId) ?? 0) + 1);
  const quick = {
    categories: ws.categories.filter((c) => !c.archived).map((c) => ({ id: c.id, name: c.name, bucket: c.bucket, color: c.color })),
    // Then everyday categories, then the rest; categories tied to recurring bills go last.
    topCategoryIds: (() => {
      const billCats = new Set(ws.bills.filter((b) => b.active && b.categoryId).map((b) => b.categoryId!));
      const everyday = ["Groceries", "Dining Out", "Gas", "Shopping", "Entertainment", "Health", "Subscriptions", "Gifts", "Utilities"];
      const live = ws.categories.filter((c) => !c.archived && c.bucket !== "income" && c.bucket !== "transfer");
      const used = [...usage.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
      const preferred = everyday.map((n) => live.find((c) => c.name === n)?.id).filter((id): id is string => !!id);
      const rest = live.filter((c) => !billCats.has(c.id)).map((c) => c.id);
      return [...new Set([...used, ...preferred, ...rest])];
    })(),
    accounts: ws.accounts.filter((a) => !a.archived && a.type !== "investment").map((a) => ({ id: a.id, name: a.name, type: a.type })),
    defaultAccountId: primaryAccount(ws)?.id ?? null,
  };
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
        <div className="mb-6 flex items-center justify-between px-2"><Logo /><ThemeToggle /></div>
        <QuickAdd variant="sidebar" {...quick} />
        <SidebarNav />
        <div className="mt-auto space-y-3 px-1">
          <WorkspaceSwitch mode={ws.user.mode} />
          <p className="px-1 text-[11px] leading-snug text-muted">{demo ? "Demo mode: fictional data only." : "Personal mode: your data, stored locally."}</p>
          {authEnabled() && (
            <form action={logout}><button className="flex items-center gap-2 px-1 text-[12px] text-muted hover:text-fg"><LogOut className="h-3.5 w-3.5" />Lock</button></form>
          )}
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/85 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <form action={switchWorkspace}>
            <button name="mode" value={demo ? "personal" : "demo"} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${demo ? "bg-warn/15 text-warn" : "bg-brand/10 text-brand"}`} title="Switch workspace">
              {demo ? "Demo" : "Personal"}
            </button>
          </form>
          <ThemeToggle />
        </div>
      </header>
      <div className="overflow-x-clip lg:pl-[248px]">
        {demo && (
          <div className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-center text-[12.5px] font-medium text-warn">
            Demo mode — every number here is fictional. Switch to Personal for your own data.
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-safe sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
      <QuickAdd variant="fab" {...quick} />
      <BottomNav />
    </div>
  );
}
