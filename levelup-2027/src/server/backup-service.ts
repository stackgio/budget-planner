/**
 * Automatic encrypted backups, run by the worker every day and on demand from Settings → Backups.
 * Never logs or stores the passphrase or the encryption key. Never overwrites or resets a database.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { applyRetentionTo, createBackup, decryptBackup, dropTemporaryDatabase, readPassphrase, restoreToNewDatabase, verifyBackup } from "./backup";
import { type BackupStore, backupStoreFromEnv } from "./backup-store";
import { reconcile } from "./ledger";
import { PRIVATE_UNAVAILABLE, readPrivate, verifyKey } from "./crypto";
import { localToDbDate, todayLocal, zonedToInstant } from "@/domain/dates";

const TZ = "America/New_York";
export const DAILY_BACKUP_TIME = "03:30";
const COUNTED = ["user", "incomeDeposit", "payment", "allocationLine", "challengeTile", "goal", "task", "faithEntry", "gigSession", "gigPayout", "notificationPreference"] as const;

async function rowCounts(db: PrismaClient): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of COUNTED) out[t] = await (db[t] as unknown as { count: () => Promise<number> }).count();
  return out;
}

export function backupConfig(env: Record<string, string | undefined> = process.env) {
  const pass = env.BACKUP_PASSPHRASE ?? "";
  const store = backupStoreFromEnv(env);
  return {
    passphraseSet: (pass.length >= 16 && !pass.includes("${{")) || !!env.BACKUP_PASSPHRASE_FILE,
    store: store.kind, storeLabel: store.label, offsite: store.kind === "s3",
    keepDaily: Number(env.BACKUP_KEEP_DAILY ?? 14), keepWeekly: Number(env.BACKUP_KEEP_WEEKLY ?? 8),
  };
}

export async function backupNow(kind: "SCHEDULED" | "MANUAL", opts: { now?: Date; store?: BackupStore; databaseUrl?: string } = {}) {
  const now = opts.now ?? new Date();
  const store = opts.store ?? backupStoreFromEnv();
  const run = await prisma.backupRun.create({ data: { kind, localDate: localToDbDate(todayLocal(TZ, now)), status: "RUNNING" } });
  const dir = await mkdtemp(path.join(tmpdir(), "levelup-backup-"));
  try {
    const passphrase = await readPassphrase();
    const counts = await rowCounts(prisma);
    const b = await createBackup({ databaseUrl: opts.databaseUrl ?? process.env.DATABASE_URL!, dir, passphrase, now });
    const v = await verifyBackup(b.file, passphrase);
    const key = path.basename(b.file);
    await store.put(key, await readFile(b.file));
    // Read it back from storage and verify again, so a broken upload is caught today, not on recovery day.
    const roundTrip = path.join(dir, "check.lubk");
    await writeFile(roundTrip, await store.get(key));
    await verifyBackup(roundTrip, passphrase);
    const cfg = backupConfig();
    const pruned = await applyRetentionTo(store, cfg.keepDaily, cfg.keepWeekly);
    return await prisma.backupRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", objectKey: key, bytes: b.bytes, tables: v.tables, latestMigration: v.latestMigration, counts, finishedAt: new Date(), error: pruned.length ? `retention removed ${pruned.length}` : null },
    });
  } catch (e) {
    await prisma.backupRun.update({ where: { id: run.id }, data: { status: "FAILED", error: (e instanceof Error ? e.message : "failed").slice(0, 300), finishedAt: new Date() } });
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Called by the worker every minute. Runs the day's backup once after 03:30 New York time.
 * A transaction-scoped advisory lock plus a partial unique index keep it to one per day across workers.
 */
