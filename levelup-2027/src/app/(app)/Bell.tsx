import Link from "next/link";
import { Bell as BellIcon } from "lucide-react";

export function Bell({ unread }: { unread: number }) {
  return (
    <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-mute-300 hover:text-white">
      <BellIcon size={18} />
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-go px-1 text-[10px] font-bold text-ink-950 num">{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}
