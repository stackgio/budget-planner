/**
 * Adaptive work modes. Rules here only *suggest*; nothing is deleted or rescheduled silently.
 */
import type { Occurrence } from "./calendar";
import { overlaps } from "./calendar";

export type WorkMode = "NORMAL" | "OVERTIME" | "ACTIVATION" | "RECOVERY";

export const MODE_META: Record<WorkMode, { label: string; blurb: string; tone: "go" | "warn" | "bad" | "calm" }> = {
  NORMAL: { label: "Normal", blurb: "Regular schedule.", tone: "go" },
  OVERTIME: { label: "Overtime", blurb: "Long shift. Optional items are paused and sleep is protected.", tone: "warn" },
  ACTIVATION: { label: "Activated", blurb: "Special-team activation. Only essentials are shown.", tone: "bad" },
  RECOVERY: { label: "Recovery", blurb: "Lighter day. Sleep and recovery come first.", tone: "calm" },
};

/** Optional reminders/habits are paused in every non-normal mode. */
export function suppressOptional(mode: WorkMode): boolean {
  return mode !== "NORMAL";
}

/** Gig driving is discouraged while fatigued. */
export function discourageGig(mode: WorkMode): boolean {
  return mode !== "NORMAL";
}

export type Suggestion =
  | { kind: "postpone"; occurrence: Occurrence; reason: string }
  | { kind: "keep"; occurrence: Occurrence; reason: string }
  | { kind: "review"; occurrence: Occurrence; reason: string };

/**
 * Suggestions for events that collide with a long shift/activation window, or that fall
 * inside the recovery buffer after it. Important events are always "keep" — the user decides.
 */
export function adjustmentSuggestions(
  window: { start: Date; end: Date | null },
  occurrences: Occurrence[],
  opts: { recoveryHours?: number; selfEventId?: string } = {},
): Suggestion[] {
  const end = window.end ?? new Date(window.start.getTime() + 16 * 3_600_000);
  const recoveryEnd = new Date(end.getTime() + (opts.recoveryHours ?? 10) * 3_600_000);
  const out: Suggestion[] = [];
  for (const o of occurrences) {
    if (o.eventId === opts.selfEventId || o.readOnly) continue;
    const during = overlaps({ start: window.start, end }, o);
    const after = !during && overlaps({ start: end, end: recoveryEnd }, o);
    if (!during && !after) continue;
    if (o.category === "DOC_SHIFT") {
      out.push({ kind: "review", occurrence: o, reason: during ? "Overlaps your shift window — confirm coverage with your supervisor." : "Next DOC shift — make sure you can rest before it." });
    } else if (o.important) {
      out.push({ kind: "keep", occurrence: o, reason: "Marked important — kept as-is. Reschedule manually if needed." });
    } else if (o.optional || o.category === "GIG" || o.category === "WORKOUT" || o.category === "CONTENT" || o.category === "STUDY") {
      out.push({ kind: "postpone", occurrence: o, reason: during ? "Conflicts with the shift. Consider postponing." : "Falls in your recovery window. Consider postponing to protect sleep." });
    } else {
      out.push({ kind: "review", occurrence: o, reason: during ? "Conflicts with the shift." : "Close to the end of a long shift." });
    }
  }
  return out.sort((a, b) => a.occurrence.start.getTime() - b.occurrence.start.getTime());
}
