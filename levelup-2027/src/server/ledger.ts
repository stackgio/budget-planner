import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type LineTarget, type PaymentKind, type PlanKind, type PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { IDEMPOTENCY_KEY_RE, isLedgerViolation, isUniqueViolation, requestHash } from "./idempotency";
import { type LocalDate, dateToLocal, localToDbDate } from "@/domain/dates";
import { type ChallengeInput, type Proposal, propose, rotate } from "@/domain/roulette";
import { formatCents } from "@/domain/money";

type Tx = Prisma.TransactionClient;
type Db = PrismaClient | Tx;

/**
 * THE LEDGER — single source of truth for money in LEVEL UP.
 *
 *   recorded income  = active (non-voided) IncomeDeposits — created only by the user's confirmation
 *   reserved         = APPROVED plan lines not yet completed (earmarked, no money moved)
 *   completed        = lines the user confirmed as real transfers (paidCents) — each has a Payment
 *   available        = recorded income − reserved − completed
 *
 * LEVEL UP never moves money. A Payment records a transfer the user already made elsewhere.
 * Invariants are enforced here (row locks + transactions) and again by database constraints/triggers.
 */

// Read Committed + explicit row locks (SELECT … FOR UPDATE) on the deposit/line/plan rows being changed.
const TX_OPTS = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 } as const;

export const TARGET_TO_PAYMENT: Record<LineTarget, PaymentKind> = {
  ROTH: "ROTH_CONTRIBUTION",
  FUN: "FUN_MONEY",
  EMERGENCY: "EMERGENCY_SAVINGS",
  GOAL: "GOAL_TRANSFER",
  MOVING_TILE: "SAVINGS_TRANSFER",
  SCHD_DAY: "INVESTMENT_CONTRIBUTION",
  DEBT_TILE: "DEBT_PAYMENT",
};
const TILE_TARGETS: LineTarget[] = ["MOVING_TILE", "SCHD_DAY", "DEBT_TILE"];
const TARGET_FOR_CHALLENGE = { MOVING_OUT: "MOVING_TILE", SCHD: "SCHD_DAY", DEBT: "DEBT_TILE" } as const;

function lineCommitted(l: { status: string; amountCents: number; paidCents: number | null }) {
  return l.status === "COMPLETED" ? (l.paidCents ?? 0) : l.status === "RESERVED" ? l.amountCents : 0;
}

async function lockDeposit(tx: Tx, depositId: string) {
  await tx.$queryRaw`SELECT id FROM "IncomeDeposit" WHERE id = ${depositId} FOR UPDATE`;
}

// ───────────────────────── Reads ─────────────────────────

export async function depositBalance(db: Db, ownerId: string, depositId: string, excludePlanId?: string) {
  const d = await db.incomeDeposit.findFirst({ where: { id: depositId, ownerId } });
  if (!d) throw new UserError("Deposit not found.");
  const lines = await db.allocationLine.findMany({
    where: { plan: { depositId, ownerId, ...(excludePlanId ? { id: { not: excludePlanId } } : {}) }, status: { in: ["RESERVED", "COMPLETED"] } },
    select: { status: true, amountCents: true, paidCents: true },
  });
  const reserved = lines.filter((l) => l.status === "RESERVED").reduce((a, l) => a + l.amountCents, 0);
  const completed = lines.filter((l) => l.status === "COMPLETED").reduce((a, l) => a + (l.paidCents ?? 0), 0);
  const net = d.voidedAt ? 0 : d.netCents;
  return { deposit: d, netCents: net, reservedCents: reserved, completedCents: completed, availableCents: net - reserved - completed };
}

export async function getRouletteSettings(db: Db, ownerId: string, kind: PlanKind) {
  const existing = await db.rouletteSettings.findUnique({ where: { ownerId_kind: { ownerId, kind } } });
  if (existing) return existing;
  const defaults = kind === "OVERTIME_ROULETTE"
    ? { rothCents: 10_000, funCents: 5_000, leftoverToFun: true } // confirmed defaults: $100 Roth, $50 fun
    : { rothCents: 0, funCents: 0, leftoverToFun: false }; // extra paycheck: no overtime defaults applied
  return db.rouletteSettings.upsert({ where: { ownerId_kind: { ownerId, kind } }, create: { ownerId, kind, ...defaults }, update: {} });
}

export async function rothRoom(db: Db, ownerId: string, taxYear: number) {
  const y = await db.rothYear.findUnique({ where: { ownerId_taxYear: { ownerId, taxYear } } });
  const payments = await db.payment.aggregate({ where: { ownerId, kind: "ROTH_CONTRIBUTION", taxYear }, _sum: { amountCents: true } });
  const confirmed = payments._sum.amountCents ?? 0; // reversals are negative, so this nets out
  // Planned = approved Roth lines for THIS tax year that aren't confirmed yet. Drafts don't count.
  const reserved = await db.allocationLine.aggregate({ where: { target: "ROTH", status: "RESERVED", taxYear, plan: { ownerId } }, _sum: { amountCents: true } });
  const plannedCents = reserved._sum.amountCents ?? 0;
  const limit = y?.limitCents ?? null;
  return { taxYear, limitCents: limit, confirmedCents: confirmed, plannedCents, remainingCents: limit === null ? null : Math.max(0, limit - confirmed - plannedCents) };
}

/** Challenge inputs for the engine: open tiles that are not reserved/completed by any live line. */
export async function challengeInputs(db: Db, ownerId: string): Promise<ChallengeInput[]> {
  const challenges = await db.challenge.findMany({
    where: { ownerId },
    include: { tiles: { orderBy: { number: "asc" }, include: { lines: { where: { status: { in: ["RESERVED", "COMPLETED"] } }, select: { id: true } } } } },
  });
  const order: ("DEBT" | "MOVING_OUT" | "SCHD")[] = ["DEBT", "MOVING_OUT", "SCHD"];
  return order.flatMap((kind): ChallengeInput[] => {
    const c = challenges.find((x) => x.kind === kind);
    if (!c) return [];
    const free = c.tiles.filter((t) => t.status === "OPEN" && t.lines.length === 0);
    const base = { kind, eligible: c.status === "ACTIVE", openTiles: [] as { id: string; number: number; amountCents: number }[] };
    if (kind === "SCHD") {
      // Sequential: the next day is always the lowest day that is OPEN and not reserved/completed.
      // Unverified history (PROVISIONAL) counts as done for ordering but never as money; a day marked
      // "not done" becomes OPEN and is therefore next automatically — no manual reset needed.
      return [{ ...base, rule: "SEQUENTIAL" as const, openTiles: free.map((t) => ({ id: t.id, number: t.number, amountCents: t.amountCents })) }];
    }
    let capCents: number | undefined;
    if (kind === "DEBT" && c.targetCents !== null) {
      const committed = c.tiles.filter((t) => t.status === "COMPLETED" || t.lines.length).reduce((a, t) => a + t.amountCents, 0);
      capCents = Math.max(0, c.targetCents - committed);
    }
    return [{ ...base, rule: "BIG_FIRST" as const, capCents, openTiles: free.map((t) => ({ id: t.id, number: t.number, amountCents: t.amountCents })) }];
  });
}

