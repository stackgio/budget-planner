import { appContext } from "@/server/context";
import { BottomNav, SideNav } from "./Nav";
import { ModeBanner } from "./ModeBanner";
import { Bell } from "./Bell";
import { unreadCount } from "@/server/notifications";
import { ServiceWorker } from "./ServiceWorker";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { mode, modeSession, tz, user } = await appContext();
  const unread = await unreadCount(user.id);
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6 lg:pb-12 lg:pt-8">
          <div className="float-right ml-3"><Bell unread={unread} /></div>
          <ModeBanner mode={mode} session={modeSession} tz={tz} />
          {children}
        </main>
      </div>
      <BottomNav />
      <ServiceWorker />
    </div>
  );
}