export async function runScheduledBackup(now = new Date(), store?: BackupStore): Promise<"done" | "not-due" | "already-done" | "not-configured" | "busy"> {
  if (!backupConfig().passphraseSet) return "not-configured";
  const today = todayLocal(TZ, now);
  if (now < zonedToInstant(today, DAILY_BACKUP_TIME, TZ)) return "not-due";
  const done = await prisma.backupRun.findFirst({ where: { kind: "SCHEDULED", status: "SUCCEEDED", localDate: localToDbDate(today) } });
  if (done) return "already-done";
  // Don't retry a failing backup every minute: at most once per hour.
  const recentFail = await prisma.backupRun.findFirst({ where: { kind: "SCHEDULED", status: { in: ["FAILED", "RUNNING"] }, startedAt: { gt: new Date(now.getTime() - 3_600_000) } } });
  if (recentFail) return "busy";
  // Transaction-scoped lock (held on one pooled connection for the whole run), then re-check inside it.
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ ok: boolean }[]>`SELECT pg_try_advisory_xact_lock(20270517) AS ok`;
    if (!locked[0]?.ok) return "busy" as const;
    if (await tx.backupRun.findFirst({ where: { kind: "SCHEDULED", status: "SUCCEEDED", localDate: localToDbDate(today) } })) return "already-done" as const;
    await backupNow("SCHEDULED", { now, store });
    return "done" as const;
  }, { timeout: 15 * 60_000, maxWait: 10_000 });
}

export async function backupStatus(store: BackupStore = backupStoreFromEnv()) {
  const cfg = backupConfig();
  const [lastOk, lastFail, lastDownload, lastTest] = await Promise.all([
    prisma.backupRun.findFirst({ where: { kind: { in: ["SCHEDULED", "MANUAL"] }, status: "SUCCEEDED" }, orderBy: { startedAt: "desc" } }),
    prisma.backupRun.findFirst({ where: { kind: { in: ["SCHEDULED", "MANUAL"] }, status: "FAILED" }, orderBy: { startedAt: "desc" } }),
    prisma.backupRun.findFirst({ where: { kind: "DOWNLOAD", status: "SUCCEEDED" }, orderBy: { startedAt: "desc" } }),
    prisma.backupRun.findFirst({ where: { kind: "RESTORE_TEST" }, orderBy: { startedAt: "desc" } }),
  ]);
  let files: Awaited<ReturnType<BackupStore["list"]>> = [];
  let storeError: string | null = null;
  try { files = await store.list(); } catch (e) { storeError = e instanceof Error ? e.message : "Storage unavailable"; }
  return { cfg, lastOk, lastFail: lastFail && (!lastOk || lastFail.startedAt > lastOk.startedAt) ? lastFail : null, lastDownload, lastTest, files, storeError };
}

export async function downloadBackup(key: string, store: BackupStore = backupStoreFromEnv()) {
  const data = await store.get(key);
  await prisma.backupRun.create({ data: { kind: "DOWNLOAD", localDate: localToDbDate(todayLocal(TZ)), status: "SUCCEEDED", objectKey: key, bytes: data.length, finishedAt: new Date() } });
  return data;
}

/**
 * Restore the newest backup into a NEW temporary database on the same server, check it, then drop it.
 * Proves the backup can actually be restored. Your live database is not touched.
 */