// ───────────────────────── Drafts (proposals only) ─────────────────────────

export interface SpinOptions {
  kind: PlanKind;
  depositId?: string | null;
  forecastMonth?: string | null;
  forecastCents?: number | null;
  budgetCents?: number | null; // defaults to all available
  rothCents?: number | null;
  funCents?: number | null;
  leftoverToFun?: boolean | null;
  includeReserves?: boolean;
  challengesOnly?: ("DEBT" | "MOVING_OUT" | "SCHD")[] | null;
  /** Extra Paycheck Planner: keep manual amount lines (Roth/fun/emergency/goal) and only re-spin tiles. */
  keepAmountLines?: boolean;
  /** Cap on what the spin may use for challenges (defaults to whatever the plan has left). */
  challengeBudgetCents?: number | null;
  seed?: string;
}

/**
 * Spin or reroll. Creates/replaces the single DRAFT plan for this deposit (or forecast month).
 * Drafts reserve nothing and move nothing; rerolling only rewrites PLANNED lines.
 */
export async function spin(ownerId: string, o: SpinOptions): Promise<{ planId: string; proposal: Proposal }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const settings = await getRouletteSettings(tx, ownerId, o.kind);
      let budgetCap: number;
      if (o.depositId) {
        const bal = await depositBalance(tx, ownerId, o.depositId);
        if (bal.deposit.voidedAt) throw new UserError("This deposit was voided.");
        // Roulette: overtime deposits, or a gig payout you explicitly chose to spin. Never regular pay.
        const allowed: string[] = o.kind === "OVERTIME_ROULETTE" ? ["OVERTIME", "GIG"] : ["REGULAR"];
        if (!allowed.includes(bal.deposit.kind)) throw new UserError(o.kind === "OVERTIME_ROULETTE" ? "Overtime Roulette can only use an overtime deposit or a gig payout you choose." : "The Extra Paycheck Planner can only use a regular paycheck deposit.");
        budgetCap = bal.availableCents;
      } else {
        if (o.kind !== "EXTRA_PAYCHECK" || !o.forecastMonth || !/^\d{4}-\d{2}$/.test(o.forecastMonth)) throw new UserError("Choose a confirmed deposit.");
        if (!Number.isSafeInteger(o.forecastCents) || (o.forecastCents ?? 0) < 0) throw new UserError("Enter the amount you expect to have available.");
        budgetCap = o.forecastCents!;
      }
      const budget = o.budgetCents ?? budgetCap;
      if (!Number.isSafeInteger(budget) || budget < 0) throw new UserError("Budget must be zero or more.");
      if (budget > budgetCap) throw new UserError(`Only ${formatCents(budgetCap)} is available to plan from this deposit.`);

      let year = new Date().getFullYear();
      if (o.depositId) year = (await tx.incomeDeposit.findUniqueOrThrow({ where: { id: o.depositId } })).actualDepositDate.getUTCFullYear();
      else if (o.forecastMonth) year = Number(o.forecastMonth.slice(0, 4));
      const room = await rothRoom(tx, ownerId, year);
      let rothTarget = o.rothCents ?? settings.rothCents;
      const notes: string[] = [];
      if (room.remainingCents !== null && rothTarget > room.remainingCents) {
        notes.push(`Roth capped at your remaining ${year} room (${formatCents(room.remainingCents)}) under the limit you configured.`);
        rothTarget = room.remainingCents;
      }
      const where = o.depositId
        ? { ownerId, kind: o.kind, depositId: o.depositId, status: "DRAFT" as const }
        : { ownerId, kind: o.kind, depositId: null, forecastMonth: o.forecastMonth!, status: "DRAFT" as const };
      const existingDraft = await tx.allocationPlan.findFirst({ where, include: { lines: true } });
      const keptCents = o.keepAmountLines && existingDraft ? existingDraft.lines.filter((l) => l.status === "PLANNED" && !l.tileId).reduce((a, l) => a + l.amountCents, 0) : 0;
      if (keptCents > budget) throw new UserError("Your planned amounts already exceed this budget. Lower them first.");
      const engineBudget = Math.min(budget - keptCents, o.challengeBudgetCents ?? Number.MAX_SAFE_INTEGER);
      if (engineBudget < 0) throw new UserError("Challenge amount must be zero or more.");
      const pointer = settings.rotationPointer;
      let inputs = await challengeInputs(tx, ownerId);
      if (o.challengesOnly) inputs = inputs.filter((c) => o.challengesOnly!.includes(c.kind));
      const seed = o.seed ?? randomUUID();
      const proposal = propose({
        budgetCents: engineBudget,
        rothTargetCents: rothTarget,
        funTargetCents: o.funCents ?? settings.funCents,
        leftoverToFun: o.leftoverToFun ?? settings.leftoverToFun,
        includeReserves: o.includeReserves ?? true,
        topN: settings.topN,
        challenges: rotate(inputs, pointer),
        seed,
      });
      proposal.notes.unshift(...notes);
      if (o.keepAmountLines) proposal.unallocatedCents += budget - keptCents - engineBudget;

      const params = {
        budgetCents: o.budgetCents ?? null, rothCents: o.rothCents ?? null, funCents: o.funCents ?? null,
        leftoverToFun: o.leftoverToFun ?? null, challengesOnly: o.challengesOnly ?? null, challengeBudgetCents: o.challengeBudgetCents ?? null,
      };
      let plan: { id: string } | null = existingDraft;
      if (plan) {
        await tx.$queryRaw`SELECT id FROM "AllocationPlan" WHERE id = ${plan.id} FOR UPDATE`;
        const fresh = await tx.allocationPlan.findUniqueOrThrow({ where: { id: plan.id } });
        if (fresh.status !== "DRAFT") throw new UserError("This plan was just approved. Refresh to see it.");
        await tx.allocationLine.deleteMany({ where: { planId: plan.id, status: "PLANNED", ...(o.keepAmountLines ? { tileId: { not: null } } : {}) } });
        plan = await tx.allocationPlan.update({
          where: { id: plan.id },
          data: { seed, params, budgetCents: budget, forecastCents: o.forecastCents ?? null, leftoverToFun: o.leftoverToFun ?? settings.leftoverToFun, version: { increment: 1 } },
        });
      } else {
        plan = await tx.allocationPlan.create({
          data: {
            ownerId, kind: o.kind, depositId: o.depositId ?? null, forecastMonth: o.forecastMonth ?? null, forecastCents: o.forecastCents ?? null,
            budgetCents: budget, seed, params, leftoverToFun: o.leftoverToFun ?? settings.leftoverToFun,
          },
        });
      }
      await tx.allocationLine.createMany({
        data: proposal.lines.map((l, i) => ({ planId: plan!.id, target: l.target, tileId: l.tileId ?? null, amountCents: l.amountCents, taxYear: l.target === "ROTH" ? year : null, sortOrder: l.tileId ? 100 + i : i })),
      });
      return { planId: plan.id, proposal };
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("Another spin happened at the same moment. Refresh and try again.");
    throw e;
  }
}

