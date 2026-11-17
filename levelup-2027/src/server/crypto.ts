import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Application-level encryption for private free text (faith reflections, relationship notes,
 * review reflections, job notes). AES-256-GCM with a random 96-bit IV per value.
 * Format: "v1:<iv b64>:<tag b64>:<ciphertext b64>". Fails closed if the key is missing.
 */
function key(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY ?? "";
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 random bytes, base64-encoded (openssl rand -base64 32).");
  return k;
}

export function encrypt(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === "") return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(cipher: string | null | undefined): string | null {
  if (!cipher) return null;
  const [v, iv, tag, ct] = cipher.split(":");
  if (v !== "v1" || !iv || !tag || ct === undefined) throw new Error("Unrecognized encrypted value");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
