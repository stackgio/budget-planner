"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { UserError } from "@/server/payroll";
import { dismissSuggestion, saveDailyReflection, type Answer } from "@/server/assistant";
import { activeProvider } from "@/server/assistant-provider";
import { dismissNotification, markRead, savePrefs, sendSimulatedTest, snoozeNotification } from "@/server/notifications";
import { run, type ActionState } from "@/ui/actions";
import { addDays, isLocalDate, isTime, todayLocal, zonedToInstant } from "@/domain/dates";
import { ALL_CATEGORIES, BRIEFING_SECTIONS, type Category } from "@/domain/notify";

const done = () => revalidatePath("/", "layout");

export type AskState = { answer?: Answer; error?: string; question?: string } | null;

/** Read-only: answers from stored records. Questions and answers are not stored. */
export async function askAction(_p: AskState, fd: FormData): Promise<AskState> {
  const user = await requireUser();
  const question = String(fd.get("question") ?? "").trim().slice(0, 300);
  if (!question) return { error: "Ask a question first." };
  try {
    return { question, answer: await activeProvider().ask({ ownerId: user.id, tz: user.timezone, today: todayLocal(user.timezone), question }) };
  } catch {
    return { question, error: "I couldn't answer that right now." };
  }
}

export async function dismissSuggestionAction(fd: FormData) {
  const user = await requireUser();
  const day = String(fd.get("day") ?? "");
  if (!isLocalDate(day)) return;
  await dismissSuggestion(user.id, day, String(fd.get("itemKey") ?? ""));
  done();
}

export async function saveReflectionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const day = String(fd.get("day") ?? "");
    if (!isLocalDate(day)) throw new UserError("Invalid date.");
    const answers: Record<string, string> = {};
    for (const [k, v] of fd.entries()) if (k.startsWith("q:")) answers[k.slice(2)] = String(v);
    await saveDailyReflection(user.id, day, String(fd.get("body") ?? ""), answers);
    return "Saved privately (encrypted).";
  });
  done();
  return r;
}

export async function notificationAction(fd: FormData) {
  const user = await requireUser();
  const op = z.enum(["read", "readAll", "dismiss", "snooze1h", "snoozeEvening", "snoozeTomorrow"]).parse(fd.get("op"));
  const id = String(fd.get("id") ?? "");
  const tz = user.timezone;
  const today = todayLocal(tz);
  if (op === "readAll") await markRead(user.id, "all");
  else if (op === "read") await markRead(user.id, id);
  else if (op === "dismiss") await dismissNotification(user.id, id);
  else {
    const until = op === "snooze1h" ? new Date(Date.now() + 3_600_000)
      : op === "snoozeEvening" ? (zonedToInstant(today, "18:00", tz) > new Date() ? zonedToInstant(today, "18:00", tz) : zonedToInstant(addDays(today, 1), "18:00", tz))
      : zonedToInstant(addDays(today, 1), "08:00", tz);
    await snoozeNotification(user.id, id, until);
  }
  done();
}

export async function prefsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const qs = String(fd.get("quietStart") ?? ""), qe = String(fd.get("quietEnd") ?? "");
    if (!isTime(qs) || !isTime(qe)) throw new UserError("Quiet hours need valid times.");
    const rule = (k: string) => z.enum(["ALL", "IMPORTANT_ONLY"]).parse(fd.get(k) ?? "IMPORTANT_ONLY");
    const enabled = new Set(fd.getAll("category").map(String));
    await savePrefs(user.id, {
      quietStart: qs, quietEnd: qe,
      categories: Object.fromEntries(ALL_CATEGORIES.map((c) => [c, enabled.has(c)])) as Record<Category, boolean>,
      modeRules: { OVERTIME: rule("mode_OVERTIME"), ACTIVATION: rule("mode_ACTIVATION"), RECOVERY: rule("mode_RECOVERY") },
      previewDetail: fd.get("previewDetail") === "on",
      briefingEnabled: enabled.has("BRIEFING"), checkInEnabled: enabled.has("CHECKIN"), reflectionEnabled: enabled.has("REFLECTION"),
      briefingSections: fd.getAll("section").map(String).filter((s) => (BRIEFING_SECTIONS as readonly string[]).includes(s)),
    });
    return "Saved. Changes apply to reminders not yet delivered.";
  });
  done();
  return r;
}

export async function testNotificationAction(_p: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const t = await sendSimulatedTest(user.id);
    return `Simulated test added to your notification center. ${t.devices ? `${t.devices} device${t.devices === 1 ? "" : "s"} would receive a push` : "No devices have push turned on"} — nothing was sent.`;
  });
  revalidatePath("/", "layout");
  return r;
}
