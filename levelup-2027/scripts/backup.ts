/**
 * LEVEL UP backups (local, free).
 *   npm run backup:create                 — encrypted, timestamped backup of DATABASE_URL into BACKUP_DIR, then retention
 *   npm run backup:verify -- <file>       — decrypt + checksum + pg_restore table of contents
 *   npm run backup:restore-test -- <file> — restore into a NEW temporary database, check integrity, drop it
 * Env: DATABASE_URL, BACKUP_PASSPHRASE or BACKUP_PASSPHRASE_FILE (never stored), BACKUP_DIR (default ./backups),
 *      BACKUP_KEEP_DAILY (14), BACKUP_KEEP_WEEKLY (8). Never prints passphrases, keys or connection passwords.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { applyRetention, createBackup, dropTemporaryDatabase, readPassphrase, restoreToNewDatabase, verifyBackup } from "../src/server/backup";

const dir = path.resolve(process.env.BACKUP_DIR || "backups");
const db = process.env.DATABASE_URL ?? "";

async function main() {
  const [cmd, file] = process.argv.slice(2);
  const pass = await readPassphrase();
  if (cmd === "create") {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const b = await createBackup({ databaseUrl: db, dir, passphrase: pass });
    const v = await verifyBackup(b.file, pass);
    const r = await applyRetention(dir, Number(process.env.BACKUP_KEEP_DAILY ?? 14), Number(process.env.BACKUP_KEEP_WEEKLY ?? 8));
    console.log(`Backup created and verified: ${path.basename(b.file)} (${(b.bytes / 1024).toFixed(0)} KB, ${v.tables} tables, migration ${v.latestMigration}). Retention kept ${r.kept}, removed ${r.removed.length}.`);
  } else if (cmd === "verify") {
    if (!file) throw new Error("Usage: npm run backup:verify -- <file>");
    const v = await verifyBackup(file, pass);
    console.log(`OK: created ${v.createdAt}, ${v.tables} tables, migration ${v.latestMigration}.`);
  } else if (cmd === "restore-test") {
    if (!file) throw new Error("Usage: npm run backup:restore-test -- <file>");
    const name = `levelup_restore_${Date.now()}`;
    const url = await restoreToNewDatabase({ file, passphrase: pass, adminUrl: db, dbName: name });
    try {
      const r = spawnSync("npx", ["tsx", "--conditions=react-server", "scripts/drill-data.ts", "snapshot"], { env: { ...process.env, DATABASE_URL: url }, encoding: "utf8" });
      if (r.status !== 0) throw new Error("Integrity check failed on the restored copy.");
      const snap = JSON.parse(r.stdout.trim().split("\n").pop()!);
      const issues = snap.owners.flatMap((o: { reconcileIssues: string[] }) => o.reconcileIssues);
      console.log(`Restored into temporary database ${name}: ${Object.values(snap.counts as Record<string, number>).reduce((a, b) => a + b, 0)} rows; ledger issues: ${issues.length ? issues.join(", ") : "none"}; encryption key: ${snap.keyStatus}; private notes readable ${snap.privateNotes.readable}/${snap.privateNotes.total}.`);
      if (issues.length) process.exitCode = 1;
    } finally {
      await dropTemporaryDatabase(db, name);
      console.log(`Temporary database ${name} dropped. Your active database was not touched.`);
    }
  } else {
    throw new Error("Usage: backup.ts create | verify <file> | restore-test <file>");
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
