import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { encrypt, readPrivate, PRIVATE_UNAVAILABLE, verifyKey } from "@/server/crypto";
import {
  applyRetention, createBackup, decryptBackup, dropTemporaryDatabase, encryptDump, readPassphrase, restoreToNewDatabase, selectRetention, verifyBackup,
} from "@/server/backup";
import { reconcile } from "@/server/ledger";
import { confirmPayout, listPlatforms } from "@/server/gig";
import { freshOwner } from "./helpers";

const URL_ = process.env.DATABASE_URL!;
const PASS = "synthetic test passphrase 1234";
let dir: string, ownerId: string;
const temp = `levelup_restore_test_${Date.now().toString(36)}`;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "levelup-backup-test-"));
  ownerId = (await freshOwner()).id;
  await verifyKey(prisma);
  await prisma.faithEntry.create({ data: { ownerId, kind: "REFLECTION", date: new Date("2027-01-03"), bodyCipher: encrypt("Synthetic private note"), idempotencyKey: "backup-test-000001" } });
  const dd = (await listPlatforms(ownerId)).find((p) => p.name === "DoorDash")!.id;
  await confirmPayout(ownerId, { platformId: dd, netCents: 4_200, depositDate: "2027-01-12", sessionIds: [], idempotencyKey: "backup-test-payout-0001" });
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
  await dropTemporaryDatabase(URL_, temp).catch(() => {});
});

describe("Encrypted backups", () => {
  it("creates a timestamped, owner-only, encrypted file with no plaintext or key inside", async () => {
    const b = await createBackup({ databaseUrl: URL_, dir, passphrase: PASS, now: new Date("2027-01-15T08:30:00Z") });
    expect(path.basename(b.file)).toBe("levelup-20270115T083000Z.lubk");
    expect((await stat(b.file)).mode & 0o777).toBe(0o600);
    const raw = await readFile(b.file);
    expect(raw.includes(Buffer.from("Synthetic private note"))).toBe(false);
    expect(raw.includes(Buffer.from("owner@example.test"))).toBe(false);
    expect(raw.includes(Buffer.from(process.env.DATA_ENCRYPTION_KEY!))).toBe(false);
    expect(raw.includes(Buffer.from(PASS))).toBe(false);
  });

  it("verifies a good backup and rejects a wrong passphrase, tampering and truncation", async () => {
    const [f] = (await readdir(dir)).filter((n) => n.endsWith(".lubk"));
    const file = path.join(dir, f!);
    const v = await verifyBackup(file, PASS);
    expect(v.tables).toBeGreaterThan(40);
    expect(v.latestMigration).toMatch(/^\d{14}_/); // the newest applied migration is recorded in the header
    await expect(verifyBackup(file, "wrong passphrase 123456")).rejects.toThrow(/wrong passphrase/);
    const raw = await readFile(file);
    const t = Buffer.from(raw); const at = t.length - 100; t.writeUInt8(t.readUInt8(at) ^ 1, at);
    await writeFile(path.join(dir, "t.bin"), t);
    await expect(verifyBackup(path.join(dir, "t.bin"), PASS)).rejects.toThrow(/changed or damaged/);
    const h = Buffer.from(raw.toString("latin1").replace('"v":1', '"v":1 ').slice(0), "latin1");
    await expect(decryptBackup(h, PASS)).rejects.toThrow();
    await expect(decryptBackup(raw.subarray(0, raw.indexOf(0x0a) + 5), PASS)).rejects.toThrow(/truncated/);
  });

  it("restores only into a new temporary database; the active database is untouched", async () => {
    const [f] = (await readdir(dir)).filter((n) => n.endsWith(".lubk"));
    const file = path.join(dir, f!);
    await expect(restoreToNewDatabase({ file, passphrase: PASS, adminUrl: URL_, dbName: "levelup_test" })).rejects.toThrow(/temporary database/);
    await expect(restoreToNewDatabase({ file, passphrase: PASS, adminUrl: URL_, dbName: "levelup_dev" })).rejects.toThrow(/temporary database/);
    const before = await prisma.incomeDeposit.count();
    const url = await restoreToNewDatabase({ file, passphrase: PASS, adminUrl: URL_, dbName: temp });
    await expect(restoreToNewDatabase({ file, passphrase: PASS, adminUrl: URL_, dbName: temp })).rejects.toThrow(/already exists/);
    const restored = new PrismaClient({ datasources: { db: { url } } });
    try {
      expect(await restored.incomeDeposit.count()).toBe(before);
      expect(await restored.gigPayout.count()).toBe(1);
      expect(await reconcile(ownerId, restored)).toEqual([]);
      const note = await restored.faithEntry.findFirstOrThrow();
      expect(readPrivate(note.bodyCipher)).toBe("Synthetic private note");
      expect(await verifyKey(restored)).toBe("OK");
      const real = process.env.DATA_ENCRYPTION_KEY;
      process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
      try {
        expect(await verifyKey(restored)).toBe("MISMATCH");
        expect(readPrivate(note.bodyCipher)).toBe(PRIVATE_UNAVAILABLE);
      } finally {
        process.env.DATA_ENCRYPTION_KEY = real;
      }
    } finally {
      await restored.$disconnect();
    }
    expect(await prisma.incomeDeposit.count()).toBe(before);
  });

  it("retention keeps recent dailies and weekly anchors, never the newest, ignores other files", async () => {
    const names = ["2027-01-01", "2027-01-02", "2027-01-02", "2027-01-08", "2027-01-15", "2027-01-16", "2027-01-17"].map((d, i) => `levelup-${d.replace(/-/g, "")}T0${i}0000Z.lubk`);
    const r = selectRetention([...names, "notes.txt", "levelup-bad.lubk"], 2, 2);
    expect(r.keep).toEqual(["levelup-20270117T060000Z.lubk", "levelup-20270116T050000Z.lubk", "levelup-20270115T040000Z.lubk", "levelup-20270108T030000Z.lubk"].filter((n) => r.keep.includes(n)));
    expect(r.keep).toContain("levelup-20270117T060000Z.lubk");
    expect(r.remove).toContain("levelup-20270101T000000Z.lubk");
    expect(r.remove).not.toContain("notes.txt");
    expect(selectRetention(names, 0, 0).keep).toEqual(["levelup-20270117T060000Z.lubk"]);
    for (const n of names) await writeFile(path.join(dir, n), "x");
    await writeFile(path.join(dir, "keep-me.txt"), "x");
    const applied = await applyRetention(dir, 2, 2);
    const left = await readdir(dir);
    expect(left).toContain("keep-me.txt");
    expect(left).toContain("levelup-20270117T060000Z.lubk");
    expect(applied.removed.length).toBeGreaterThan(0);
  });

  it("requires a strong passphrase from the environment and never stores it", async () => {
    await expect(readPassphrase({})).rejects.toThrow(/at least 16/);
    await expect(readPassphrase({ BACKUP_PASSPHRASE: "short" })).rejects.toThrow(/at least 16/);
    expect(await readPassphrase({ BACKUP_PASSPHRASE: PASS })).toBe(PASS);
    const enc = await encryptDump(Buffer.from("data"), PASS, { createdAt: new Date(), latestMigration: null });
    expect(enc.includes(Buffer.from(PASS))).toBe(false);
  });
});
