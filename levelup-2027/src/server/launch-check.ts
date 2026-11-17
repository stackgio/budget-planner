/**
 * Production launch check. Runs only on an EMPTY installation (before the owner account exists) and only
 * with the SETUP_TOKEN. Reports pass/fail per item — never secret values, never addresses.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "./db";
import { keyFormatStatus } from "./crypto";
import { backupConfig, backupNow, testRestore } from "./backup-service";
import { backupStoreFromEnv } from "./backup-store";
import { vapidPublicKey } from "./push";

export interface CheckItem { id: string; label: string; ok: boolean; detail: string }

const PRIVATE_IP = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i;

export function isPublicIp(ip: string) {
  return /^[0-9a-fA-F:.]{3,45}$/.test(ip) && !PRIVATE_IP.test(ip);
}

export async function launchCheck(ctx: { requestHost: string | null; forwardedProto: string | null; clientIp: string }, opts: { runBackup: boolean }) {
  const items: CheckItem[] = [];
  const add = (id: string, label: string, ok: boolean, detail: string) => items.push({ id, label, ok, detail });
  const origin = process.env.APP_ORIGIN ?? "";

  // HTTPS & address
  const originHost = (() => { try { return new URL(origin).host; } catch { return ""; } })();
  add("https", "HTTPS on the Railway address", origin.startsWith("https://") && ctx.forwardedProto === "https", origin.startsWith("https://") ? (ctx.forwardedProto === "https" ? "Served over HTTPS" : "APP_ORIGIN is https but this request wasn't") : "APP_ORIGIN must start with https://");
  add("origin", "APP_ORIGIN matches this address", !!originHost && originHost === ctx.requestHost, originHost === ctx.requestHost ? "Matches" : "APP_ORIGIN doesn't match the address you opened");
  add("rpid", "Face ID passkeys bound to this address", !!originHost && (process.env.WEBAUTHN_RP_ID ?? originHost) === originHost.split(":")[0], "WEBAUTHN_RP_ID must equal the address without https://");

  // Database & migrations
  let serverMajor = 0;
  try {
    const v = await prisma.$queryRaw<{ v: string }[]>`SELECT current_setting('server_version_num') AS v`;
    serverMajor = Math.floor(Number(v[0]!.v) / 10000);
    const applied = await prisma.$queryRaw<{ n: bigint; last: string | null }[]>`SELECT count(*) AS n, max(migration_name) AS last FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const files = readdirSync(path.join(process.cwd(), "prisma/migrations")).filter((f) => /^\d{14}_/.test(f)).sort();
    const ok = Number(applied[0]!.n) === files.length && applied[0]!.last === files[files.length - 1];
    add("database", "PostgreSQL connected", true, `PostgreSQL ${serverMajor}`);
    add("migrations", "All database migrations applied", ok, `${applied[0]!.n} of ${files.length} applied`);
  } catch {
    add("database", "PostgreSQL connected", false, "Can't reach the database — check DATABASE_URL");
  }
  add("empty", "Database is a fresh production database", (await prisma.user.count().catch(() => 1)) === 0, "No accounts or test data");

  // Worker
  const run = await prisma.schedulerRun.findFirst({ orderBy: { startedAt: "desc" } }).catch(() => null);
  const mins = run ? (Date.now() - run.startedAt.getTime()) / 60_000 : null;
  add("worker", "Background worker running", mins !== null && mins <= 3, mins === null ? "Hasn't run yet — wait a minute and check again" : `Last ran ${Math.round(mins)} min ago`);

  // Secrets (presence/format only)
  const key = keyFormatStatus();
  add("key", "Encryption key set", key === "OK", key === "OK" ? "Valid format (value never shown)" : key === "MISSING" ? "DATA_ENCRYPTION_KEY is missing" : "DATA_ENCRYPTION_KEY has the wrong format");
  const cfg = backupConfig();
  add("passphrase", "Backup passphrase set", cfg.passphraseSet, cfg.passphraseSet ? "Set (value never shown)" : "BACKUP_PASSPHRASE is missing or too short");

  // Backup storage & tools
  try {
    const store = backupStoreFromEnv();
    await store.list();
    add("storage", "Private backup bucket reachable", store.kind === "s3", store.kind === "s3" ? "Connected" : "Using the server's disk — set the BACKUP_S3_* variables");
  } catch {
    add("storage", "Private backup bucket reachable", false, "Can't reach the bucket — check the BACKUP_S3_* variables");
  }
  const pgDump = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  const dumpMajor = Number(/(\d+)\.\d+/.exec(pgDump.stdout ?? "")?.[1] ?? 0);
  add("pgdump", "Backup tools match the database", dumpMajor > 0 && dumpMajor >= serverMajor, dumpMajor ? `pg_dump ${dumpMajor}, database ${serverMajor || "?"}${dumpMajor < serverMajor ? " — set the PG_MAJOR variable to " + serverMajor + " and redeploy" : ""}` : "pg_dump not installed");

  // Auth & push
  add("cookies", "Secure sign-in cookies", origin.startsWith("https://"), "Secure, HttpOnly, __Host- prefix over HTTPS");
  add("setup", "Setup token set", !!process.env.SETUP_TOKEN && process.env.SETUP_TOKEN.length >= 16, "Required to create the owner account");
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0);
  add("ratelimit", "Login protection sees your real connection", hops >= 1 && isPublicIp(ctx.clientIp), hops < 1 ? "Set TRUSTED_PROXY_HOPS=1" : isPublicIp(ctx.clientIp) ? "Per-device limits work" : "Seeing a proxy address — tell Claude so the setting can be adjusted");
  add("push", "Push notification keys", !!vapidPublicKey() && !!process.env.VAPID_PRIVATE_KEY, vapidPublicKey() ? "Configured" : "VAPID keys missing");

  if (opts.runBackup && items.every((i) => i.ok || ["push"].includes(i.id))) {
    try {
      const b = await backupNow("MANUAL");
      add("backup", "Test backup saved to the bucket and verified", true, `${Math.max(1, Math.round((b.bytes ?? 0) / 1024))} KB, ${b.tables} tables`);
      const t = await testRestore();
      add("restore", "Test restore into a temporary copy", t.ok, t.ok ? "Restored, checked and deleted — live data untouched" : "Restore check failed");
    } catch (e) {
      add("backup", "Test backup saved to the bucket and verified", false, e instanceof Error ? e.message.slice(0, 160) : "Backup failed");
    }
  }
  return { ok: items.every((i) => i.ok), items };
}
