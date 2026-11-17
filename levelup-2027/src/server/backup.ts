/**
 * Encrypted PostgreSQL backups for LEVEL UP. Local, free, no external service.
 *
 * File format (".lubk"):  one JSON header line, then AES-256-GCM ciphertext of a `pg_dump -Fc` archive,
 * then the 16-byte GCM tag. The key is derived from a backup passphrase with scrypt (random salt per file).
 * The header (non-secret metadata) is authenticated as AAD, so it can't be altered either.
 *
 * - The passphrase comes from BACKUP_PASSPHRASE or BACKUP_PASSPHRASE_FILE and is never logged or stored.
 * - The database password is passed to pg_dump via PGPASSWORD in the child env, never on the command line.
 * - Restores go ONLY into a new, temporary database whose name starts with "levelup_restore_" or
 *   "levelup_drill_". The active database is never overwritten or reset.
 * - Backups do NOT contain DATA_ENCRYPTION_KEY. Private notes inside stay encrypted; keep the key separately.
 */
import { spawn } from "node:child_process";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { chmod, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
const KDF = { N: 1 << 15, r: 8, p: 1 };
export const BACKUP_EXT = ".lubk";
export const BACKUP_NAME_RE = /^levelup-(\d{8}T\d{6}Z)\.lubk$/;
export const TEMP_DB_RE = /^levelup_(restore|drill)_[a-z0-9_]{1,40}$/;

export interface BackupHeader {
  format: "levelup-backup"; v: 1; createdAt: string; kdf: "scrypt"; N: number; r: number; p: number;
  salt: string; iv: string; plainSha256: string; plainBytes: number; latestMigration: string | null; note: string;
}

export function readPassphrase(env: Record<string, string | undefined> = process.env): Promise<string> {
  return (async () => {
    let p = env.BACKUP_PASSPHRASE ?? "";
    if (!p && env.BACKUP_PASSPHRASE_FILE) p = (await readFile(env.BACKUP_PASSPHRASE_FILE, "utf8")).trim();
    if (p.includes("${{")) throw new Error("BACKUP_PASSPHRASE looks like an unexpanded template. Set a real passphrase.");
    if (p.length < 16) throw new Error("Set BACKUP_PASSPHRASE (or BACKUP_PASSPHRASE_FILE) to a passphrase of at least 16 characters. It is never stored by LEVEL UP.");
    return p;
  })();
}

/** libpq env from a postgres URL, so the password never appears in a process list. */
export function pgEnv(databaseUrl: string): NodeJS.ProcessEnv {
  const u = new URL(databaseUrl);
  if (!/^postgres(ql)?:$/.test(u.protocol)) throw new Error("DATABASE_URL must be a postgres URL.");
  return {
    ...process.env, PGHOST: u.hostname, PGPORT: u.port || "5432", PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password), PGDATABASE: decodeURIComponent(u.pathname.slice(1)),
    ...(u.searchParams.get("sslmode") ? { PGSSLMODE: u.searchParams.get("sslmode")! } : {}),
  };
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv, input?: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [], err: Buffer[] = [];
    p.stdout.on("data", (d) => out.push(d));
    p.stderr.on("data", (d) => err.push(d));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(out));
      // stderr from pg tools never contains the password (it is in the env), but trim it anyway.
      reject(new Error(`${cmd} failed (${code}): ${Buffer.concat(err).toString("utf8").split("\n").filter(Boolean).slice(0, 3).join(" | ").slice(0, 300)}`));
    });
    if (input) p.stdin.end(input); else p.stdin.end();
  });
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const deriveKey = (pass: string, salt: Buffer) => scrypt(pass, salt, 32, { ...KDF, maxmem: 64 * 1024 * 1024 });

