import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { encrypt, verifyKey, keyFromSecret } from "@/server/crypto";
import { LocalStore, S3Store, backupStoreFromEnv } from "@/server/backup-store";
import { backupConfig, backupNow, backupStatus, disasterRestore, downloadBackup, runScheduledBackup, testRestore } from "@/server/backup-service";
import { dropTemporaryDatabase } from "@/server/backup";
import { zonedToInstant } from "@/domain/dates";
import { freshOwner, resetDb } from "./helpers";

const PASS = "synthetic backup passphrase for tests";
let dir: string, store: LocalStore;
const created: string[] = [];

beforeAll(async () => { process.env.BACKUP_PASSPHRASE = PASS; });
afterAll(async () => {
  delete process.env.BACKUP_PASSPHRASE;
  for (const d of created) await dropTemporaryDatabase(process.env.DATABASE_URL!, d).catch(() => {});
});
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "lu-bs-"));
  store = new LocalStore(dir);
  const o = await freshOwner();
  await verifyKey(prisma);
  await prisma.faithEntry.create({ data: { ownerId: o.id, kind: "REFLECTION", date: new Date("2027-01-03"), bodyCipher: encrypt("Synthetic note"), idempotencyKey: `bs-${Date.now()}` } });
});

describe("automatic daily backups", () => {
  it("runs once per day after 03:30 New York time, and records the result", async () => {
    expect(await runScheduledBackup(zonedToInstant("2027-03-10", "03:00", "America/New_York"), store)).toBe("not-due");
    expect(await runScheduledBackup(zonedToInstant("2027-03-10", "03:31", "America/New_York"), store)).toBe("done");
    expect(await runScheduledBackup(zonedToInstant("2027-03-10", "09:00", "America/New_York"), store)).toBe("already-done");
    expect((await store.list())).toHaveLength(1);
    const run = await prisma.backupRun.findFirstOrThrow({ where: { kind: "SCHEDULED" } });
    expect(run.status).toBe("SUCCEEDED");
    expect((run.counts as Record<string, number>).faithEntry).toBe(1);
    await rm(dir, { recursive: true, force: true });
  });

  it("two workers at the same moment produce a single backup", async () => {
    const t = zonedToInstant("2027-03-11", "04:00", "America/New_York");
    const r = await Promise.all([runScheduledBackup(t, store), runScheduledBackup(t, store), runScheduledBackup(t, store)]);
    expect(r.filter((x) => x === "done")).toHaveLength(1);
    expect(await prisma.backupRun.count({ where: { kind: "SCHEDULED", status: "SUCCEEDED" } })).toBe(1);
  });

  it("is off (not an error) when no passphrase is configured", async () => {
    delete process.env.BACKUP_PASSPHRASE;
    try {
      expect(backupConfig().passphraseSet).toBe(false);
      expect(await runScheduledBackup(new Date(), store)).toBe("not-configured");
    } finally { process.env.BACKUP_PASSPHRASE = PASS; }
    expect(backupConfig({ BACKUP_PASSPHRASE: "${{secret(48)}}" }).passphraseSet).toBe(false);
  });

  it("a failure is recorded with a reason and doesn't leave a partial file", async () => {
    await expect(backupNow("MANUAL", { store, databaseUrl: "postgresql://levelup:wrong@localhost:5432/levelup_test" })).rejects.toThrow();
    const f = await prisma.backupRun.findFirstOrThrow({ where: { status: "FAILED" } });
    expect(f.error).toBeTruthy();
    expect(await store.list()).toHaveLength(0);
    expect((await backupStatus(store)).lastFail?.id).toBe(f.id);
  });
});

