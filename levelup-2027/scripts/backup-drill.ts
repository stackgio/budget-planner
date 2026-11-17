/**
 * Full backup & restore drill on SYNTHETIC data and TEMPORARY databases. Never touches levelup_dev or
 * your real key. Steps: create temp DB → migrate → seed synthetic data → snapshot → encrypted backup →
 * verify → wrong passphrase / tampered file rejected → restore into a NEW temp DB → snapshot must match →
 * wrong / missing DATA_ENCRYPTION_KEY fail safely → drop both temp DBs.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createBackup, dropTemporaryDatabase, restoreToNewDatabase, verifyBackup } from "../src/server/backup";

const admin = process.env.DRILL_ADMIN_URL || "postgresql://levelup:levelup_local_dev@localhost:5432/postgres";
const ts = Date.now().toString(36);
const SRC = `levelup_drill_src_${ts}`, DST = `levelup_drill_restore_${ts}`;
const urlFor = (db: string) => { const u = new URL(admin); u.pathname = `/${db}`; return u.toString(); };
const key = randomBytes(32).toString("base64");          // synthetic, discarded at the end
const passphrase = randomBytes(24).toString("base64url"); // synthetic, discarded at the end
const step = (n: number, s: string) => console.log(`${String(n).padStart(2)}. ${s}`);

function child(args: string[], env: Record<string, string>) {
  const r = spawnSync("npx", ["tsx", "--conditions=react-server", ...args], { env: { ...process.env, ...env }, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${args.join(" ")} failed: ${(r.stderr || "").split("\n").slice(-4).join(" ")}`);
  return r.stdout.trim().split("\n").pop()!;
}

async function main() {
  const work = mkdtempSync(path.join(tmpdir(), "levelup-drill-"));
  try {
    step(1, `Create temporary database ${SRC} and apply migrations`);
    assert.equal(spawnSync("createdb", [SRC], { env: { ...process.env, PGPASSWORD: new URL(admin).password, PGHOST: new URL(admin).hostname, PGUSER: new URL(admin).username } }).status, 0, "createdb failed");
    assert.equal(spawnSync("npx", ["prisma", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: urlFor(SRC) }, encoding: "utf8" }).status, 0, "migrate failed");

    step(2, "Seed synthetic data: ledger, roulette, challenges, auth, goals, tasks, encrypted notes, notification settings, gig");
    child(["scripts/drill-data.ts", "seed"], { DATABASE_URL: urlFor(SRC), DATA_ENCRYPTION_KEY: key });
    const before = JSON.parse(child(["scripts/drill-data.ts", "snapshot"], { DATABASE_URL: urlFor(SRC), DATA_ENCRYPTION_KEY: key }));
    assert.deepEqual(before.owners[0].reconcileIssues, [], "source ledger must reconcile");
    assert.equal(before.privateNotes.readable, before.privateNotes.total);

    step(3, "Create an encrypted backup");
    const b = await createBackup({ databaseUrl: urlFor(SRC), dir: work, passphrase });
    const raw = readFileSync(b.file);
    assert.ok(!raw.includes(Buffer.from("Synthetic")), "backup must not contain plaintext");
    assert.ok(!raw.includes(Buffer.from(key)), "backup must not contain the encryption key");

    step(4, "Verify the backup (decrypt, checksum, table of contents)");
    const v = await verifyBackup(b.file, passphrase);
    console.log(`    ${v.tables} tables, migration ${v.latestMigration}, ${(b.bytes / 1024).toFixed(0)} KB encrypted`);

    step(5, "Wrong passphrase and a tampered file are both rejected");
    await assert.rejects(verifyBackup(b.file, passphrase + "x"), /wrong passphrase|changed or damaged/);
    const tampered = Buffer.from(raw); const at = tampered.length - 40; tampered.writeUInt8(tampered.readUInt8(at) ^ 0xff, at);
    writeFileSync(path.join(work, "tampered.lubk"), tampered);
    await assert.rejects(verifyBackup(path.join(work, "tampered.lubk"), passphrase), /changed or damaged/);
    await assert.rejects(restoreToNewDatabase({ file: b.file, passphrase, adminUrl: admin, dbName: "levelup_dev" }), /temporary database/);

    step(6, `Restore into a NEW temporary database ${DST}`);
    const restoredUrl = await restoreToNewDatabase({ file: b.file, passphrase, adminUrl: admin, dbName: DST });

    step(7, "Compare: counts, ledger, challenges, auth, notes, notification settings, gig, analytics totals");
    const after = JSON.parse(child(["scripts/drill-data.ts", "snapshot"], { DATABASE_URL: restoredUrl, DATA_ENCRYPTION_KEY: key }));
    assert.deepEqual(after, before, "restored snapshot must equal the source snapshot");
    console.log(`    ${Object.values(after.counts as Record<string, number>).reduce((a, c) => a + c, 0)} rows identical; ledger issues: none; key: ${after.keyStatus}; notes readable ${after.privateNotes.readable}/${after.privateNotes.total}`);

    step(8, "Wrong encryption key → safe failure (no crash, notes show the locked notice)");
    const wrong = JSON.parse(child(["scripts/drill-data.ts", "snapshot"], { DATABASE_URL: restoredUrl, DATA_ENCRYPTION_KEY: randomBytes(32).toString("base64") }));
    assert.equal(wrong.keyStatus, "MISMATCH");
    assert.equal(wrong.privateNotes.readable, 0);
    assert.equal(wrong.privateNotes.safelyUnavailable, before.privateNotes.total);
    assert.deepEqual(wrong.owners[0].ledger, before.owners[0].ledger, "money data is unaffected by the key");

    step(9, "Missing encryption key → safe failure");
    const missing = JSON.parse(child(["scripts/drill-data.ts", "snapshot"], { DATABASE_URL: restoredUrl, DATA_ENCRYPTION_KEY: "" }));
    assert.equal(missing.keyStatus, "MISSING");
    assert.equal(missing.privateNotes.readable, 0);

    console.log("\nRESTORE DRILL PASSED");
    console.log(JSON.stringify({ rows: after.counts, ledger: after.owners[0].ledger, challenges: after.owners[0].challenges, gig: after.owners[0].gig, notes: after.privateNotes, key: after.keyStatus }));
  } finally {
    rmSync(work, { recursive: true, force: true });
    await dropTemporaryDatabase(admin, SRC).catch(() => {});
    await dropTemporaryDatabase(admin, DST).catch(() => {});
    step(10, "Temporary databases and files removed");
  }
}
main().catch((e) => { console.error("RESTORE DRILL FAILED:", e instanceof Error ? e.message : e); process.exit(1); });