export async function encryptDump(dump: Buffer, passphrase: string, meta: { createdAt: Date; latestMigration: string | null }): Promise<Buffer> {
  const salt = randomBytes(16), iv = randomBytes(12);
  const header: BackupHeader = {
    format: "levelup-backup", v: 1, createdAt: meta.createdAt.toISOString(), kdf: "scrypt", ...KDF,
    salt: salt.toString("base64"), iv: iv.toString("base64"), plainSha256: createHash("sha256").update(dump).digest("hex"), plainBytes: dump.length,
    latestMigration: meta.latestMigration, note: "Encrypted LEVEL UP database backup. Does not contain DATA_ENCRYPTION_KEY.",
  };
  const headerLine = Buffer.from(JSON.stringify(header) + "\n", "utf8");
  const c = createCipheriv("aes-256-gcm", await deriveKey(passphrase, salt), iv);
  c.setAAD(headerLine);
  const ct = Buffer.concat([c.update(dump), c.final()]);
  return Buffer.concat([headerLine, ct, c.getAuthTag()]);
}

export function parseHeader(file: Buffer): { header: BackupHeader; headerLine: Buffer; body: Buffer } {
  const nl = file.indexOf(0x0a);
  if (nl < 0 || nl > 4096) throw new Error("Not a LEVEL UP backup file.");
  const headerLine = file.subarray(0, nl + 1);
  const header = JSON.parse(headerLine.toString("utf8")) as BackupHeader;
  if (header.format !== "levelup-backup" || header.v !== 1) throw new Error("Unsupported backup format.");
  return { header, headerLine, body: file.subarray(nl + 1) };
}

/** Decrypt and check integrity. Throws on a wrong passphrase or any tampering — never returns partial data. */
export async function decryptBackup(file: Buffer, passphrase: string): Promise<{ header: BackupHeader; dump: Buffer }> {
  const { header, headerLine, body } = parseHeader(file);
  if (body.length < 17) throw new Error("Backup file is truncated.");
  const d = createDecipheriv("aes-256-gcm", await deriveKey(passphrase, Buffer.from(header.salt, "base64")), Buffer.from(header.iv, "base64"));
  d.setAAD(headerLine);
  d.setAuthTag(body.subarray(body.length - 16));
  let dump: Buffer;
  try {
    dump = Buffer.concat([d.update(body.subarray(0, body.length - 16)), d.final()]);
  } catch {
    throw new Error("Backup could not be decrypted: wrong passphrase, or the file was changed or damaged.");
  }
  const sum = Buffer.from(createHash("sha256").update(dump).digest("hex"));
  if (dump.length !== header.plainBytes || !timingSafeEqual(sum, Buffer.from(header.plainSha256))) throw new Error("Backup checksum mismatch.");
  return { header, dump };
}

async function latestMigration(env: NodeJS.ProcessEnv): Promise<string | null> {
  try {
    const out = await run("psql", ["-At", "-c", 'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY migration_name DESC LIMIT 1'], env);
    return out.toString("utf8").trim() || null;
  } catch { return null; }
}

/** Create an encrypted, timestamped backup file (mode 600). Returns its path and size. */
export async function createBackup(o: { databaseUrl: string; dir: string; passphrase: string; now?: Date }) {
  const env = pgEnv(o.databaseUrl);
  const now = o.now ?? new Date();
  const dump = await run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges"], env);
  const enc = await encryptDump(dump, o.passphrase, { createdAt: now, latestMigration: await latestMigration(env) });
  const file = path.join(o.dir, `levelup-${stamp(now)}${BACKUP_EXT}`);
  const tmp = `${file}.partial`;
  await writeFile(tmp, enc, { mode: 0o600 });
  await rename(tmp, file);
  await chmod(file, 0o600);
  return { file, bytes: enc.length, dumpBytes: dump.length };
}

