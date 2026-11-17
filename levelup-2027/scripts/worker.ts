/**
 * Local reminder worker — no paid service needed. Runs a scheduler tick every minute.
 *   npm run worker            (loop)
 *   npm run worker -- --once  (single tick)
 * Safe to restart at any time: all state lives in PostgreSQL and every step is idempotent.
 */
import { runSchedulerExclusive } from "../src/server/notifications";
import { prisma } from "../src/server/db";
import { pruneAuthRecords } from "../src/server/auth-maintenance";
import { runScheduledBackup } from "../src/server/backup-service";

const once = process.argv.includes("--once");
let stopping = false;
let wake: (() => void) | null = null;
const stop = () => { stopping = true; wake?.(); }; // finish the current tick, then exit promptly
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function tick() {
  try {
    const r = await runSchedulerExclusive({ worker: `local-${process.pid}` });
    if (r.skipped) console.log(new Date().toISOString(), "another worker holds the lock — skipped");
    else console.log(new Date().toISOString(), `created ${r.created} · delivered ${r.delivered} · deferred ${r.deferred} · suppressed ${r.suppressed} · expired ${r.expired} · pushed ${r.pushed} · failed ${r.failed}`);
  } catch (e) {
    console.error(new Date().toISOString(), "tick failed:", e instanceof Error ? e.name : "error");
  }
  await pruneAuthRecords().catch(() => {}); // old login attempts + expired sessions
  try {
    const b = await runScheduledBackup();
    if (b === "done") console.log(new Date().toISOString(), "daily encrypted backup saved and verified");
  } catch (e) {
    console.error(new Date().toISOString(), "daily backup failed (recorded; retried within the hour):", e instanceof Error ? e.name : "error");
  }
}

async function main() {
  await tick();
  while (!once && !stopping) {
    await new Promise<void>((r) => { const t = setTimeout(r, 60_000); wake = () => { clearTimeout(t); r(); }; });
    if (!stopping) await tick();
  }
  await prisma.$disconnect();
}
main();
