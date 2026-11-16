import { appContext } from "@/server/context";
import { BottomNav, SideNav } from "./Nav";
import { ModeBanner } from "./ModeBanner";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { mode, modeSession, tz } = await appContext();
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6 lg:pb-12 lg:pt-8">
          <ModeBanner mode={mode} session={modeSession} tz={tz} />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
