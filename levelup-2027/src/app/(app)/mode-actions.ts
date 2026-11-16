"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { switchMode } from "@/server/modes";
import { shiftOccurrence } from "@/server/calendar";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate, isTime, zonedToInstant } from "@/domain/dates";
import { UserError } from "@/server/payroll";

const schema = z.object({
  mode: z.enum(["NORMAL", "OVERTIME", "ACTIVATION", "RECOVERY"]),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function startModeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let sessionId: string | undefined;
  let mode: string | undefined;
  const res = await run(async () => {
    const i = schema.parse(Object.fromEntries(fd));
    let estimatedEnd: Date | null = null;
    if (i.endTime) {
      if (!i.endDate || !isLocalDate(i.endDate) || !i.endTime || !isTime(i.endTime)) throw new UserError("Enter both an end date and time, or leave both blank.");
      estimatedEnd = zonedToInstant(i.endDate, i.endTime, user.timezone);
    }
    const s = await switchMode(user.id, i.mode, { estimatedEnd, notes: i.notes || null });
    sessionId = s?.id;
    mode = i.mode;
  });
  revalidatePath("/", "layout");
  if (res?.ok && sessionId && (mode === "ACTIVATION" || mode === "OVERTIME")) redirect(`/modes/${sessionId}`);
  return res;
}

export async function quickModeAction(fd: FormData) {
  const user = await requireUser();
  const mode = z.enum(["NORMAL", "OVERTIME", "RECOVERY"]).parse(fd.get("mode"));
  await switchMode(user.id, mode);
  revalidatePath("/", "layout");
}

export async function postponeOccurrenceAction(fd: FormData) {
  const user = await requireUser();
  const eventId = z.string().min(1).parse(fd.get("eventId"));
  const originalStart = z.string().datetime().parse(fd.get("originalStart"));
  const days = z.coerce.number().int().min(-30).max(30).parse(fd.get("days") ?? 1);
  await shiftOccurrence(user.id, eventId, originalStart, days);
  revalidatePath("/", "layout");
}
