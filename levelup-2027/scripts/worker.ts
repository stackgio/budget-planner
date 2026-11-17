/**
 * Local reminder worker — no paid service needed. Runs a scheduler tick every minute.
 *   npm run worker            (loop)
 *   npm run worker -- --once  (single tick)
 * Safe to restart at any time: all state lives in PostgreSQL and every step is idempotent.
 */
import { runSchedulerExclusive } from "../src/server/notifications";
import { prisma } from "../src/server/db";

const once = process.argv.includes("--once");
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

async function tick() {
  try {
    const r = await runSchedulerExclusive({ worker: `local-${process.pid}` });
    if (r.skipped) console.log(new Date().toISOString(), "another worker holds the lock — skipped");
    else console.log(new Date().toISOString(), `created ${r.created} · delivered ${r.delivered} · deferred ${r.deferred} · suppressed ${r.suppressed} · expired ${r.expired} · pushed ${r.pushed} · failed ${r.failed}`);
  } catch (e) {
    console.error(new Date().toISOString(), "tick failed:", e instanceof Error ? e.name : "error");
  }
}

async function main() {
  await tick();
  while (!once && !stopping) {
    await new Promise((r) => setTimeout(r, 60_000));
    if (!stopping) await tick();
  }
  await prisma.$disconnect();
}
main();
