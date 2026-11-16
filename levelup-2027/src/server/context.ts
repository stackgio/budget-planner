import "server-only";
import { requireUser } from "./auth";
import { currentMode } from "./modes";
import { todayLocal } from "@/domain/dates";
import type { WorkMode } from "@/domain/modes";

export async function appContext() {
  const user = await requireUser();
  const session = await currentMode(user.id);
  const mode: WorkMode = session?.mode ?? "NORMAL";
  return { user, tz: user.timezone, today: todayLocal(user.timezone), mode, modeSession: session };
}
