/** Local performance probe (read-only): times the heaviest read paths against DATABASE_URL. */
import { prisma } from "../src/server/db";
import { loadAnalytics } from "../src/server/analytics";
import { gigSummary, listSessions } from "../src/server/gig";
import { loadOccurrences } from "../src/server/calendar";
import { periodFor } from "../src/domain/periods";
import { todayLocal, zonedToInstant, addDays } from "../src/domain/dates";

(async () => {
  const u = await prisma.user.findFirst();
  if (!u) { console.log("no owner in this database"); return; }
  const tz = "America/New_York", today = todayLocal(tz);
  const time = async (label: string, f: () => Promise<unknown>) => {
    await f(); // warm
    const runs: number[] = [];
    for (let i = 0; i < 5; i++) { const t = performance.now(); await f(); runs.push(performance.now() - t); }
    runs.sort((a, b) => a - b);
    console.log(`${label.padEnd(34)} median ${runs[2]!.toFixed(1)} ms  max ${runs[4]!.toFixed(1)} ms`);
  };
  await time("analytics: month", () => loadAnalytics(u.id, periodFor("month", today), today, tz, "2026-01-01"));
  await time("analytics: year", () => loadAnalytics(u.id, periodFor("year", today), today, tz, "2026-01-01"));
  await time("analytics: 3-year custom", () => loadAnalytics(u.id, periodFor("custom", today, { from: "2024-01-01", to: "2026-12-31" }), today, tz, "2026-01-01"));
  await time("gig summary: year", () => gigSummary(u.id, `${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`));
  await time("gig sessions: year", () => listSessions(u.id, `${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`));
  await time("calendar: 6 weeks", () => loadOccurrences(u.id, tz, zonedToInstant(today, "00:00", tz), zonedToInstant(addDays(today, 42), "00:00", tz)));
  const counts = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "AuditLog"`;
  console.log(`rows: auditLog ${counts[0]!.n}, payday ${await prisma.payday.count()}, deposits ${await prisma.incomeDeposit.count()}`);
  await prisma.$disconnect();
})();