describe("iPhone recovery tools", () => {
  it("test restore proves the newest backup restores with matching counts, reconciled ledger and readable notes", async () => {
    await backupNow("MANUAL", { store });
    const t = await testRestore({ store });
    expect(t).toMatchObject({ ok: true, countsMatch: true, ledgerIssues: [], keyStatus: "OK", notesReadable: true });
    const dbs = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM pg_database WHERE datname LIKE 'levelup_restore_test_%'`;
    expect(Number(dbs[0]!.n)).toBe(0); // temporary copy removed
  });

  it("downloads are recorded so the app can remind you to save a copy weekly", async () => {
    const b = await backupNow("MANUAL", { store });
    const data = await downloadBackup(b.objectKey!, store);
    expect(data.subarray(0, 40).toString()).toContain("levelup-backup");
    expect((await backupStatus(store)).lastDownload?.objectKey).toBe(b.objectKey);
    await expect(downloadBackup("../../etc/passwd", store)).rejects.toThrow(/Invalid backup name/);
  });

  it("disaster restore: only on an empty installation, wrong passphrase refused, restores into a NEW database", async () => {
    const b = await backupNow("MANUAL", { store });
    await expect(disasterRestore({ passphrase: PASS, store })).rejects.toThrow(/already has an owner/);
    const file = await store.get(b.objectKey!);
    await resetDb(); // simulate the original database being lost: the app now runs on an empty one
    await expect(disasterRestore({ passphrase: "wrong passphrase 12345", upload: file, store })).rejects.toThrow(/wrong passphrase/);
    const r = await disasterRestore({ passphrase: PASS, upload: file, store });
    created.push(r.dbName);
    expect(r.dbName).toMatch(/^levelup_restore_\d{8}_/);
    expect(r).toMatchObject({ owners: 1, ledgerIssues: [], keyStatus: "OK" });
    const u = new URL(process.env.DATABASE_URL!); u.pathname = `/${r.dbName}`;
    const restored = new PrismaClient({ datasources: { db: { url: u.toString() } } });
    try { expect(await restored.faithEntry.count()).toBe(1); } finally { await restored.$disconnect(); }
    expect(await prisma.user.count()).toBe(0); // the current database was not modified
  });
});

describe("off-site storage (S3-compatible) against a local mock bucket", () => {
  let server: Server; let url = ""; const objects = new Map<string, Buffer>(); const auth: string[] = [];
  beforeAll(async () => {
    server = createServer((req, res) => {
      auth.push(String(req.headers.authorization ?? ""));
      const u = new URL(req.url!, "http://x");
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        if (req.method === "PUT") { objects.set(u.pathname, Buffer.concat(chunks)); res.end(); return; }
        if (req.method === "DELETE") { objects.delete(u.pathname); res.statusCode = 204; res.end(); return; }
        if (u.searchParams.get("list-type") === "2") {
          const prefix = u.searchParams.get("prefix")!;
          const items = [...objects.entries()].filter(([k]) => decodeURIComponent(k).startsWith(`/bkt/${prefix}`));
          res.end(`<ListBucketResult>${items.map(([k, v]) => `<Contents><Key>${decodeURIComponent(k).slice(5)}</Key><Size>${v.length}</Size><LastModified>2027-01-01T00:00:00Z</LastModified></Contents>`).join("")}</ListBucketResult>`);
          return;
        }
        const o = objects.get(u.pathname);
        if (!o) { res.statusCode = 404; res.end(); return; }
        res.end(o);
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("uploads, verifies by reading back, lists, applies retention and signs every request", async () => {
    const s3 = new S3Store({ endpoint: url, bucket: "bkt", accessKeyId: "AKIDTEST", secretAccessKey: "secret", region: "auto" });
    const b = await backupNow("MANUAL", { store: s3 });
    const list = await s3.list();
    expect(list.map((x) => x.key)).toEqual([b.objectKey]);
    expect(auth.every((a) => a.startsWith("AWS4-HMAC-SHA256 Credential=AKIDTEST/"))).toBe(true);
    expect([...objects.values()][0]!.includes(Buffer.from("Synthetic note"))).toBe(false); // only ciphertext leaves the server
  });

  it("is selected from environment variables; otherwise a local folder is used", () => {
    expect(backupStoreFromEnv({ BACKUP_S3_ENDPOINT: "https://e", BACKUP_S3_BUCKET: "b", BACKUP_S3_ACCESS_KEY_ID: "a", BACKUP_S3_SECRET_ACCESS_KEY: "s" }).kind).toBe("s3");
    expect(backupStoreFromEnv({}).kind).toBe("local");
  });
});

describe("encryption key formats", () => {
  it("accepts the existing base64 key unchanged and a long random string from Railway; rejects templates and short values", () => {
    const b64 = Buffer.alloc(32, 7).toString("base64");
    expect(keyFromSecret(b64)).toEqual(Buffer.alloc(32, 7));
    const rail = "a8Kq2LmZ7xR4pV9sT1nB6cW3yH5dJ0fG8eU2iO4kM7qN1rS3t"; // 49 random-looking chars
    expect(keyFromSecret(rail)!.length).toBe(32);
    expect(keyFromSecret(rail)).toEqual(keyFromSecret(rail));
    expect(keyFromSecret("${{secret(64)}}")).toBeNull();
    expect(keyFromSecret("short-but-not-base64")).toBeNull();
  });
});