/** Verify: decrypt, checksum, and have pg_restore read the archive's table of contents. */
export async function verifyBackup(file: string, passphrase: string) {
  const { header, dump } = await decryptBackup(await readFile(file), passphrase);
  const dir = await mkdtemp(path.join(tmpdir(), "levelup-verify-"));
  try {
    const p = path.join(dir, "dump");
    await writeFile(p, dump, { mode: 0o600 });
    const toc = (await run("pg_restore", ["--list", p], process.env)).toString("utf8");
    const tables = toc.split("\n").filter((l) => / TABLE DATA public /.test(l)).length;
    if (!tables) throw new Error("Backup contains no table data.");
    return { ok: true as const, createdAt: header.createdAt, latestMigration: header.latestMigration, tables, dumpBytes: dump.length };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Restore into a NEW temporary database. Refuses any name that isn't levelup_restore_* / levelup_drill_*. */
export async function restoreToNewDatabase(o: { file: string; passphrase: string; adminUrl: string; dbName: string }) {
  if (!TEMP_DB_RE.test(o.dbName)) throw new Error("Restores only go into a new temporary database named levelup_restore_* or levelup_drill_*.");
  const { dump } = await decryptBackup(await readFile(o.file), o.passphrase);
  const env = pgEnv(o.adminUrl);
  const exists = (await run("psql", ["-At", "-d", "postgres", "-c", `SELECT 1 FROM pg_database WHERE datname = '${o.dbName}'`], env)).toString().trim();
  if (exists) throw new Error(`Database ${o.dbName} already exists. Restores never overwrite a database.`);
  await run("createdb", [o.dbName], env);
  const dir = await mkdtemp(path.join(tmpdir(), "levelup-restore-"));
  try {
    const p = path.join(dir, "dump");
    await writeFile(p, dump, { mode: 0o600 });
    await run("pg_restore", ["--no-owner", "--no-privileges", "--exit-on-error", "-d", o.dbName, p], env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  const u = new URL(o.adminUrl);
  u.pathname = `/${o.dbName}`;
  return u.toString();
}

export async function dropTemporaryDatabase(adminUrl: string, dbName: string) {
  if (!TEMP_DB_RE.test(dbName)) throw new Error("Only temporary restore/drill databases can be dropped by this tool.");
  await run("dropdb", ["--if-exists", dbName], pgEnv(adminUrl));
}

/**
 * Retention: keep the newest backup of each of the last `keepDaily` days, plus the newest of each of the
 * last `keepWeekly` ISO weeks. Pure — returns which names to keep and which to delete.
 */
export function selectRetention(names: string[], keepDaily: number, keepWeekly: number) {
  const parsed = names.map((n) => ({ n, m: BACKUP_NAME_RE.exec(n) })).filter((x) => x.m).map((x) => ({ n: x.n, t: x.m![1]! })).sort((a, b) => (a.t < b.t ? 1 : -1));
  const keep = new Set<string>();
  const days: string[] = [], weeks: string[] = [];
  for (const b of parsed) {
    const day = b.t.slice(0, 8);
    if (!days.includes(day) && days.length < keepDaily) { days.push(day); keep.add(b.n); }
    const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8)));
    const wd = (d.getUTCDay() + 6) % 7; // Monday-based week key
    const wk = new Date(d.getTime() - wd * 86_400_000).toISOString().slice(0, 10);
    if (!weeks.includes(wk) && weeks.length < keepWeekly) { weeks.push(wk); keep.add(b.n); }
  }
  if (parsed[0]) keep.add(parsed[0].n); // never delete the newest backup
  return { keep: parsed.filter((b) => keep.has(b.n)).map((b) => b.n), remove: parsed.filter((b) => !keep.has(b.n)).map((b) => b.n) };
}

export async function applyRetention(dir: string, keepDaily: number, keepWeekly: number) {
  const names = (await readdir(dir)).filter((n) => BACKUP_NAME_RE.test(n));
  const { keep, remove } = selectRetention(names, keepDaily, keepWeekly);
  for (const n of remove) {
    const s = await stat(path.join(dir, n));
    if (s.isFile()) await rm(path.join(dir, n));
  }
  return { kept: keep.length, removed: remove };
}

/** Retention for any store (bucket or folder). Returns the names removed. */
export async function applyRetentionTo(store: { list(): Promise<{ key: string }[]>; remove(key: string): Promise<void> }, keepDaily: number, keepWeekly: number) {
  const { remove } = selectRetention((await store.list()).map((x) => x.key), keepDaily, keepWeekly);
  for (const n of remove) await store.remove(n);
  return remove;
}
