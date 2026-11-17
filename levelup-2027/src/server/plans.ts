import "server-only";
import type { PlanKind } from "@prisma/client";
import { prisma } from "./db";
import { depositBalance, rothRoom } from "./ledger";
import { dateToLocal } from "@/domain/dates";
import type { LineTarget } from "@/app/(app)/money/parts";

export interface PlanLineView {
  id: string; target: LineTarget; label: string | null; tileId: string | null; tileNumber: number | null;
  amountCents: number; paidCents: number | null; taxYear: number | null; status: "PLANNED" | "RESERVED" | "COMPLETED" | "CANCELLED";
  payment: { id: string; paidOn: string; amountCents: number; taxYear: number | null; reversed: boolean } | null;
  reversal: { paidOn: string; note: string | null } | null;
}

const include = {
  lines: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    include: { tile: true, payments: { orderBy: { createdAt: "asc" as const } } },
  },
  deposit: { include: { payday: true } },
};

type Loaded = NonNullable<Awaited<ReturnType<typeof findPlan>>>;
const findPlan = (ownerId: string, where: object) => prisma.allocationPlan.findFirst({ where: { ownerId, ...where }, include });

function view(p: Loaded) {
  const lines: PlanLineView[] = p.lines.map((l) => {
    const orig = l.payments.find((x) => !x.reversalOfId);
    const rev = l.payments.find((x) => x.reversalOfId);
    return {
      id: l.id, target: l.target, label: l.label, tileId: l.tileId, tileNumber: l.tile?.number ?? null,
      amountCents: l.amountCents, paidCents: l.paidCents, taxYear: l.taxYear, status: l.status,
      payment: orig ? { id: orig.id, paidOn: dateToLocal(orig.paidOn), amountCents: orig.amountCents, taxYear: orig.taxYear, reversed: !!orig.reversedAt } : null,
      reversal: rev ? { paidOn: dateToLocal(rev.createdAt), note: rev.note } : null,
    };
  });
  const live = lines.filter((l) => l.status !== "CANCELLED");
  const sum = (f: (l: PlanLineView) => boolean, v: (l: PlanLineView) => number = (l) => l.amountCents) => live.filter(f).reduce((a, l) => a + v(l), 0);
  return {
    id: p.id, kind: p.kind, status: p.status, version: p.version, budgetCents: p.budgetCents, seed: p.seed,
    forecastMonth: p.forecastMonth, forecastCents: p.forecastCents, leftoverToFun: p.leftoverToFun,
    params: (p.params ?? {}) as { budgetCents?: number | null; rothCents?: number | null; funCents?: number | null; leftoverToFun?: boolean | null; challengesOnly?: string[] | null; challengeBudgetCents?: number | null },
    approvedAt: p.approvedAt, createdAt: p.createdAt,
    deposit: p.deposit ? { id: p.deposit.id, kind: p.deposit.kind, netCents: p.deposit.netCents, date: dateToLocal(p.deposit.actualDepositDate), official: p.deposit.payday ? dateToLocal(p.deposit.payday.officialDate) : null } : null,
    lines,
    totals: {
      plannedCents: sum((l) => l.status === "PLANNED"),
      reservedCents: sum((l) => l.status === "RESERVED"),
      completedCents: sum((l) => l.status === "COMPLETED", (l) => l.paidCents ?? 0),
      funCents: sum((l) => l.target === "FUN"),
      challengeCents: sum((l) => !!l.tileId),
      allocatedCents: sum(() => true, (l) => (l.status === "COMPLETED" ? (l.paidCents ?? 0) : l.amountCents)),
    },
  };
}
export type PlanView = ReturnType<typeof view>;

export async function loadPlan(ownerId: string, planId: string) {
  const p = await findPlan(ownerId, { id: planId });
  return p ? view(p) : null;
}

export async function loadDraft(ownerId: string, kind: PlanKind, depositId: string | null, forecastMonth?: string | null) {
  const p = await findPlan(ownerId, depositId ? { kind, depositId, status: "DRAFT" } : { kind, depositId: null, forecastMonth, status: "DRAFT" });
  return p ? view(p) : null;
}

export async function listPlans(ownerId: string, where: { kind?: PlanKind; depositId?: string } = {}) {
  const ps = await prisma.allocationPlan.findMany({ where: { ownerId, ...where, status: { not: "DRAFT" } }, include, orderBy: { createdAt: "desc" }, take: 30 });
  return ps.map(view);
}

/** Confirmed deposits of a kind with what's still unallocated. */
export async function depositsWithBalance(ownerId: string, kind: "OVERTIME" | "REGULAR" | "GIG") {
  const ds = await prisma.incomeDeposit.findMany({ where: { ownerId, kind, voidedAt: null }, include: { payday: true }, orderBy: { actualDepositDate: "desc" } });
  return Promise.all(ds.map(async (d) => ({
    id: d.id, date: dateToLocal(d.actualDepositDate), official: d.payday ? dateToLocal(d.payday.officialDate) : null,
    ...(await depositBalance(prisma, ownerId, d.id)),
  })));
}

export { rothRoom };
