import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { UserError } from "@/server/payroll";
import { approvePlan, depositBalance, ledgerOverview, reconcile, spin } from "@/server/ledger";
import {
  addPlatform, archiveMileage, archiveSession, confirmPayout, gigCsv, gigSummary, listPayouts, listPlatforms, listSessions,
  planGigShift, saveGigSettings, saveMileage, saveSession, setPlatformArchived, voidPayout, type SessionInput,
} from "@/server/gig";
import { zonedToInstant } from "@/domain/dates";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
let ownerId: string;
let dd: string, veho: string;
beforeEach(async () => {
  ownerId = (await freshOwner()).id;
  const ps = await listPlatforms(ownerId);
  dd = ps.find((p) => p.name === "DoorDash")!.id;
  veho = ps.find((p) => p.name === "Veho")!.id;
});
const key = () => randomUUID();
const base = (o: Partial<SessionInput> = {}): SessionInput => ({
  platformId: dd, workDate: "2027-02-06", startTime: "17:00", endTime: "20:30", grossCents: 8_500, tipsCents: 3_000, tipsInGross: true,
  bonusCents: 500, bonusInGross: true, parkingTollsCents: 0, otherExpenseCents: 0, ...o,
});

describe("Gig setup", () => {
  it("creates the four default platforms and a $500 monthly target once", async () => {
    const names = (await listPlatforms(ownerId)).map((p) => p.name);
    expect(names).toEqual(["DoorDash", "Veho", "Instacart", "Shipt"]);
    await listPlatforms(ownerId);
    expect(await prisma.gigPlatform.count({ where: { ownerId } })).toBe(4);
    expect((await prisma.gigSettings.findUniqueOrThrow({ where: { ownerId } })).monthlyTargetCents).toBe(50_000);
  });
  it("adds custom sources, rejects duplicates, archives without deleting", async () => {
    const p = await addPlatform(ownerId, "Uber Eats");
    await expect(addPlatform(ownerId, "Uber Eats")).rejects.toThrow(/already have/);
    await setPlatformArchived(ownerId, p.id, true);
    expect((await listPlatforms(ownerId)).some((x) => x.name === "Uber Eats")).toBe(false);
    expect((await listPlatforms(ownerId, true)).some((x) => x.name === "Uber Eats")).toBe(true);
  });
  it("target and planning settings are editable and validated", async () => {
    await saveGigSettings(ownerId, { monthlyTargetCents: 75_000, taxReserveBps: 2500, costPerMileMills: null });
    await expect(saveGigSettings(ownerId, { monthlyTargetCents: 1, taxReserveBps: 20_000, costPerMileMills: null })).rejects.toThrow(UserError);
    const s = await gigSummary(ownerId, "2027-02-01", "2027-02-28", { monthTarget: true });
    expect(s.target!.monthlyTargetCents).toBe(75_000);
  });
});