async function ownedDraft(tx: Tx, ownerId: string, planId: string) {
  await tx.$queryRaw`SELECT id FROM "AllocationPlan" WHERE id = ${planId} AND "ownerId" = ${ownerId} FOR UPDATE`;
  const plan = await tx.allocationPlan.findFirst({ where: { id: planId, ownerId }, include: { lines: true } });
  if (!plan) throw new UserError("Plan not found.");
  if (plan.status !== "DRAFT") throw new UserError("Only drafts can be edited. This plan is already " + plan.status.toLowerCase() + ".");
  return plan;
}

function draftTotal(lines: { status: string; amountCents: number }[]) {
  return lines.filter((l) => l.status === "PLANNED").reduce((a, l) => a + l.amountCents, 0);
}

export type DraftEdit =
  | { op: "remove"; lineId: string }
  | { op: "setAmount"; target: "ROTH" | "FUN" | "EMERGENCY" | "GOAL"; amountCents: number; label?: string | null }
  | { op: "addTile"; tileId: string };

/** Manual editing of a draft. Totals are always validated against the plan budget. */
export async function editDraft(ownerId: string, planId: string, edit: DraftEdit) {
  return prisma.$transaction(async (tx) => {
    const plan = await ownedDraft(tx, ownerId, planId);
    if (edit.op === "remove") {
      const line = plan.lines.find((l) => l.id === edit.lineId);
      if (!line) throw new UserError("Line not found.");
      await tx.allocationLine.delete({ where: { id: line.id } });
    } else if (edit.op === "setAmount") {
      if (!Number.isSafeInteger(edit.amountCents) || edit.amountCents < 0) throw new UserError("Amount must be zero or more.");
      const existing = plan.lines.find((l) => l.target === edit.target && (edit.target !== "GOAL" || l.label === (edit.label ?? null)));
      const others = draftTotal(plan.lines) - (existing?.amountCents ?? 0);
      if (others + edit.amountCents > plan.budgetCents) throw new UserError(`That would exceed this plan's budget of ${formatCents(plan.budgetCents)}. ${formatCents(Math.max(0, plan.budgetCents - others))} is left.`);
      if (existing && edit.amountCents === 0) await tx.allocationLine.delete({ where: { id: existing.id } });
      else if (existing) await tx.allocationLine.update({ where: { id: existing.id }, data: { amountCents: edit.amountCents } });
      else if (edit.amountCents > 0) {
        const taxYear = edit.target === "ROTH" ? (plan.depositId ? (await tx.incomeDeposit.findUniqueOrThrow({ where: { id: plan.depositId } })).actualDepositDate.getUTCFullYear() : plan.forecastMonth ? Number(plan.forecastMonth.slice(0, 4)) : new Date().getFullYear()) : null;
        await tx.allocationLine.create({ data: { planId, target: edit.target, amountCents: edit.amountCents, label: edit.label ?? null, taxYear, sortOrder: edit.target === "ROTH" ? 0 : edit.target === "FUN" ? 1 : 50 } });
      }
    } else {
      const tile = await tx.challengeTile.findFirst({
        where: { id: edit.tileId, challenge: { ownerId } },
        include: { challenge: true, lines: { where: { status: { in: ["RESERVED", "COMPLETED"] } } } },
      });
      if (!tile) throw new UserError("Tile not found.");
      if (tile.challenge.status !== "ACTIVE") throw new UserError(`${tile.challenge.name} is not active.`);
      if (tile.status !== "OPEN" || tile.lines.length) throw new UserError(`#${tile.number} is already completed or reserved.`);
      if (plan.lines.some((l) => l.tileId === tile.id)) throw new UserError(`#${tile.number} is already in this plan.`);
      if (tile.challenge.kind === "SCHD") {
        const inputs = await challengeInputs(tx, ownerId);
        const seq = inputs.find((c) => c.kind === "SCHD")!.openTiles.filter((t) => !plan.lines.some((l) => l.tileId === t.id));
        if (seq[0]?.id !== tile.id) throw new UserError(`SCHD is sequential. The next day to add is Day ${seq[0]?.number ?? "—"}.`);
      }
      if (draftTotal(plan.lines) + tile.amountCents > plan.budgetCents) throw new UserError(`Not enough budget left for #${tile.number} (${formatCents(tile.amountCents)}).`);
      await tx.allocationLine.create({ data: { planId, target: TARGET_FOR_CHALLENGE[tile.challenge.kind], tileId: tile.id, amountCents: tile.amountCents, sortOrder: 100 + tile.number } });
    }
    await tx.allocationPlan.update({ where: { id: planId }, data: { version: { increment: 1 } } });
  });
}

// ───────────────────────── Approve (reserve) ─────────────────────────

/**
 * Approve a draft: reserves every line against the funding deposit. Locks the deposit row so
 * concurrent approvals are serialized; the DB trigger re-checks the total at commit.
 * Idempotent: approving an already-approved plan is a no-op.
 */
