import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

/** Stable hash of a request payload, so a reused idempotency key with different data is rejected. */
export function requestHash(payload: unknown): string {
  const stable = (v: unknown): unknown =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]))
      : Array.isArray(v) ? v.map(stable) : v;
  return createHash("sha256").update(JSON.stringify(stable(payload))).digest("hex");
}

export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{16,80}$/;

export function isUniqueViolation(e: unknown, field?: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  if (!field) return true;
  const target = (e.meta?.target ?? "") as string | string[];
  return (Array.isArray(target) ? target.join(",") : String(target)).includes(field);
}

/** Errors raised by the hand-written ledger triggers. */
export function isLedgerViolation(e: unknown): boolean {
  return String((e as Error)?.message ?? "").includes("LEVELUP_LEDGER");
}