describe("Gig sessions", () => {
  it("logging work creates no money and computes hours from start/end", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    expect(s.minutes).toBe(210);
    expect(s.startAt!.toISOString()).toBe(zonedToInstant("2027-02-06", "17:00", TZ).toISOString());
    expect(await prisma.incomeDeposit.count()).toBe(0);
    const ov = await ledgerOverview(ownerId, 2027);
    expect(ov.totalIncomeCents).toBe(0);
    expect(ov.availableCents).toBe(0);
  });
  it("tips and bonus included in gross are not counted twice", async () => {
    await saveSession(ownerId, TZ, null, base()); // 85 incl. tips + bonus
    await saveSession(ownerId, TZ, null, base({ grossCents: 4_000, tipsCents: 1_000, tipsInGross: false, bonusCents: 200, bonusInGross: false, startTime: null, endTime: null, minutes: 90 })); // 40 + 10 + 2
    const s = await gigSummary(ownerId, "2027-02-01", "2027-02-28");
    expect(s.totals.earningsCents).toBe(8_500 + 5_200);
    expect(s.totals.minutes).toBe(300);
    expect(s.totals.earningsPerHourCents).toBe(Math.round((13_700 * 60) / 300));
  });
  it("rejects tips larger than gross when tips are included, and bad times", async () => {
    await expect(saveSession(ownerId, TZ, null, base({ tipsCents: 9_000 }))).rejects.toThrow(/Tips can't be more/);
    await expect(saveSession(ownerId, TZ, null, base({ startTime: "17:00", endTime: null }))).rejects.toThrow(/both a start and an end/);
    await expect(saveSession(ownerId, TZ, null, base({ startTime: null, endTime: null, minutes: 20 * 60 }))).rejects.toThrow(UserError);
  });
  it("overnight session crosses midnight correctly", async () => {
    const s = await saveSession(ownerId, TZ, null, base({ startTime: "22:00", endTime: "01:30" }));
    expect(s.minutes).toBe(210);
  });
  it("edits bump the version and stale edits are refused", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    await saveSession(ownerId, TZ, s.id, base({ grossCents: 9_000 }), { expectedVersion: 1 });
    await expect(saveSession(ownerId, TZ, s.id, base({ grossCents: 9_500 }), { expectedVersion: 1 })).rejects.toThrow(/changed in another window/);
  });
  it("session miles live in the mileage log once; removing a session removes them from totals", async () => {
    const s = await saveSession(ownerId, TZ, null, base({ milesHundredths: 2_350 }));
    await saveSession(ownerId, TZ, s.id, base({ milesHundredths: 2_500 }));
    expect(await prisma.gigMileage.count({ where: { ownerId } })).toBe(1);
    expect((await gigSummary(ownerId, "2027-02-01", "2027-02-28")).totals.milesHundredths).toBe(2_500);
    await archiveSession(ownerId, s.id);
    const sum = await gigSummary(ownerId, "2027-02-01", "2027-02-28");
    expect(sum.totals.milesHundredths).toBe(0);
    expect(sum.totals.sessions).toBe(0);
  });
  it("notes are encrypted at rest", async () => {
    const s = await saveSession(ownerId, TZ, null, base({ notes: "Downtown was slow" }));
    const raw = await prisma.gigSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(raw.notesCipher).not.toContain("slow");
    expect((await listSessions(ownerId, "2027-02-01", "2027-02-28"))[0]!.notes).toBe("Downtown was slow");
  });
});

describe("Profit math and settings", () => {
  it("expenses, user cost-per-mile and the tax-reserve planning estimate", async () => {
    await saveSession(ownerId, TZ, null, base({ parkingTollsCents: 300, otherExpenseCents: 200, milesHundredths: 4_000 }));
    let s = await gigSummary(ownerId, "2027-02-01", "2027-02-28");
    expect(s.totals.mileageCostCents).toBeNull(); // no rate is ever assumed
    expect(s.totals.estProfitCents).toBe(8_500 - 500);
    expect(s.totals.taxReserveCents).toBeNull();
    await saveGigSettings(ownerId, { monthlyTargetCents: 50_000, taxReserveBps: 2_000, costPerMileMills: 300 });
    s = await gigSummary(ownerId, "2027-02-01", "2027-02-28");
    expect(s.totals.mileageCostCents).toBe(1_200); // 40 mi × $0.300
    expect(s.totals.estProfitCents).toBe(8_500 - 500 - 1_200);
    expect(s.totals.taxReserveCents).toBe(Math.round(6_800 * 0.2));
  });
  it("no sessions → no per-hour figure (no divide by zero)", async () => {
    const s = await gigSummary(ownerId, "2027-02-01", "2027-02-28", { monthTarget: true });
    expect(s.totals.earningsPerHourCents).toBeNull();
    expect(s.target!.pct).toBe(0);
  });
});