export async function approvePlan(ownerId: string, planId: string, opts: { depositId?: string | null; expectedVersion?: number } = {}) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock first, then read — a concurrent duplicate tap waits here and then sees APPROVED.
      await tx.$queryRaw`SELECT id FROM "AllocationPlan" WHERE id = ${planId} AND "ownerId" = ${ownerId} FOR UPDATE`;
      const plan = await tx.allocationPlan.findFirst({ where: { id: planId, ownerId }, include: { lines: { include: { tile: { include: { challenge: true } } } } } });
      if (!plan) throw new UserError("Plan not found.");
      if (plan.status === "APPROVED" || plan.status === "COMPLETED") return { alreadyApproved: true };
      if (plan.status !== "DRAFT") throw new UserError("This plan was cancelled.");
      if (opts.expectedVersion !== undefined && opts.expectedVersion !== plan.version) throw new UserError("This plan changed on another screen. Review it and approve again.");

      const depositId = plan.depositId ?? opts.depositId ?? null;
      if (!depositId) throw new UserError("Choose the confirmed regular deposit that will fund this plan.");
      await lockDeposit(tx, depositId);
      const bal = await depositBalance(tx, ownerId, depositId, planId);
      if (bal.deposit.voidedAt) throw new UserError("That deposit was voided.");
      const allowedKinds: string[] = plan.kind === "OVERTIME_ROULETTE" ? ["OVERTIME", "GIG"] : ["REGULAR"];
      if (!allowedKinds.includes(bal.deposit.kind)) throw new UserError(plan.kind === "OVERTIME_ROULETTE" ? "Overtime Roulette must be funded by an overtime deposit." : "Extra-paycheck plans must be funded by a regular paycheck deposit.");

      const lines = plan.lines.filter((l) => l.status === "PLANNED");
      if (!lines.length) throw new UserError("This plan has nothing to approve.");
      const total = lines.reduce((a, l) => a + l.amountCents, 0);
      if (total > bal.availableCents) throw new UserError(`This plan needs ${formatCents(total)} but only ${formatCents(bal.availableCents)} of that deposit is still unallocated.`);
      for (const l of lines) {
        if (l.tile && (l.tile.status !== "OPEN" || l.tile.challenge.status !== "ACTIVE")) throw new UserError(`#${l.tile.number} is no longer open. Reroll or remove it.`);
      }
      await tx.allocationLine.updateMany({ where: { planId, status: "PLANNED" }, data: { status: "RESERVED" } });
      const after = await tx.allocationPlan.update({
        where: { id: planId },
        data: { status: "APPROVED", approvedAt: new Date(), depositId, budgetCents: plan.depositId ? plan.budgetCents : Math.min(plan.budgetCents, bal.availableCents), version: { increment: 1 } },
      });
      await tx.rouletteSettings.updateMany({ where: { ownerId, kind: plan.kind }, data: { rotationPointer: { increment: 1 } } });
      await audit(tx, ownerId, "AllocationPlan", planId, "approve", { status: plan.status, total }, { status: after.status, depositId });
      return { alreadyApproved: false };
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("One of these tiles was just reserved by another plan. Reroll or remove it.");
    if (isLedgerViolation(e)) throw new UserError("That would allocate more than the deposit. Nothing was changed.");
    throw e;
  }
}

// ───────────────────────── Complete / cancel / reverse ─────────────────────────

export class RothLimitWarning extends UserError {}

export interface CompleteInput {
  paidCents: number;
  paidOn: LocalDate;
  taxYear?: number | null;
  note?: string | null;
  idempotencyKey: string;
  acknowledgeOverLimit?: boolean;
}

async function maybeClosePlan(tx: Tx, planId: string) {
  const lines = await tx.allocationLine.findMany({ where: { planId }, select: { status: true } });
  if (lines.some((l) => l.status === "RESERVED" || l.status === "PLANNED")) return;
  const status = lines.some((l) => l.status === "COMPLETED") ? "COMPLETED" : "CANCELLED";
  await tx.allocationPlan.update({ where: { id: planId }, data: { status, closedAt: new Date() } });
}

async function rothGuard(tx: Tx, ownerId: string, taxYear: number, addCents: number, excludeReservedCents: number, ack?: boolean) {
  const room = await rothRoom(tx, ownerId, taxYear);
  if (room.limitCents === null) return;
  const after = room.confirmedCents + addCents;
  if (after > room.limitCents && !ack) {
    throw new RothLimitWarning(`This would bring ${taxYear} Roth contributions to ${formatCents(after)}, above the ${formatCents(room.limitCents)} limit you configured. Tick “record anyway” only if you're sure. (The configured limit is your own setting, not an eligibility check.)`);
  }
  void excludeReservedCents;
}

/** Confirm one reserved line as a real transfer the user made. Idempotent per key. */
export async function completeLine(ownerId: string, lineId: string, input: CompleteInput) {
  if (!IDEMPOTENCY_KEY_RE.test(input.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  const hash = requestHash({ op: "completeLine", ownerId, lineId, paid: input.paidCents, on: input.paidOn, taxYear: input.taxYear ?? null, note: input.note ?? null });
  const replay = async () => {
    const prior = await prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (!prior) return null;
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This confirmation was already used for different data. Refresh and try again.");
    return prior;
  };
  const prior = await replay();
  if (prior) return prior;
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "AllocationLine" WHERE id = ${lineId} FOR UPDATE`;
      const line = await tx.allocationLine.findFirst({ where: { id: lineId, plan: { ownerId } }, include: { plan: true, tile: true } });
      if (!line) throw new UserError("Allocation not found.");
      if (line.status === "COMPLETED") throw new UserError("This allocation is already confirmed.");
      if (line.status !== "RESERVED") throw new UserError("Only approved allocations can be confirmed.");
      if (!Number.isSafeInteger(input.paidCents) || input.paidCents <= 0) throw new UserError("Enter the amount you actually transferred.");
      if (line.tileId && input.paidCents !== line.amountCents) throw new UserError(`Tile #${line.tile!.number} is exactly ${formatCents(line.amountCents)}. Cancel it instead if you paid a different amount.`);
      if (input.paidCents > line.amountCents) throw new UserError(`You can confirm at most the approved ${formatCents(line.amountCents)}.`);
      const taxYear = line.target === "ROTH" ? (input.taxYear ?? line.taxYear ?? Number(input.paidOn.slice(0, 4))) : null;
      if (line.target === "ROTH") await rothGuard(tx, ownerId, taxYear!, input.paidCents, line.amountCents, input.acknowledgeOverLimit);
      const payment = await tx.payment.create({
        data: {
          ownerId, kind: TARGET_TO_PAYMENT[line.target], source: line.plan.kind === "OVERTIME_ROULETTE" ? "ROULETTE" : "EXTRA_PAYCHECK",
          lineId: line.id, tileId: line.tileId, amountCents: input.paidCents, paidOn: localToDbDate(input.paidOn), taxYear,
          label: line.label, note: input.note || null, idempotencyKey: input.idempotencyKey, requestHash: hash,
        },
      });
      await tx.allocationLine.update({ where: { id: line.id }, data: { status: "COMPLETED", paidCents: input.paidCents, settledAt: new Date(), ...(taxYear !== null ? { taxYear } : {}) } });
      if (line.tileId) await tx.challengeTile.update({ where: { id: line.tileId }, data: { status: "COMPLETED" } });
      await maybeClosePlan(tx, line.planId);
      await audit(tx, ownerId, "Payment", payment.id, "confirm", undefined, payment);
      return payment;
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) {
      const again = await replay();
      if (again) return again;
      throw new UserError("This was already confirmed.");
    }
    throw e;
  }
}

