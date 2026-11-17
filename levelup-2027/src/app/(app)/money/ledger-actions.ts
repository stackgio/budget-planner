"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { UserError } from "@/server/payroll";
import {
  approvePlan, cancelLine, cancelPlan, completeLine, configureDebt, correctDebtBalance, editDraft, importSchdHistory,
  recordManualPayment, reversePayment, spin, validateDebtMapping, setRothLineTaxYear, markSchdDayNotDone,
} from "@/server/ledger";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate, todayLocal } from "@/domain/dates";
import { parseDollarsToCents } from "@/domain/money";
import { splitByPercent } from "@/domain/roulette";
import { buildDebtTiles } from "@/domain/debt";

const done = () => revalidatePath("/", "layout");
const date = z.string().refine(isLocalDate, "Enter a valid date.");
const cents = (v: unknown, what: string, allowEmpty = false): number | null => {
  const s = String(v ?? "").trim();
  if (!s) {
    if (allowEmpty) return null;
    throw new UserError(`Enter ${what}.`);
  }
  const c = parseDollarsToCents(s);
  if (c === null) throw new UserError(`${what[0]!.toUpperCase()}${what.slice(1)} must be a dollar amount like 125 or 125.50.`);
  return c;
};
const bool = (v: unknown) => v === "on" || v === "true";
const CHALLENGES = ["DEBT", "MOVING_OUT", "SCHD"] as const;

export async function spinAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const kind = z.enum(["OVERTIME_ROULETTE", "EXTRA_PAYCHECK"]).parse(fd.get("kind"));
    const depositId = String(fd.get("depositId") ?? "") || null;
    const forecastMonth = String(fd.get("forecastMonth") ?? "") || null;
    const selected = fd.getAll("challenges").map(String).filter((c): c is (typeof CHALLENGES)[number] => (CHALLENGES as readonly string[]).includes(c));
    await spin(user.id, {
      kind, depositId, forecastMonth,
      forecastCents: forecastMonth && !depositId ? cents(fd.get("forecastAmount"), "the amount you expect to have available") : null,
      budgetCents: cents(fd.get("budget"), "a budget", true),
      rothCents: cents(fd.get("roth"), "a Roth amount", true),
      funCents: cents(fd.get("fun"), "a fun-money amount", true),
      leftoverToFun: fd.has("leftoverMode") ? fd.get("leftoverMode") === "fun" : null,
      includeReserves: kind === "OVERTIME_ROULETTE",
      challengesOnly: fd.has("challengesSet") ? selected : null,
      keepAmountLines: kind === "EXTRA_PAYCHECK",
      challengeBudgetCents: cents(fd.get("challengeBudget"), "a challenge amount", true),
    });
    return kind === "OVERTIME_ROULETTE" ? "New proposal ready. Nothing has been reserved or moved." : "Spun. Nothing has been reserved or moved.";
  });
  done();
  return r;
}

export async function draftEditAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const planId = z.string().min(1).parse(fd.get("planId"));
    const op = z.enum(["remove", "setAmount", "addTile"]).parse(fd.get("op"));
    if (op === "remove") await editDraft(user.id, planId, { op, lineId: z.string().parse(fd.get("lineId")) });
    else if (op === "addTile") {
      const kind = z.enum(CHALLENGES).parse(fd.get("challenge"));
      const number = z.coerce.number().int().min(1).max(500).parse(fd.get("number"));
      const tile = await prisma.challengeTile.findFirst({ where: { number, challenge: { ownerId: user.id, kind } } });
      if (!tile) throw new UserError(`There is no tile #${number} in that challenge.`);
      await editDraft(user.id, planId, { op, tileId: tile.id });
    }
    else {
      const target = z.enum(["ROTH", "FUN", "EMERGENCY", "GOAL"]).parse(fd.get("target"));
      const label = String(fd.get("label") ?? "").trim().slice(0, 40) || null;
      if (target === "GOAL" && !label) throw new UserError("Name the goal.");
      let amount: number;
      if (fd.get("mode") === "percent") {
        const pct = String(fd.get("value") ?? "").trim();
        if (!/^\d{1,3}(\.\d{1,2})?$/.test(pct)) throw new UserError("Enter a percentage like 25 or 12.5");
        const bp = Math.round(Number(pct) * 100);
        const plan = await prisma.allocationPlan.findFirst({ where: { id: planId, ownerId: user.id } });
        if (!plan) throw new UserError("Plan not found.");
        amount = splitByPercent(plan.budgetCents, [bp]).amounts[0]!;
      } else amount = cents(fd.get("value"), "an amount")!;
      await editDraft(user.id, planId, { op, target, amountCents: amount, label });
    }
  });
  done();
  return r;
}

export async function approveAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const planId = z.string().min(1).parse(fd.get("planId"));
  const r = await run(async () => {
    const version = fd.get("version") ? Number(fd.get("version")) : undefined;
    await approvePlan(user.id, planId, { depositId: String(fd.get("depositId") ?? "") || null, expectedVersion: version });
  });
  done();
  if (r?.ok) redirect(`/money/plans/${planId}`);
  return r;
}

export async function completeLineAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ lineId: z.string().min(1), date, note: z.string().max(300).optional(), idempotencyKey: z.string(), taxYear: z.string().optional() }).parse(Object.fromEntries(fd));
    await completeLine(user.id, i.lineId, {
      paidCents: cents(fd.get("amount"), "the amount you transferred")!,
      paidOn: i.date, note: i.note || null, idempotencyKey: i.idempotencyKey,
      taxYear: i.taxYear ? z.coerce.number().int().min(2000).max(2100).parse(i.taxYear) : null,
      acknowledgeOverLimit: bool(fd.get("ack")),
    });
    return "Confirmed. Progress updated.";
  });
  done();
  return r;
}