describe("Mileage log", () => {
  it("manual trips with odometer readings, correction and removal", async () => {
    const m = await saveMileage(ownerId, null, { platformId: veho, tripDate: "2027-02-07", milesHundredths: 1_210, purpose: "Drive to Veho hub", odometerStartTenths: 452_100, odometerEndTenths: 452_221 });
    await saveMileage(ownerId, m.id, { platformId: veho, tripDate: "2027-02-07", milesHundredths: 1_250, purpose: "Drive to Veho hub", odometerStartTenths: 452_100, odometerEndTenths: 452_225 });
    expect((await gigSummary(ownerId, "2027-02-01", "2027-02-28")).totals.milesHundredths).toBe(1_250);
    await expect(saveMileage(ownerId, null, { tripDate: "2027-02-07", milesHundredths: 100, purpose: "x" })).rejects.toThrow(/purpose/);
    await expect(saveMileage(ownerId, null, { tripDate: "2027-02-07", milesHundredths: 100, purpose: "Trip", odometerStartTenths: 10, odometerEndTenths: 5 })).rejects.toThrow(/ending odometer/);
    await archiveMileage(ownerId, m.id);
    expect((await gigSummary(ownerId, "2027-02-01", "2027-02-28")).totals.milesHundredths).toBe(0);
    expect(await prisma.auditLog.count({ where: { entity: "GigMileage" } })).toBe(3);
  });
});

