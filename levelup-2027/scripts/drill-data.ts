/**
 * Child process for the backup drill. Runs against DATABASE_URL with DATA_ENCRYPTION_KEY from env.
 *   seed      — write SYNTHETIC data across every area (never real data)
 *   snapshot  — print an integrity snapshot as JSON (no secrets)
 */
import { randomUUID } from "node:crypto";
import { prisma } from "../src/server/db";
import { createOwner } from "../src/server/bootstrap";
import { recordDeposit } from "../src/server/payroll";
import { approvePlan, completeLine, spin } from "../src/server/ledger";
import { createGoal } from "../src/server/growth";
import { createTask } from "../src/server/tasks";
import { encrypt, verifyKey } from "../src/server/crypto";
import { savePrefs } from "../src/server/notifications";
import { confirmPayout, listPlatforms, saveMileage, saveSession } from "../src/server/gig";
import { integritySnapshot } from "../src/server/integrity";
import { localToDbDate } from "../src/domain/dates";

async function seed() {
  const u = await createOwner(prisma, "drill@example.test", "$argon2id$v=19$m=19456,t=2,p=1$synthetic$synthetic-hash-for-drill");
  await verifyKey(prisma);
  const pay = async (kind: "OVERTIME" | "REGULAR", cents: number) => {
    const p = await prisma.payday.findFirstOrThrow({ where: { ownerId: u.id, kind, deposits: { none: {} }, officialDate: { gte: localToDbDate("2027-01-01") } }, orderBy: { officialDate: "asc" } });
    return recordDeposit(u.id, p.id, { netCents: cents, actualDepositDate: "2027-01-15", idempotencyKey: randomUUID() });
  };
  await pay("REGULAR", 150_000);
  const ot = await pay("OVERTIME", 61_240);
  const { planId } = await spin(u.id, { kind: "OVERTIME_ROULETTE", depositId: ot.id, seed: "drill" });
  await approvePlan(u.id, planId);
  const lines = await prisma.allocationLine.findMany({ where: { planId }, orderBy: { sortOrder: "asc" } });
  for (const l of lines.slice(0, 3)) await completeLine(u.id, l.id, { paidCents: l.amountCents, paidOn: "2027-01-16", idempotencyKey: randomUUID() });
  await createGoal(u.id, { title: "Synthetic goal", description: null, category: "FINANCE", horizon: "YEAR", priority: "MEDIUM", startDate: "2027-01-01", targetDate: null, unit: null, targetX100: null, source: "MANUAL", challengeId: null, habitId: null, activityKind: null, notes: "Synthetic private goal note" }, [{ title: "Step one", dueDate: "2027-02-01" }]);
  await createTask(u.id, { title: "Synthetic task", description: null, category: null, priority: "MEDIUM", dueDate: "2027-01-20", dueTime: null, rrule: null, reminderMin: null, optional: false, isTopThree: false, parentId: null });
  await prisma.faithEntry.create({ data: { ownerId: u.id, kind: "REFLECTION", date: localToDbDate("2027-01-03"), bodyCipher: encrypt("Synthetic reflection"), idempotencyKey: "drill-faith-000001" } });
  await savePrefs(u.id, { quietStart: "22:00", quietEnd: "06:00", previewDetail: false });
  const dd = (await listPlatforms(u.id)).find((p) => p.name === "DoorDash")!.id;
  const s = await saveSession(u.id, "America/New_York", null, { platformId: dd, workDate: "2027-01-09", startTime: "17:00", endTime: "20:00", grossCents: 7_250, tipsCents: 2_000, tipsInGross: true, bonusCents: 0, bonusInGross: true, parkingTollsCents: 250, otherExpenseCents: 0, milesHundredths: 3_150, notes: "Synthetic gig note" });
  await confirmPayout(u.id, { platformId: dd, netCents: 7_000, depositDate: "2027-01-12", sessionIds: [s.id], idempotencyKey: randomUUID() });
  await saveMileage(u.id, null, { tripDate: "2027-01-10", milesHundredths: 1_210, purpose: "Synthetic trip" });
  console.log(JSON.stringify({ seeded: true }));
}

(async () => {
  try {
    if (process.argv[2] === "seed") await seed();
    else console.log(JSON.stringify(await integritySnapshot()));
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
