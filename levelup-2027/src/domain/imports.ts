/**
 * Duplicate detection and review for any future import (calendar, gig platforms, other sources). Pure.
 * Nothing is ever imported automatically: every candidate is shown for review, and likely duplicates
 * are flagged, never merged silently.
 */
export type ImportKind = "CALENDAR_EVENT" | "GIG_SESSION" | "GIG_PAYOUT";
export interface ImportCandidate { source: string; externalId: string; kind: ImportKind; date: string; amountCents?: number | null; title?: string | null }
export interface ExistingRecord { source?: string | null; externalId?: string | null; kind: ImportKind; date: string; amountCents?: number | null; title?: string | null }
export type ReviewDecision = "ALREADY_IMPORTED" | "POSSIBLE_DUPLICATE" | "NEW";

const norm = (s?: string | null) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Content fingerprint: same kind, date, amount and (normalised) title. */
export function fingerprint(r: { kind: ImportKind; date: string; amountCents?: number | null; title?: string | null }): string {
  return [r.kind, r.date, r.amountCents ?? "", norm(r.title)].join("|");
}

/**
 * Classify candidates for the review screen. A NEW candidate still needs your approval to import.
 * Duplicates inside the same batch are flagged too.
 */
export function classify(candidates: ImportCandidate[], existing: ExistingRecord[]): { candidate: ImportCandidate; decision: ReviewDecision; reason: string }[] {
  const ids = new Set(existing.filter((e) => e.externalId).map((e) => `${e.source}:${e.externalId}`));
  const prints = new Set(existing.map(fingerprint));
  const seenIds = new Set<string>(), seenPrints = new Set<string>();
  return candidates.map((c) => {
    const id = `${c.source}:${c.externalId}`, fp = fingerprint(c);
    let out: { decision: ReviewDecision; reason: string };
    if (ids.has(id) || seenIds.has(id)) out = { decision: "ALREADY_IMPORTED", reason: "This exact record was imported before." };
    else if (prints.has(fp) || seenPrints.has(fp)) out = { decision: "POSSIBLE_DUPLICATE", reason: "A record with the same date, amount and description already exists. Review before importing." };
    else out = { decision: "NEW", reason: "Not found in LEVEL UP. Import only if you approve it." };
    seenIds.add(id); seenPrints.add(fp);
    return { candidate: c, ...out };
  });
}