describe("Payouts and the ledger", () => {
  it("a confirmed payout creates exactly one GIG deposit and marks sessions paid", async () => {
    const s1 = await saveSession(ownerId, TZ, null, base());
    const s2 = await saveSession(ownerId, TZ, null, base({ workDate: "2027-02-07" }));
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 16_950, depositDate: "2027-02-09", sessionIds: [s1.id, s2.id], idempotencyKey: key() });
    const deps = await prisma.incomeDeposit.findMany();
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({ kind: "GIG", netCents: 16_950, paydayId: null });
    expect((await prisma.gigSession.findMany({ where: { payoutId: p.id } })).every((s) => s.status === "PAID")).toBe(true);
    const ov = await ledgerOverview(ownerId, 2027);
    expect(ov.gigCents).toBe(16_950);
    expect(ov.regularCents + ov.overtimeCents).toBe(0); // kept separate from DOC income
    expect(ov.availableCents).toBe(16_950);
    const sum = await gigSummary(ownerId, "2027-02-01", "2027-02-28");
    expect(sum.payoutsCents).toBe(16_950);
    expect(sum.totals.earningsCents).toBe(17_000); // earnings ≠ deposited
    expect(await reconcile(ownerId)).toEqual([]);
  });
  it("the same idempotency key never records twice; reuse with other data is refused", async () => {
    const k = key();
    const a = await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: k });
    const b = await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: k });
    expect(b.id).toBe(a.id);
    await expect(confirmPayout(ownerId, { platformId: dd, netCents: 6_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: k })).rejects.toThrow(/different data/);
    expect(await prisma.incomeDeposit.count()).toBe(1);
  });
  it("a likely duplicate (same source, date, amount) needs explicit confirmation", async () => {
    await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    await expect(confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() })).rejects.toThrow(/already confirmed/);
    await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], confirmSeparate: true, idempotencyKey: key() });
    expect(await prisma.incomeDeposit.count()).toBe(2);
  });
  it("a platform payout ID can be confirmed only once", async () => {
    await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", externalRef: "PO-123", sessionIds: [], idempotencyKey: key() });
    await expect(confirmPayout(ownerId, { platformId: dd, netCents: 7_000, depositDate: "2027-02-10", externalRef: "PO-123", sessionIds: [], idempotencyKey: key() })).rejects.toThrow(/already confirmed/);
  });
  it("concurrent confirmations of the same payout with different keys record it once", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    const attempt = () => confirmPayout(ownerId, { platformId: dd, netCents: 8_500, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() });
    const results = await Promise.allSettled([attempt(), attempt(), attempt(), attempt()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.incomeDeposit.count()).toBe(1);
    expect(await reconcile(ownerId)).toEqual([]);
  });
  it("concurrent replays of one key return one payout", async () => {
    const k = key();
    const rs = await Promise.all([1, 2, 3].map(() => confirmPayout(ownerId, { platformId: dd, netCents: 4_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: k })));
    expect(new Set(rs.map((r) => r.id)).size).toBe(1);
    expect(await prisma.incomeDeposit.count()).toBe(1);
  });
  it("a session can be in only one payout, and only for its own platform", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    await confirmPayout(ownerId, { platformId: dd, netCents: 8_500, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() });
    await expect(confirmPayout(ownerId, { platformId: dd, netCents: 8_000, depositDate: "2027-02-10", sessionIds: [s.id], idempotencyKey: key() })).rejects.toThrow(/another confirmed payout/);
    const v = await saveSession(ownerId, TZ, null, base({ platformId: veho }));
    await expect(confirmPayout(ownerId, { platformId: dd, netCents: 8_000, depositDate: "2027-02-10", sessionIds: [v.id], idempotencyKey: key() })).rejects.toThrow(/Only DoorDash sessions/);
  });
  it("paid sessions can't be removed and amount corrections need a reason (deposit unchanged)", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    await confirmPayout(ownerId, { platformId: dd, netCents: 8_500, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() });
    await expect(archiveSession(ownerId, s.id)).rejects.toThrow(/confirmed payout/);
    await expect(saveSession(ownerId, TZ, s.id, base({ grossCents: 9_000 }))).rejects.toThrow(/correction reason/);
    await saveSession(ownerId, TZ, s.id, base({ grossCents: 9_000 }), { correctionReason: "Platform adjusted the order total" });
    expect((await prisma.incomeDeposit.findFirstOrThrow()).netCents).toBe(8_500);
    expect(await prisma.auditLog.count({ where: { entity: "GigSession", action: { startsWith: "correct:" } } })).toBe(1);
  });
  it("void-and-re-enter correction keeps history and frees the sessions", async () => {
    const s = await saveSession(ownerId, TZ, null, base());
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 8_500, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() });
    await voidPayout(ownerId, p.id, "Typed the wrong amount");
    expect((await prisma.gigSession.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("PENDING");
    await confirmPayout(ownerId, { platformId: dd, netCents: 8_050, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() });
    expect(await prisma.incomeDeposit.count()).toBe(2);
    expect((await ledgerOverview(ownerId, 2027)).gigCents).toBe(8_050);
    expect((await listPayouts(ownerId, { includeVoided: true })).filter((x) => x.voidedAt)).toHaveLength(1);
    expect(await reconcile(ownerId)).toEqual([]);
  });
  it("a payout whose money is committed in a plan can't be voided", async () => {
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 20_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: p.depositId });
    await approvePlan(ownerId, planId);
    await expect(voidPayout(ownerId, p.id, "mistake")).rejects.toThrow(/approved or completed/);
    const b = await depositBalance(prisma, ownerId, p.depositId);
    expect(b.availableCents).toBeGreaterThanOrEqual(0);
  });
  it("gig money is never spun automatically: regular planner refuses it", async () => {
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 20_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    await expect(spin(ownerId, { kind: "EXTRA_PAYCHECK", depositId: p.depositId })).rejects.toThrow(/regular paycheck/);
    expect(await prisma.allocationPlan.count()).toBe(0); // nothing was planned until you choose
  });
  it("the database refuses a gig deposit without a payout and payout deletes", async () => {
    await expect(prisma.incomeDeposit.create({ data: { ownerId, kind: "GIG", netCents: 100, actualDepositDate: new Date("2027-02-09") } })).rejects.toThrow(/LEVELUP_LEDGER/);
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    await expect(prisma.gigPayout.delete({ where: { id: p.id } })).rejects.toThrow(/LEVELUP_LEDGER/);
    await expect(prisma.gigPayout.update({ where: { id: p.id }, data: { voidedAt: new Date() } })).rejects.toThrow(/LEVELUP_LEDGER/);
    await expect(prisma.gigSession.create({ data: { ownerId, platformId: dd, workDate: new Date("2027-02-06"), minutes: 10, grossCents: 1, status: "PAID" } })).rejects.toThrow();
  });
});