/** Release a reserved line (no money moved). */
export async function cancelLine(ownerId: string, lineId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AllocationLine" WHERE id = ${lineId} FOR UPDATE`;
    const line = await tx.allocationLine.findFirst({ where: { id: lineId, plan: { ownerId } } });
    if (!line) throw new UserError("Allocation not found.");
    if (line.status === "CANCELLED") return;
    if (line.status !== "RESERVED") throw new UserError(line.status === "COMPLETED" ? "This was already confirmed. Use “Correct” to reverse it." : "Only approved allocations can be cancelled.");
    await tx.allocationLine.update({ where: { id: lineId }, data: { status: "CANCELLED", settledAt: new Date() } });
    await maybeClosePlan(tx, line.planId);
    await audit(tx, ownerId, "AllocationLine", lineId, "cancel", line, undefined);
  });
}

/** Cancel a draft (discard) or an approved plan (releases every reserved line; completed lines stay). */
export async function cancelPlan(ownerId: string, planId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AllocationPlan" WHERE id = ${planId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    const plan = await tx.allocationPlan.findFirst({ where: { id: planId, ownerId } });
    if (!plan) throw new UserError("Plan not found.");
    if (plan.status === "CANCELLED" || plan.status === "COMPLETED") return;
    if (plan.status === "DRAFT") {
      await tx.allocationLine.updateMany({ where: { planId, status: "PLANNED" }, data: { status: "CANCELLED" } });
      await tx.allocationPlan.update({ where: { id: planId }, data: { status: "CANCELLED", closedAt: new Date() } });
    } else {
      await tx.allocationLine.updateMany({ where: { planId, status: "RESERVED" }, data: { status: "CANCELLED", settledAt: new Date() } });
      await maybeClosePlan(tx, planId);
    }
    await audit(tx, ownerId, "AllocationPlan", planId, "cancel", { status: plan.status }, undefined);
  });
}

/**
 * Correct a confirmed payment: adds a negative reversal row (history is never erased),
 * reopens the tile, and releases the line. Idempotent per key.
 */
export async function reversePayment(ownerId: string, paymentId: string, reason: string, idempotencyKey: string) {
  if (!IDEMPOTENCY_KEY_RE.test(idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  if (reason.trim().length < 3) throw new UserError("Say briefly why (kept in your history).");
  const hash = requestHash({ op: "reverse", ownerId, paymentId, reason });
  const prior = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (prior) {
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This correction was already used for different data.");
    return prior;
  }
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${paymentId} FOR UPDATE`;
      const p = await tx.payment.findFirst({ where: { id: paymentId, ownerId }, include: { tile: { include: { challenge: true } } } });
      if (!p) throw new UserError("Payment not found.");
      if (p.reversalOfId) throw new UserError("A correction can't itself be corrected.");
      if (p.reversedAt) throw new UserError("This payment was already corrected.");
      const reversal = await tx.payment.create({
        data: {
          ownerId, kind: p.kind, source: p.source, lineId: p.lineId, tileId: null, amountCents: -p.amountCents, paidOn: p.paidOn, taxYear: p.taxYear,
          label: p.label, note: `Correction: ${reason.trim().slice(0, 200)}`, idempotencyKey, requestHash: hash, reversalOfId: p.id,
        },
      });
      await tx.payment.update({ where: { id: p.id }, data: { reversedAt: new Date() } });
      if (p.tileId && p.tile) {
        const backTo = p.source === "HISTORICAL_IMPORT" ? "PROVISIONAL" : "OPEN";
        await tx.challengeTile.update({ where: { id: p.tileId }, data: { status: backTo } });
        if (p.tile.challenge.status === "COMPLETE") await tx.challenge.update({ where: { id: p.tile.challengeId }, data: { status: "ACTIVE" } });
      }
      if (p.lineId) {
        await tx.allocationLine.update({ where: { id: p.lineId }, data: { status: "CANCELLED", settledAt: new Date() } });
        const line = await tx.allocationLine.findUniqueOrThrow({ where: { id: p.lineId } });
        const planLines = await tx.allocationLine.findMany({ where: { planId: line.planId } });
        const status = planLines.some((l) => l.status === "RESERVED") ? "APPROVED" : planLines.some((l) => l.status === "COMPLETED") ? "COMPLETED" : "CANCELLED";
        await tx.allocationPlan.update({ where: { id: line.planId }, data: { status, closedAt: status === "APPROVED" ? null : new Date() } });
      }
      await audit(tx, ownerId, "Payment", p.id, `reverse: ${reason.trim().slice(0, 200)}`, p, reversal);
      return reversal;
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("This payment was already corrected.");
    throw e;
  }
}

// ───────────────────────── Outside-Roulette records ─────────────────────────

export interface ManualPaymentInput {
  kind: "ROTH" | "EMERGENCY" | "GOAL" | "FUN" | "TILE";
  tileId?: string | null;
  amountCents: number;
  paidOn: LocalDate;
  taxYear?: number | null;
  label?: string | null;
  note?: string | null;
  idempotencyKey: string;
  acknowledgeOverLimit?: boolean;
}

/** Record a transfer made outside any plan (not funded from a tracked deposit). */
export async function recordManualPayment(ownerId: string, i: ManualPaymentInput) {
  if (!IDEMPOTENCY_KEY_RE.test(i.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  const hash = requestHash({ op: "manual", ownerId, ...i, acknowledgeOverLimit: undefined });
  const prior = await prisma.payment.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
  if (prior) {
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This record was already used for different data.");
    return prior;
  }
  try {
    return await prisma.$transaction(async (tx) => {
      let kind: PaymentKind;
      let tileId: string | null = null;
      let amount = i.amountCents;
      if (i.kind === "TILE") {
        if (!i.tileId) throw new UserError("Choose a tile.");
        await tx.$queryRaw`SELECT id FROM "ChallengeTile" WHERE id = ${i.tileId} FOR UPDATE`;
        const t = await tx.challengeTile.findFirst({ where: { id: i.tileId, challenge: { ownerId } }, include: { challenge: true, lines: { where: { status: { in: ["RESERVED", "COMPLETED"] } } } } });
        if (!t) throw new UserError("Tile not found.");
        if (t.challenge.status === "SETUP_REQUIRED") throw new UserError("Finish setting up this challenge first.");
        if (t.status === "COMPLETED") throw new UserError(`#${t.number} is already completed.`);
        if (t.lines.length) throw new UserError(`#${t.number} is reserved in an approved plan. Confirm it there instead.`);
        kind = TARGET_TO_PAYMENT[TARGET_FOR_CHALLENGE[t.challenge.kind]];
        tileId = t.id;
        amount = t.amountCents;
      } else {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new UserError("Enter an amount greater than zero.");
        kind = i.kind === "ROTH" ? "ROTH_CONTRIBUTION" : i.kind === "EMERGENCY" ? "EMERGENCY_SAVINGS" : i.kind === "FUN" ? "FUN_MONEY" : "GOAL_TRANSFER";
      }
      const taxYear = kind === "ROTH_CONTRIBUTION" ? (i.taxYear ?? Number(i.paidOn.slice(0, 4))) : null;
      if (taxYear !== null) await rothGuard(tx, ownerId, taxYear, amount, 0, i.acknowledgeOverLimit);
      const payment = await tx.payment.create({
        data: { ownerId, kind, source: "MANUAL", tileId, amountCents: amount, paidOn: localToDbDate(i.paidOn), taxYear, label: i.label || null, note: i.note || null, idempotencyKey: i.idempotencyKey, requestHash: hash },
      });
      if (tileId) await tx.challengeTile.update({ where: { id: tileId }, data: { status: "COMPLETED" } });
      await audit(tx, ownerId, "Payment", payment.id, "manual", undefined, payment);
      return payment;
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("That tile was just completed or this record already exists.");
    throw e;
  }
}

