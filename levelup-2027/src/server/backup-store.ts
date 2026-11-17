/**
 * Where encrypted backup files are kept.
 * - S3Store: any S3-compatible bucket (a Railway Bucket in production, or Cloudflare R2 / Backblaze B2).
 *   The bucket is separate from the database volume, so losing the database doesn't lose the backups.
 * - LocalStore: a folder (development, tests).
 * Files are already encrypted before they reach either store.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { BACKUP_NAME_RE } from "./backup";

export interface StoredBackup { key: string; bytes: number; modifiedAt: Date }
export interface BackupStore {
  readonly kind: "s3" | "local";
  readonly label: string;
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  list(): Promise<StoredBackup[]>;
  remove(key: string): Promise<void>;
}

const safeKey = (key: string) => {
  if (!BACKUP_NAME_RE.test(key)) throw new Error("Invalid backup name.");
  return key;
};

export class LocalStore implements BackupStore {
  readonly kind = "local" as const;
  constructor(private dir: string, readonly label = "This server's disk (development)") {}
  async put(key: string, data: Buffer) {
    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    await writeFile(path.join(this.dir, safeKey(key)), data, { mode: 0o600 });
  }
  async get(key: string) { return readFile(path.join(this.dir, safeKey(key))); }
  async list() {
    const names = (await readdir(this.dir).catch(() => [] as string[])).filter((n) => BACKUP_NAME_RE.test(n));
    const out: StoredBackup[] = [];
    for (const n of names) { const s = await stat(path.join(this.dir, n)); out.push({ key: n, bytes: s.size, modifiedAt: s.mtime }); }
    return out.sort((a, b) => (a.key < b.key ? 1 : -1));
  }
  async remove(key: string) { await rm(path.join(this.dir, safeKey(key)), { force: true }); }
}

export class S3Store implements BackupStore {
  readonly kind = "s3" as const;
  readonly label: string;
  private client: AwsClient;
  constructor(private cfg: { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; region: string; prefix?: string }) {
    this.client = new AwsClient({ accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey, region: cfg.region || "auto", service: "s3" });
    this.label = "Private storage bucket (separate from the database)";
  }
  private url(key = "", query = "") {
    const base = this.cfg.endpoint.replace(/\/$/, "");
    return `${base}/${encodeURIComponent(this.cfg.bucket)}/${key ? `${this.cfg.prefix ?? "levelup-backups/"}${encodeURIComponent(key)}` : ""}${query}`;
  }
  private async call(url: string, init: RequestInit = {}) {
    const r = await this.client.fetch(url, init);
    if (!r.ok) throw new Error(`Backup storage request failed (${r.status}).`);
    return r;
  }
  async put(key: string, data: Buffer) {
    await this.call(this.url(safeKey(key)), { method: "PUT", body: new Uint8Array(data), headers: { "content-type": "application/octet-stream" } });
  }
  async get(key: string) { return Buffer.from(await (await this.call(this.url(safeKey(key)))).arrayBuffer()); }
  async list() {
    const prefix = this.cfg.prefix ?? "levelup-backups/";
    const xml = await (await this.call(this.url("", `?list-type=2&prefix=${encodeURIComponent(prefix)}`))).text();
    const items: StoredBackup[] = [];
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = /<Key>([^<]+)<\/Key>/.exec(m[1]!)?.[1]?.slice(prefix.length) ?? "";
      if (!BACKUP_NAME_RE.test(key)) continue;
      items.push({ key, bytes: Number(/<Size>(\d+)<\/Size>/.exec(m[1]!)?.[1] ?? 0), modifiedAt: new Date(/<LastModified>([^<]+)<\/LastModified>/.exec(m[1]!)?.[1] ?? 0) });
    }
    return items.sort((a, b) => (a.key < b.key ? 1 : -1));
  }
  async remove(key: string) { await this.call(this.url(safeKey(key)), { method: "DELETE" }); }
}

/** S3 settings come from BACKUP_S3_* (in Railway: references to the bucket's own variables). */
export function backupStoreFromEnv(env: Record<string, string | undefined> = process.env): BackupStore {
  const { BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID, BACKUP_S3_SECRET_ACCESS_KEY, BACKUP_S3_REGION } = env;
  if (BACKUP_S3_ENDPOINT && BACKUP_S3_BUCKET && BACKUP_S3_ACCESS_KEY_ID && BACKUP_S3_SECRET_ACCESS_KEY) {
    return new S3Store({ endpoint: BACKUP_S3_ENDPOINT, bucket: BACKUP_S3_BUCKET, accessKeyId: BACKUP_S3_ACCESS_KEY_ID, secretAccessKey: BACKUP_S3_SECRET_ACCESS_KEY, region: BACKUP_S3_REGION ?? "auto" });
  }
  return new LocalStore(path.resolve(/* turbopackIgnore: true */ env.BACKUP_DIR || "backups"));
}