describe("Authorization boundaries", () => {
  it("another account can't see, edit, pay or void your gig records", async () => {
    const other = (await prisma.user.create({ data: { email: "other@example.test", passwordHash: "x" } })).id;
    const s = await saveSession(ownerId, TZ, null, base({ milesHundredths: 500 }));
    const p = await confirmPayout(ownerId, { platformId: dd, netCents: 5_000, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    const otherDd = (await listPlatforms(other)).find((x) => x.name === "DoorDash")!.id;
    await expect(saveSession(other, TZ, s.id, base({ platformId: otherDd }))).rejects.toThrow(/not found/);
    await expect(saveSession(other, TZ, null, base({ platformId: dd }))).rejects.toThrow(/income source/);
    await expect(archiveSession(other, s.id)).rejects.toThrow(/not found/);
    await expect(voidPayout(other, p.id, "nope")).rejects.toThrow(/not found/);
    await expect(confirmPayout(other, { platformId: otherDd, netCents: 1, depositDate: "2027-02-09", sessionIds: [s.id], idempotencyKey: key() })).rejects.toThrow(/weren't found/);
    expect(await listSessions(other, "2027-01-01", "2027-12-31")).toEqual([]);
    expect((await gigSummary(other, "2027-01-01", "2027-12-31")).totals.milesHundredths).toBe(0);
    expect(await gigCsv(other, "payouts", "2027-01-01", "2027-12-31")).not.toContain("50.00");
  });
});

describe("Scheduling", () => {
  it("a planned gig shift during a DOC shift is blocked unless overridden, and never counts as work", async () => {
    const docBefore = await prisma.calendarEvent.count({ where: { category: "DOC_SHIFT" } });
    await prisma.calendarEvent.create({ data: { ownerId, title: "DOC shift", category: "DOC_SHIFT", startAt: zonedToInstant("2027-03-06", "08:00", TZ), endAt: zonedToInstant("2027-03-06", "16:00", TZ) } });
    const blocked = await planGigShift(ownerId, TZ, { platformId: dd, date: "2027-03-06", time: "15:00", durationMin: 180 }, false);
    expect(blocked.created).toBeNull();
    expect(blocked.check.conflicts[0]).toMatch(/DOC shift/);
    expect(blocked.check.suggestions.length).toBeGreaterThan(0);
    const ok = await planGigShift(ownerId, TZ, { platformId: dd, date: "2027-03-06", time: "17:00", durationMin: 180, targetCents: 8_000 }, false);
    expect(ok.created).not.toBeNull();
    const forced = await planGigShift(ownerId, TZ, { platformId: dd, date: "2027-03-06", time: "15:00", durationMin: 60 }, true);
    expect(forced.created).not.toBeNull();
    const s = await gigSummary(ownerId, "2027-03-01", "2027-03-31");
    expect(s.totals.sessions).toBe(0);
    expect(s.totals.earningsCents).toBe(0);
    expect(await prisma.calendarEvent.count({ where: { category: "DOC_SHIFT" } })).toBe(docBefore + 1); // nothing was moved or removed
  });
});

describe("Tax-prep export", () => {
  it("CSV contains sessions, mileage and payouts with a not-tax-advice header and no formula injection", async () => {
    await saveSession(ownerId, TZ, null, base({ milesHundredths: 1_000 }));
    await saveMileage(ownerId, null, { tripDate: "2027-02-08", milesHundredths: 700, purpose: "=HYPERLINK(\"x\")" });
    await confirmPayout(ownerId, { platformId: dd, netCents: 8_500, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    const sessions = await gigCsv(ownerId, "sessions", "2027-02-01", "2027-02-28");
    expect(sessions).toContain("not tax advice");
    expect(sessions).toContain("2027-02-06,DoorDash,210,85.00");
    const mileage = await gigCsv(ownerId, "mileage", "2027-02-01", "2027-02-28");
    expect(mileage).toContain("10.00");
    expect(mileage).toContain("'=HYPERLINK");
    expect(await gigCsv(ownerId, "payouts", "2027-02-01", "2027-02-28")).toContain("85.00");
  });
});