/**
 * SCHD history import: confirm earlier days individually or as a reviewed batch.
 * Each day becomes a HISTORICAL_IMPORT payment — clearly separate from roulette contributions.
 */
export async function importSchdHistory(ownerId: string, i: { days: number[]; paidOn: LocalDate; note?: string | null; idempotencyKey: string }) {
  if (!IDEMPOTENCY_KEY_RE.test(i.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  const days = [...new Set(i.days)].sort((a, b) => a - b);
  if (!days.length) throw new UserError("Select at least one day.");
  const hash = requestHash({ op: "schdImport", ownerId, days, paidOn: i.paidOn, note: i.note ?? null });
  const firstKey = `${i.idempotencyKey}:${days[0]}`;
  const prior = await prisma.payment.findUnique({ where: { idempotencyKey: firstKey } });
  if (prior) {
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This import was already used for different days.");
    return { imported: 0, replay: true };
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const c = await tx.challenge.findUnique({ where: { ownerId_kind: { ownerId, kind: "SCHD" } }, include: { tiles: { include: { lines: { where: { status: { in: ["RESERVED", "COMPLETED"] } } } } } } });
      if (!c) throw new UserError("SCHD challenge not found.");
      const total = { cents: 0 };
      for (const n of days) {
        const t = c.tiles.find((x) => x.number === n);
        if (!t) throw new UserError(`Day ${n} does not exist.`);
        if (t.status === "COMPLETED") throw new UserError(`Day ${n} is already verified.`);
        if (t.lines.length) throw new UserError(`Day ${n} is reserved in an approved plan.`);
        await tx.payment.create({
          data: { ownerId, kind: "INVESTMENT_CONTRIBUTION", source: "HISTORICAL_IMPORT", tileId: t.id, amountCents: t.amountCents, paidOn: localToDbDate(i.paidOn), note: i.note || "Verified historical contribution", idempotencyKey: `${i.idempotencyKey}:${n}`, requestHash: hash },
        });
        await tx.challengeTile.update({ where: { id: t.id }, data: { status: "COMPLETED" } });
        total.cents += t.amountCents;
      }
      await audit(tx, ownerId, "Challenge", c.id, `schd-import:${days.join(",")}`, undefined, { days, totalCents: total.cents });
      return { imported: days.length, replay: false, totalCents: total.cents };
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("One of those days was just verified elsewhere. Refresh and review again.");
    throw e;
  }
}

// ───────────────────────── Debt setup ─────────────────────────

export interface DebtSetupInput {
  balanceCents: number;
  targetCents: number;
  tileAmountsCents: number[];
  priorPaidCents: number | null;
  note: string | null;
  asOf: LocalDate;
}

/** Validates a debt tile mapping. Pure. */
export function validateDebtMapping(i: Pick<DebtSetupInput, "balanceCents" | "targetCents" | "tileAmountsCents">): string | null {
  if (!Number.isSafeInteger(i.balanceCents) || i.balanceCents <= 0) return "Enter your current debt balance.";
  if (!Number.isSafeInteger(i.targetCents) || i.targetCents <= 0) return "Enter the challenge target.";
  if (i.targetCents > i.balanceCents) return "The challenge target can't be more than the current balance.";
  if (!i.tileAmountsCents.length) return "Add at least one tile.";
  if (i.tileAmountsCents.length > 500) return "Use at most 500 tiles.";
  if (i.tileAmountsCents.some((c) => !Number.isSafeInteger(c) || c <= 0)) return "Every tile must be a positive amount.";
  const sum = i.tileAmountsCents.reduce((a, b) => a + b, 0);
  if (sum !== i.targetCents) return `Your tiles add up to ${formatCents(sum)}, but the target is ${formatCents(i.targetCents)}. They must match exactly.`;
  return null;
}

export async function configureDebt(ownerId: string, i: DebtSetupInput) {
  const problem = validateDebtMapping(i);
  if (problem) throw new UserError(problem);
  return prisma.$transaction(async (tx) => {
    const c = await tx.challenge.findUnique({ where: { ownerId_kind: { ownerId, kind: "DEBT" } }, include: { tiles: { include: { lines: { where: { status: { not: "CANCELLED" } } }, payments: true } } } });
    if (!c) throw new UserError("Debt challenge not found.");
    await tx.$queryRaw`SELECT id FROM "Challenge" WHERE id = ${c.id} FOR UPDATE`;
    if (c.tiles.some((t) => t.payments.length || t.lines.length)) throw new UserError("Debt tiles already have plans or payments. Use a balance correction instead of re-mapping.");
    await tx.challengeTile.deleteMany({ where: { challengeId: c.id } });
    await tx.challengeTile.createMany({ data: i.tileAmountsCents.map((amountCents, idx) => ({ challengeId: c.id, number: idx + 1, amountCents })) });
    const after = await tx.challenge.update({
      where: { id: c.id },
      data: { status: "ACTIVE", targetCents: i.targetCents, priorPaidCents: i.priorPaidCents, setupNote: i.note, configuredAt: new Date() },
    });
    await tx.debtBalance.create({ data: { challengeId: c.id, balanceCents: i.balanceCents, asOf: localToDbDate(i.asOf), note: i.note ?? "Initial setup" } });
    await audit(tx, ownerId, "Challenge", c.id, "debt-setup", { status: c.status, targetCents: c.targetCents }, { status: after.status, targetCents: after.targetCents, tiles: i.tileAmountsCents.length });
  });
}

/** Balance correction: appends a snapshot. Never changes past payments. */
export async function correctDebtBalance(ownerId: string, i: { balanceCents: number; asOf: LocalDate; note: string | null }) {
  if (!Number.isSafeInteger(i.balanceCents) || i.balanceCents < 0) throw new UserError("Enter a balance of zero or more.");
  return prisma.$transaction(async (tx) => {
    const c = await tx.challenge.findUnique({ where: { ownerId_kind: { ownerId, kind: "DEBT" } } });
    if (!c || c.status === "SETUP_REQUIRED") throw new UserError("Set up the debt challenge first.");
    const row = await tx.debtBalance.create({ data: { challengeId: c.id, balanceCents: i.balanceCents, asOf: localToDbDate(i.asOf), note: i.note } });
    await audit(tx, ownerId, "DebtBalance", row.id, "correction", undefined, row);
  });
}

// ───────────────────────── Overview & reconciliation ─────────────────────────

export async function ledgerOverview(ownerId: string, year?: number) {
  const deposits = await prisma.incomeDeposit.findMany({ where: { ownerId, voidedAt: null }, orderBy: { actualDepositDate: "desc" } });
  const lines = await prisma.allocationLine.findMany({ where: { plan: { ownerId, depositId: { not: null } }, status: { in: ["RESERVED", "COMPLETED"] } }, include: { plan: { select: { depositId: true } } } });
  const byDeposit = new Map<string, { reserved: number; completed: number }>();
  for (const l of lines) {
    const k = l.plan.depositId!;
    const v = byDeposit.get(k) ?? { reserved: 0, completed: 0 };
    if (l.status === "RESERVED") v.reserved += l.amountCents;
    else v.completed += l.paidCents ?? 0;
    byDeposit.set(k, v);
  }
  const inYear = (d: Date) => (year ? d.getUTCFullYear() === year : true);
  const sum = (f: (d: (typeof deposits)[number]) => boolean) => deposits.filter(f).reduce((a, d) => a + d.netCents, 0);
  const reserved = [...byDeposit.values()].reduce((a, v) => a + v.reserved, 0);
  const completed = [...byDeposit.values()].reduce((a, v) => a + v.completed, 0);
  const totalIncome = sum(() => true);
  return {
    regularCents: sum((d) => d.kind === "REGULAR" && inYear(d.actualDepositDate)),
    overtimeCents: sum((d) => d.kind === "OVERTIME" && inYear(d.actualDepositDate)),
    gigCents: sum((d) => d.kind === "GIG" && inYear(d.actualDepositDate)),
    totalIncomeCents: totalIncome,
    reservedCents: reserved,
    allocatedCompletedCents: completed,
    availableCents: totalIncome - reserved - completed,
    deposits: deposits.map((d) => {
      const v = byDeposit.get(d.id) ?? { reserved: 0, completed: 0 };
      return { id: d.id, kind: d.kind, netCents: d.netCents, date: dateToLocal(d.actualDepositDate), reservedCents: v.reserved, completedCents: v.completed, availableCents: d.netCents - v.reserved - v.completed };
    }),
  };
}

export interface ReconciliationIssue { code: string; detail: string }

/** Cross-checks ledger, payments and challenge tiles. An empty list means everything reconciles. */
export async function reconcile(ownerId: string, db: Db = prisma): Promise<ReconciliationIssue[]> {
  const issues: ReconciliationIssue[] = [];
  const deposits = await db.incomeDeposit.findMany({ where: { ownerId } });
  for (const d of deposits) {
    const b = await depositBalance(db, ownerId, d.id);
    if (b.availableCents < 0) issues.push({ code: "OVERCOMMITTED", detail: `Deposit ${d.id} is over-committed by ${formatCents(-b.availableCents)}` });
    if (d.voidedAt && b.reservedCents + b.completedCents > 0) issues.push({ code: "VOIDED_COMMITTED", detail: `Voided deposit ${d.id} still has allocations` });
  }
  const completed = await db.allocationLine.findMany({ where: { plan: { ownerId }, status: "COMPLETED" }, include: { payments: true } });
  for (const l of completed) {
    const active = l.payments.filter((p) => !p.reversedAt && !p.reversalOfId);
    if (active.length !== 1 || active[0]!.amountCents !== l.paidCents) issues.push({ code: "LINE_PAYMENT_MISMATCH", detail: `Line ${l.id} has ${active.length} active payments` });
  }
  const tiles = await db.challengeTile.findMany({ where: { challenge: { ownerId } }, include: { payments: true } });
  for (const t of tiles) {
    const active = t.payments.filter((p) => !p.reversedAt && !p.reversalOfId);
    if (active.length > 1) issues.push({ code: "TILE_DOUBLE_PAID", detail: `Tile ${t.id} has ${active.length} active payments` });
    if ((t.status === "COMPLETED") !== (active.length === 1)) issues.push({ code: "TILE_STATUS_MISMATCH", detail: `Tile ${t.id} status ${t.status} with ${active.length} active payments` });
    if (active[0] && active[0].amountCents !== t.amountCents) issues.push({ code: "TILE_AMOUNT_MISMATCH", detail: `Tile ${t.id}` });
  }
  // Gig: every GIG deposit has exactly one payout, both active or both voided; sessions marked paid point at an active payout.
  const gigDeposits = await db.incomeDeposit.findMany({ where: { ownerId, kind: "GIG" }, include: { gigPayout: true } });
  for (const d of gigDeposits) {
    if (!d.gigPayout) issues.push({ code: "GIG_DEPOSIT_NO_PAYOUT", detail: `Gig deposit ${d.id} has no payout` });
    else if (!!d.gigPayout.voidedAt !== !!d.voidedAt) issues.push({ code: "GIG_VOID_MISMATCH", detail: `Payout ${d.gigPayout.id}` });
  }
  const paidOnVoided = await db.gigSession.count({ where: { ownerId, status: "PAID", payout: { voidedAt: { not: null } } } });
  if (paidOnVoided) issues.push({ code: "GIG_SESSION_ON_VOIDED_PAYOUT", detail: `${paidOnVoided} session(s)` });
  const payments = await db.payment.findMany({ where: { ownerId, reversalOfId: { not: null } }, include: { reversalOf: true } });
  for (const r of payments) if (!r.reversalOf || r.reversalOf.amountCents !== -r.amountCents || !r.reversalOf.reversedAt) issues.push({ code: "BAD_REVERSAL", detail: `Reversal ${r.id}` });
  return issues;
}

/** Challenge totals computed only from confirmed, non-reversed payments. */
export async function challengeTotals(ownerId: string) {
  const challenges = await prisma.challenge.findMany({
    where: { ownerId },
    include: {
      tiles: { orderBy: { number: "asc" }, include: { payments: { where: { reversedAt: null, reversalOfId: null } }, lines: { where: { status: { in: ["RESERVED", "PLANNED"] } }, include: { plan: { select: { status: true } } } } } },
      balances: { orderBy: [{ asOf: "desc" }, { createdAt: "desc" }] },
    },
  });
  return challenges.map((c) => {
    const confirmed = c.tiles.reduce((a, t) => a + t.payments.reduce((x, p) => x + p.amountCents, 0), 0);
    const verifiedHistorical = c.tiles.reduce((a, t) => a + t.payments.filter((p) => p.source === "HISTORICAL_IMPORT").reduce((x, p) => x + p.amountCents, 0), 0);
    const reserved = c.tiles.filter((t) => t.lines.some((l) => l.status === "RESERVED")).reduce((a, t) => a + t.amountCents, 0);
    const provisional = c.tiles.filter((t) => t.status === "PROVISIONAL").reduce((a, t) => a + t.amountCents, 0);
    const completedTiles = c.tiles.filter((t) => t.status === "COMPLETED").length;
    const openSeq = c.tiles.filter((t) => t.status === "OPEN" && !t.lines.some((l) => l.status === "RESERVED"));
    return {
      id: c.id, kind: c.kind, name: c.name, status: c.status, targetCents: c.targetCents, nextNumber: c.nextNumber,
      confirmedCents: confirmed, verifiedHistoricalCents: verifiedHistorical, reservedCents: reserved, provisionalCents: provisional,
      remainingCents: c.targetCents === null ? null : c.targetCents - confirmed,
      completedTiles, tileCount: c.tiles.length,
      nextDay: c.kind === "SCHD" ? (openSeq[0]?.number ?? null) : null,
      latestBalance: c.balances[0] ? { cents: c.balances[0].balanceCents, asOf: dateToLocal(c.balances[0].asOf) } : null,
      balances: c.balances.map((b) => ({ cents: b.balanceCents, asOf: dateToLocal(b.asOf), note: b.note })),
      priorPaidCents: c.priorPaidCents, setupNote: c.setupNote,
      tiles: c.tiles.map((t) => ({
        id: t.id, number: t.number, amountCents: t.amountCents, status: t.status,
        reserved: t.lines.some((l) => l.status === "RESERVED"),
        payment: t.payments[0] ? { id: t.payments[0].id, paidOn: dateToLocal(t.payments[0].paidOn), source: t.payments[0].source } : null,
      })),
    };
  });
}

// ───────────────────────── Roth tax year & SCHD corrections (Phase 3 fixes) ─────────────────────────

/** Change the intended tax year of a Roth line before it is confirmed. */
export async function setRothLineTaxYear(ownerId: string, lineId: string, taxYear: number) {
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) throw new UserError("Choose a valid tax year.");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AllocationLine" WHERE id = ${lineId} FOR UPDATE`;
    const line = await tx.allocationLine.findFirst({ where: { id: lineId, plan: { ownerId } } });
    if (!line) throw new UserError("Allocation not found.");
    if (line.target !== "ROTH") throw new UserError("Only Roth IRA allocations have a tax year.");
    if (line.status === "COMPLETED") throw new UserError("Already confirmed. Correct the contribution to change its tax year.");
    if (line.status === "CANCELLED") throw new UserError("This allocation was released.");
    await tx.allocationLine.update({ where: { id: lineId }, data: { taxYear } });
    await audit(tx, ownerId, "AllocationLine", lineId, `roth-tax-year:${taxYear}`, { taxYear: line.taxYear }, { taxYear });
  });
}

/**
 * Mark an unverified historical SCHD day as NOT done. It becomes OPEN, so it is automatically
 * the next sequential day. Only PROVISIONAL days qualify — confirmed contributions are never undone
 * here (use a correction instead).
 */
export async function markSchdDayNotDone(ownerId: string, day: number) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.challengeTile.findFirst({ where: { number: day, challenge: { ownerId, kind: "SCHD" } } });
    if (!t) throw new UserError(`Day ${day} not found.`);
    await tx.$queryRaw`SELECT id FROM "ChallengeTile" WHERE id = ${t.id} FOR UPDATE`;
    const fresh = await tx.challengeTile.findUniqueOrThrow({ where: { id: t.id } });
    if (fresh.status === "COMPLETED") throw new UserError(`Day ${day} is a confirmed contribution. Use “Correct” if it didn't happen.`);
    if (fresh.status === "OPEN") return;
    await tx.challengeTile.update({ where: { id: t.id }, data: { status: "OPEN" } });
    await audit(tx, ownerId, "ChallengeTile", t.id, `schd-day-not-done:${day}`, { status: fresh.status }, { status: "OPEN" });
  });
}
