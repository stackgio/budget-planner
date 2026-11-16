import "server-only";
import { requireUser } from "./auth";
import { currentMode } from "./modes";
import { instantToLocalDate, todayLocal } from "@/domain/dates";
import type { WorkMode } from "@/domain/modes";

export async function appContext() {
  const user = await requireUser();
  const session = await currentMode(user.id);
  const mode: WorkMode = session?.mode ?? "NORMAL";
  // Paydays before the account existed are history, not to-dos: never prompt for them.
  const trackingStart = instantToLocalDate(user.createdAt, user.timezone);
  return { user, tz: user.timezone, today: todayLocal(user.timezone), mode, modeSession: session, trackingStart };
}
