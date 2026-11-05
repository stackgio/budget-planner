import Papa from "papaparse";
import { createHash } from "node:crypto";
import { isISODate, ymd, type ISODate } from "./dates";
import { centsToDecimalString, parseDollars, type Cents } from "./money";

export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): CsvTable {
  const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const data = res.data.filter((r) => r.some((c) => String(c).trim() !== ""));
  if (data.length === 0) return { headers: [], rows: [] };
  const [headers, ...rows] = data;
  return { headers: headers.map((h, i) => String(h).trim() || `Column ${i + 1}`), rows };
}

export type DateFormat = "auto" | "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";

export interface CsvMapping {
  date: number;
  description: number;
  /** Either a single signed amount column... */
  amount?: number | null;
  /** ...or separate debit (money out) / credit (money in) columns. */
  debit?: number | null;
  credit?: number | null;
  category?: number | null;
  /** Flip signs if the bank exports outflows as positive numbers. */
  invertAmount?: boolean;
  dateFormat?: DateFormat;
}

export function parseDate(raw: string, fmt: DateFormat = "auto"): ISODate | null {
  const s = raw.trim();
  if (fmt === "YYYY-MM-DD" || (fmt === "auto" && /^\d{4}-\d{1,2}-\d{1,2}/.test(s))) {
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    const d = ymd(+m[1], +m[2], +m[3]);
    return isISODate(d) ? d : null;
  }
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return null;
  let y = +m[3];
  if (y < 100) y += 2000;
  const [mo, da] = fmt === "DD/MM/YYYY" ? [+m[2], +m[1]] : [+m[1], +m[2]];
  const d = ymd(y, mo, da);
  return isISODate(d) ? d : null;
}

/** Guess a mapping from common bank header names. */
export function guessMapping(headers: string[]): CsvMapping {
  const find = (...pats: RegExp[]) => {
    for (const p of pats) {
      const i = headers.findIndex((h) => p.test(h));
      if (i >= 0) return i;
    }
    return null;
  };
  const date = find(/^(transaction |posting |post |trans\.? )?date$/i, /date/i) ?? 0;
  const description = find(/^description$/i, /merchant|payee|description|name|memo|details/i) ?? 1;
  const amount = find(/^amount$/i, /amount/i);
  const debit = find(/debit|withdrawal|money out/i);
  const credit = find(/credit|deposit|money in/i);
  const category = find(/category/i);
  if (amount !== null) return { date, description, amount, category, dateFormat: "auto" };
  return { date, description, debit, credit, category, dateFormat: "auto" };
}

export interface ParsedRow {
  rowIndex: number;
  date: ISODate;
  merchant: string;
  amountCents: Cents; // signed: + money in, - money out
  category: string | null;
  hash: string;
}

export interface RowError {
  rowIndex: number;
  error: string;
}

export function normalizeMerchant(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

/**
 * Stable fingerprint: account + date + amount + normalized description + the
 * occurrence number of that identical tuple within the file. The occurrence
 * number keeps two genuine identical purchases (two $5 coffees the same day)
 * while still blocking a re-import of the same file.
 */
export function rowHash(accountId: string, date: ISODate, amountCents: Cents, merchant: string, occurrence: number): string {
  return createHash("sha256").update([accountId, date, centsToDecimalString(amountCents), normalizeMerchant(merchant), occurrence].join("|")).digest("hex").slice(0, 32);
}

export function mapRows(table: CsvTable, mapping: CsvMapping, accountId: string): { rows: ParsedRow[]; errors: RowError[] } {
  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();
  table.rows.forEach((r, idx) => {
    const rowIndex = idx + 2; // 1-based, after header
    const date = parseDate(String(r[mapping.date] ?? ""), mapping.dateFormat ?? "auto");
    if (!date) return errors.push({ rowIndex, error: `Unrecognized date "${r[mapping.date] ?? ""}"` });
    const merchant = String(r[mapping.description] ?? "").trim() || "Unknown";
    let amount: Cents | null = null;
    if (mapping.amount !== undefined && mapping.amount !== null) {
      amount = parseDollars(String(r[mapping.amount] ?? ""));
    } else {
      const debit = mapping.debit != null ? parseDollars(String(r[mapping.debit] ?? "")) : null;
      const credit = mapping.credit != null ? parseDollars(String(r[mapping.credit] ?? "")) : null;
      if (debit !== null || credit !== null) amount = (credit ? Math.abs(credit) : 0) - (debit ? Math.abs(debit) : 0);
    }
    if (amount === null) return errors.push({ rowIndex, error: "Missing or invalid amount" });
    if (mapping.invertAmount) amount = -amount;
    const key = `${date}|${amount}|${normalizeMerchant(merchant)}`;
    const occ = (seen.get(key) ?? 0) + 1;
    seen.set(key, occ);
    rows.push({
      rowIndex,
      date,
      merchant,
      amountCents: amount,
      category: mapping.category != null ? String(r[mapping.category] ?? "").trim() || null : null,
      hash: rowHash(accountId, date, amount, merchant, occ),
    });
  });
  return { rows, errors };
}

/** Split parsed rows into new rows and duplicates of already-imported hashes. */
export function dedupe(rows: ParsedRow[], existingHashes: Set<string>): { fresh: ParsedRow[]; duplicates: ParsedRow[] } {
  const fresh: ParsedRow[] = [];
  const duplicates: ParsedRow[] = [];
  const batch = new Set<string>();
  for (const r of rows) {
    if (existingHashes.has(r.hash) || batch.has(r.hash)) duplicates.push(r);
    else {
      fresh.push(r);
      batch.add(r.hash);
    }
  }
  return { fresh, duplicates };
}

function esc(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  return [headers, ...rows].map((r) => r.map((c) => esc(c === null || c === undefined ? "" : String(c))).join(",")).join("\n") + "\n";
}
