"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { UserError } from "@/server/payroll";
import {
  addPlatform, archiveMileage, archiveSession, confirmPayout, planGigShift, saveGigSettings, saveMileage, saveSession, setPlatformArchived,
  setSessionDisputed, voidPayout,
} from "@/server/gig";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate } from "@/domain/dates";
import { parseDollarsToCents } from "@/domain/money";
import { parseMiles, parseOdometer, milesFromOdometer } from "@/domain/gig";

const done = () => revalidatePath("/", "layout");
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const date = (fd: FormData, k: string, what = "a date") => {
  const v = str(fd, k);
  if (!isLocalDate(v)) throw new UserError(`Enter ${what}.`);
  return v;
};
const time = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  if (!/^\d{2}:\d{2}$/.test(v)) throw new UserError("Enter a valid time.");
  return v;
};
const cents = (fd: FormData, k: string, what: string, required = false): number => {
  const s = str(fd, k);
  if (!s) {
    if (required) throw new UserError(`Enter ${what}.`);
    return 0;
  }
  const c = parseDollarsToCents(s);
  if (c === null) throw new UserError(`${what[0]!.toUpperCase()}${what.slice(1)} must be a dollar amount like 42 or 42.50.`);
  return c;
};
const hoursToMinutes = (s: string) => {
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new UserError("Hours must be a number like 3 or 3.5.");
  return Math.round(Number(s) * 60);
};
const miles = (s: string) => {
  if (!s) return null;
  const m = parseMiles(s);
  if (m === null) throw new UserError("Miles must be a number like 23.4.");
  return m;
};

export async function saveSessionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const id = opt(fd, "id");
    await saveSession(user.id, user.timezone, id, {
      platformId: str(fd, "platformId"), workDate: date(fd, "workDate"), startTime: time(fd, "startTime"), endTime: time(fd, "endTime"),
      minutes: hoursToMinutes(str(fd, "hours")), grossCents: cents(fd, "gross", "gross earnings", true),
      tipsCents: cents(fd, "tips", "tips"), tipsInGross: str(fd, "tipsMode") !== "extra",
      bonusCents: cents(fd, "bonus", "bonuses"), bonusInGross: str(fd, "bonusMode") !== "extra",
      parkingTollsCents: cents(fd, "parking", "parking and tolls"), otherExpenseCents: cents(fd, "other", "other expenses"),
      milesHundredths: miles(str(fd, "miles")), notes: opt(fd, "notes"), plannedEventId: opt(fd, "plannedEventId"),
    }, { expectedVersion: fd.has("version") ? Number(fd.get("version")) : undefined, correctionReason: opt(fd, "correctionReason") });
    return id ? "Session updated." : "Session logged. It counts toward earnings — not spendable money until a payout is confirmed.";
  });
  done();
  return r;
}

export async function sessionOpAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const op = z.enum(["archive", "dispute", "undispute"]).parse(fd.get("op"));
    const id = str(fd, "id");
    if (op === "archive") { await archiveSession(user.id, id); return "Session removed from your totals. It's kept in history."; }
    await setSessionDisputed(user.id, id, op === "dispute");
    return op === "dispute" ? "Marked as disputed." : "Dispute cleared.";
  });
  done();
  return r;
}

export async function confirmPayoutAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await confirmPayout(user.id, {
      platformId: str(fd, "platformId"), netCents: cents(fd, "amount", "the amount that reached your account", true),
      depositDate: date(fd, "depositDate", "the date the money arrived"), externalRef: opt(fd, "externalRef"), notes: opt(fd, "notes"),
      sessionIds: fd.getAll("sessionIds").map(String).filter(Boolean), confirmSeparate: bool(fd, "confirmSeparate"),
      idempotencyKey: str(fd, "idempotencyKey"),
    });
    return "Payout confirmed and added to your ledger as gig income. It stays unallocated until you choose what to do with it.";
  });
  done();
  return r;
}

export async function voidPayoutAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await voidPayout(user.id, str(fd, "id"), str(fd, "reason"));
    return "Payout voided and kept in history. Its sessions are unpaid again — re-enter the correct payout.";
  });
  done();
  return r;
}

export async function saveMileageAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const os = str(fd, "odoStart") ? parseOdometer(str(fd, "odoStart")) : null;
    const oe = str(fd, "odoEnd") ? parseOdometer(str(fd, "odoEnd")) : null;
    if ((str(fd, "odoStart") && os === null) || (str(fd, "odoEnd") && oe === null)) throw new UserError("Odometer readings look like 45210 or 45210.4.");
    let m = miles(str(fd, "miles"));
    if (m === null && os !== null && oe !== null) m = milesFromOdometer(os, oe);
    if (m === null) throw new UserError("Enter the miles, or both odometer readings.");
    await saveMileage(user.id, opt(fd, "id"), {
      platformId: opt(fd, "platformId"), tripDate: date(fd, "tripDate"), milesHundredths: m, purpose: str(fd, "purpose"),
      odometerStartTenths: os, odometerEndTenths: oe, notes: opt(fd, "notes"),
    });
    return opt(fd, "id") ? "Trip updated." : "Trip added to your mileage log.";
  });
  done();
  return r;
}

export async function archiveMileageAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await archiveMileage(user.id, str(fd, "id")); return "Trip removed. It's kept in history."; });
  done();
  return r;
}

export async function planShiftAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const dur = Number(str(fd, "durationMin"));
    if (!Number.isInteger(dur) || dur < 15 || dur > 600) throw new UserError("Length must be 15–600 minutes.");
    const target = str(fd, "target") ? cents(fd, "target", "a target") : null;
    const res = await planGigShift(user.id, user.timezone, { platformId: str(fd, "platformId"), date: date(fd, "date"), time: time(fd, "time") ?? "17:00", durationMin: dur, targetCents: target }, bool(fd, "override"));
    if (!res.created) {
      const sug = res.check.suggestions.map((x) => x.label).join(" · ");
      throw new UserError(`Conflicts with: ${res.check.conflicts.join("; ")}.${sug ? ` Free alternatives: ${sug}.` : ""} Pick another time, or tick “Plan it anyway”.`);
    }
    return `Planned. It won't count as work or income until you log it.${res.check.modeNote ? " " + res.check.modeNote : ""}`;
  });
  done();
  return r;
}

export async function gigSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const pct = str(fd, "taxReservePct");
    if (pct && !/^\d{1,3}(\.\d{1,2})?$/.test(pct)) throw new UserError("Tax reserve must be a percent like 25.");
    const cpm = str(fd, "costPerMile");
    if (cpm && !/^\d{1,3}(\.\d{1,3})?$/.test(cpm)) throw new UserError("Cost per mile must look like 0.35.");
    await saveGigSettings(user.id, {
      monthlyTargetCents: cents(fd, "target", "a monthly target", true),
      taxReserveBps: pct ? Math.round(Number(pct) * 100) : null,
      costPerMileMills: cpm ? Math.round(Number(cpm) * 1000) : null,
    });
    return "Saved.";
  });
  done();
  return r;
}

export async function platformAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const op = z.enum(["add", "archive", "restore"]).parse(fd.get("op"));
    if (op === "add") { await addPlatform(user.id, str(fd, "name")); return "Income source added."; }
    await setPlatformArchived(user.id, str(fd, "id"), op === "archive");
    return op === "archive" ? "Hidden from new entries. Its history is kept." : "Restored.";
  });
  done();
  return r;
}