export async function testRestore(opts: { store?: BackupStore; adminUrl?: string; key?: string } = {}) {
  const store = opts.store ?? backupStoreFromEnv();
  const adminUrl = opts.adminUrl ?? process.env.DATABASE_URL!;
  const run = await prisma.backupRun.create({ data: { kind: "RESTORE_TEST", localDate: localToDbDate(todayLocal(TZ)), status: "RUNNING" } });
  const dbName = `levelup_restore_test_${Date.now().toString(36)}`;
  const dir = await mkdtemp(path.join(tmpdir(), "levelup-rt-"));
  let restored: PrismaClient | null = null;
  try {
    const passphrase = await readPassphrase();
    const key = opts.key ?? (await store.list())[0]?.key;
    if (!key) throw new Error("There is no backup to test yet.");
    const file = path.join(dir, "restore-test.lubk");
    await writeFile(file, await store.get(key));
    const source = await prisma.backupRun.findFirst({ where: { objectKey: key, status: "SUCCEEDED", kind: { in: ["SCHEDULED", "MANUAL"] } } });
    const url = await restoreToNewDatabase({ file, passphrase, adminUrl, dbName });
    restored = new PrismaClient({ datasources: { db: { url } } });
    const counts = await rowCounts(restored);
    const owners = await restored.user.findMany({ select: { id: true } });
    const issues = (await Promise.all(owners.map((o) => reconcile(o.id, restored!)))).flat().map((i) => i.code);
    const keyStatus = await verifyKey(restored);
    const sample = await restored.faithEntry.findFirst({ where: { bodyCipher: { not: null } } });
    const notesReadable = sample ? readPrivate(sample.bodyCipher) !== PRIVATE_UNAVAILABLE : null;
    const expected = (source?.counts ?? null) as Record<string, number> | null;
    const countsMatch = expected ? COUNTED.every((t) => expected[t] === counts[t]) : null;
    const ok = issues.length === 0 && keyStatus === "OK" && notesReadable !== false && countsMatch !== false;
    const summary = { key, counts, countsMatch, ledgerIssues: issues, keyStatus, notesReadable };
    await prisma.backupRun.update({ where: { id: run.id }, data: { status: ok ? "SUCCEEDED" : "FAILED", objectKey: key, counts: summary as object, error: ok ? null : "Restore test found a problem — see details.", finishedAt: new Date() } });
    return { ok, ...summary };
  } catch (e) {
    await prisma.backupRun.update({ where: { id: run.id }, data: { status: "FAILED", error: (e instanceof Error ? e.message : "failed").slice(0, 300), finishedAt: new Date() } });
    throw e;
  } finally {
    await restored?.$disconnect();
    await dropTemporaryDatabase(adminUrl, dbName).catch(() => {});
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Disaster recovery from the iPhone: the app is running on a NEW, EMPTY database (no owner yet).
 * Restore a backup (uploaded from Files/iCloud Drive, or the newest in storage) into a NEW database
 * `levelup_restore_YYYYMMDD…` on the same server. You then set LEVELUP_DATABASE_NAME to that name in
 * Railway and redeploy. Nothing existing is overwritten.
 */
export async function disasterRestore(opts: { passphrase: string; upload?: Buffer | null; store?: BackupStore; adminUrl?: string; now?: Date }) {
  if ((await prisma.user.count()) > 0) throw new Error("This database already has an owner. Disaster restore is only available on a new, empty installation.");
  const now = opts.now ?? new Date();
  const store = opts.store ?? backupStoreFromEnv();
  const data = opts.upload ?? (await (async () => { const k = (await store.list())[0]?.key; if (!k) throw new Error("No backups found in storage. Upload your backup file instead."); return store.get(k); })());
  await decryptBackup(data, opts.passphrase); // wrong passphrase / damaged file stops here
  const dir = await mkdtemp(path.join(tmpdir(), "levelup-dr-"));
  try {
    const file = path.join(dir, "upload.lubk");
    await writeFile(file, data, { mode: 0o600 });
    const dbName = `levelup_restore_${now.toISOString().slice(0, 10).replace(/-/g, "")}_${now.getTime().toString(36).slice(-4)}`;
    const url = await restoreToNewDatabase({ file, passphrase: opts.passphrase, adminUrl: opts.adminUrl ?? process.env.DATABASE_URL!, dbName });
    const restored = new PrismaClient({ datasources: { db: { url } } });
    try {
      const owners = await restored.user.count();
      const issues = (await Promise.all((await restored.user.findMany({ select: { id: true } })).map((o) => reconcile(o.id, restored)))).flat();
      return { dbName, owners, ledgerIssues: issues.map((i) => i.code), keyStatus: await verifyKey(restored) };
    } finally {
      await restored.$disconnect();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