export async function cancelLineAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await cancelLine(user.id, z.string().min(1).parse(fd.get("lineId"))); return "Released. That money is unallocated again."; });
  done();
  return r;
}

export async function cancelPlanAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await cancelPlan(user.id, z.string().min(1).parse(fd.get("planId"))); return "Plan cancelled. Reserved money was released; confirmed transfers were kept."; });
  done();
  return r;
}

export async function reverseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ paymentId: z.string().min(1), reason: z.string(), idempotencyKey: z.string() }).parse(Object.fromEntries(fd));
    await reversePayment(user.id, i.paymentId, i.reason, i.idempotencyKey);
    return "Correction recorded. The original stays in your history.";
  });
  done();
  return r;
}

export async function manualPaymentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ kind: z.enum(["ROTH", "EMERGENCY", "GOAL", "FUN", "TILE"]), date, idempotencyKey: z.string(), tileId: z.string().optional(), label: z.string().max(40).optional(), note: z.string().max(300).optional(), taxYear: z.string().optional() }).parse(Object.fromEntries(fd));
    await recordManualPayment(user.id, {
      kind: i.kind, tileId: i.tileId || null, amountCents: i.kind === "TILE" ? 0 : cents(fd.get("amount"), "an amount")!,
      paidOn: i.date, label: i.label || null, note: i.note || null, idempotencyKey: i.idempotencyKey,
      taxYear: i.taxYear ? Number(i.taxYear) : null, acknowledgeOverLimit: bool(fd.get("ack")),
    });
    return "Recorded.";
  });
  done();
  return r;
}

export async function schdImportAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const days = String(fd.get("days") ?? "").split(",").filter(Boolean).map((d) => z.coerce.number().int().min(1).max(100).parse(d));
    if (!bool(fd.get("confirmReviewed"))) throw new UserError("Tick the box confirming you reviewed these contributions.");
    const res = await importSchdHistory(user.id, { days, paidOn: date.parse(fd.get("date")), note: String(fd.get("note") ?? "") || null, idempotencyKey: String(fd.get("idempotencyKey")) });
    return res.replay ? "Already imported." : `${res.imported} day${res.imported === 1 ? "" : "s"} verified.`;
  });
  done();
  return r;
}

export async function debtSetupAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const balanceCents = cents(fd.get("balance"), "your current balance")!;
    const targetCents = cents(fd.get("target"), "the challenge target")!;
    const mapping = z.enum(["numbered", "equal", "custom"]).parse(fd.get("mapping"));
    const built = buildDebtTiles(mapping, targetCents, { tileAmountCents: cents(fd.get("tileAmount"), "a tile amount", true), custom: String(fd.get("customTiles") ?? "") });
    if ("error" in built) throw new UserError(built.error);
    const tiles = built.tiles;
    const problem = validateDebtMapping({ balanceCents, targetCents, tileAmountsCents: tiles });
    if (problem) throw new UserError(problem);
    if (!bool(fd.get("confirm"))) throw new UserError(`Review the ${tiles.length} tiles, then tick the confirmation box.`);
    await configureDebt(user.id, {
      balanceCents, targetCents, tileAmountsCents: tiles, priorPaidCents: cents(fd.get("priorPaid"), "amount already paid", true),
      note: String(fd.get("note") ?? "").trim().slice(0, 300) || null, asOf: todayLocal(user.timezone),
    });
    return `Debt challenge set up with ${tiles.length} tiles. It can now join Money Roulette.`;
  });
  done();
  return r;
}

export async function debtCorrectionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await correctDebtBalance(user.id, { balanceCents: cents(fd.get("balance"), "the balance")!, asOf: date.parse(fd.get("asOf")), note: String(fd.get("note") ?? "").trim() || null });
    return "Balance updated. Past payments are unchanged.";
  });
  done();
  return r;
}

export async function rothLimitAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const taxYear = z.coerce.number().int().min(2000).max(2100).parse(fd.get("taxYear"));
    const limitCents = cents(fd.get("limit"), "a limit", true);
    const note = String(fd.get("note") ?? "").trim().slice(0, 200) || null;
    const row = await prisma.rothYear.upsert({ where: { ownerId_taxYear: { ownerId: user.id, taxYear } }, create: { ownerId: user.id, taxYear, limitCents, note }, update: { limitCents, note } });
    await prisma.$transaction((tx) => audit(tx, user.id, "RothYear", row.id, "set-limit", undefined, row));
    return limitCents === null ? `${taxYear} limit cleared.` : `${taxYear} limit saved.`;
  });
  done();
  return r;
}

export async function rouletteSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const kind = z.enum(["OVERTIME_ROULETTE", "EXTRA_PAYCHECK"]).parse(fd.get("kind"));
    const data = { rothCents: cents(fd.get("roth"), "a Roth amount")!, funCents: cents(fd.get("fun"), "a fun amount")!, leftoverToFun: fd.get("leftoverMode") === "fun" };
    await prisma.rouletteSettings.upsert({ where: { ownerId_kind: { ownerId: user.id, kind } }, create: { ownerId: user.id, kind, ...data }, update: data });
    return "Defaults saved.";
  });
  done();
  return r;
}

export async function rothLineTaxYearAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await setRothLineTaxYear(user.id, z.string().min(1).parse(fd.get("lineId")), z.coerce.number().int().parse(fd.get("taxYear")));
    return "Tax year updated.";
  });
  done();
  return r;
}

export async function schdNotDoneAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const day = z.coerce.number().int().min(1).max(100).parse(fd.get("day"));
    await markSchdDayNotDone(user.id, day);
    return `Day ${day} is open again and is now part of the sequence.`;
  });
  done();
  return r;
}
