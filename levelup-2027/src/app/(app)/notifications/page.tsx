import Link from "next/link";
import { appContext } from "@/server/context";
import { listNotifications, unreadCount } from "@/server/notifications";
import { CATEGORY_META, type Category } from "@/domain/notify";
import { formatInstantTime, formatLocalDate, instantToLocalDate } from "@/domain/dates";
import { PageHeader, Empty } from "@/ui/bits";
import { cn } from "@/ui/cn";
import { notificationAction } from "../assistant/actions";

const PRIO = { IMPORTANT: "chip-warn", NORMAL: "chip-mute", LOW: "chip-mute" } as const;
const STATUS_LABEL: Record<string, string> = { DISMISSED: "dismissed", SUPPRESSED: "paused (work mode or setting)", EXPIRED: "expired", DEFERRED: "waiting for quiet hours to end", SNOOZED: "snoozed" };

function Op({ id, op, label, className = "btn-ghost btn-sm" }: { id?: string; op: string; label: string; className?: string }) {
  return <form action={notificationAction}>{id && <input type="hidden" name="id" value={id} />}<input type="hidden" name="op" value={op} /><button className={className}>{label}</button></form>;
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ category?: string; history?: string }> }) {
  const { user, tz } = await appContext();
  const sp = await searchParams;
  const category = sp.category && (sp.category in CATEGORY_META || sp.category === "TEST") ? sp.category : undefined;
  const history = sp.history === "1";
  const [items, unread] = await Promise.all([listNotifications(user.id, { category, includeHistory: history }), unreadCount(user.id)]);
  const cats = [...new Set(items.map((n) => n.category))] as Category[];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Notifications" title="Notification center">
        {unread > 0 && <Op op="readAll" label="Mark all read" className="btn-secondary btn-sm" />}
        <Link href="/settings/notifications" className="btn-ghost btn-sm">Settings</Link>
      </PageHeader>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Filter">
        <Link href={`/notifications${history ? "?history=1" : ""}`} aria-current={!category ? "page" : undefined} className={cn("inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold", !category ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>All{unread ? ` · ${unread} unread` : ""}</Link>
        {cats.map((c) => <Link key={c} href={`/notifications?category=${c}${history ? "&history=1" : ""}`} aria-current={category === c ? "page" : undefined} className={cn("inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold", category === c ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>{CATEGORY_META[c]?.label ?? ((c as string) === "TEST" ? "Test" : c)}</Link>)}
        <Link href={`/notifications?history=${history ? "0" : "1"}${category ? `&category=${category}` : ""}`} className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border border-ink-700 px-3 text-[13px] text-mute-400">{history ? "Hide history" : "Show history"}</Link>
      </nav>

      {items.length ? (
        <ul className="space-y-2" aria-label="Notifications">
          {items.map((n) => {
            const unreadNow = n.status === "DELIVERED" && !n.readAt;
            const when = n.deliveredAt ?? n.snoozedUntil ?? n.scheduledFor;
            return (
              <li key={n.id} className={cn("card", unreadNow && "border-go/50")}>
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", unreadNow ? "bg-go" : "bg-ink-600")} aria-label={unreadNow ? "Unread" : "Read"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-mute-300">{CATEGORY_META[n.category as Category]?.label ?? n.category}</span>
                      {n.priority === "IMPORTANT" && <span className={PRIO[n.priority]}>important</span>}
                      {n.status !== "DELIVERED" && <span className="chip-mute">{STATUS_LABEL[n.status] ?? n.status.toLowerCase()}</span>}
                    </div>
                    <p className="mt-1 text-sm">{n.detail ?? n.preview}</p>
                    <p className="mt-1 text-[11px] text-mute-400">{formatLocalDate(instantToLocalDate(when, tz), "weekday")} {formatInstantTime(when, tz)}{n.status === "SNOOZED" ? " (snoozed until)" : ""}{n.reason && n.status !== "DELIVERED" ? ` · ${n.reason}` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Link href={n.href} className="btn-secondary btn-sm">Open</Link>
                      {unreadNow && <Op id={n.id} op="read" label="Mark read" />}
                      {n.status === "DELIVERED" && <><Op id={n.id} op="snooze1h" label="Snooze 1h" /><Op id={n.id} op="snoozeTomorrow" label="Tomorrow" /></>}
                      {["DELIVERED", "SNOOZED"].includes(n.status) && <Op id={n.id} op="dismiss" label="Dismiss" />}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <Empty>{history ? "No notification history yet." : "You're all caught up."}</Empty>}
      <p className="text-xs text-mute-400">Notifications work here in the app even without push. Lock-screen and push text stays generic unless you turn on detailed previews.</p>
    </div>
  );
}
