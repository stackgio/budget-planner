/**
 * Smart Roulette allocation engine — pure, deterministic for a given seed, exact integer cents.
 * Shared by Overtime Money Roulette and Extra Paycheck Roulette. It only PROPOSES; nothing here
 * reserves, records, or moves money.
 */

export type ChallengeKind = "DEBT" | "MOVING_OUT" | "SCHD";
export type ProposedTarget = "ROTH" | "FUN" | "MOVING_TILE" | "SCHD_DAY" | "DEBT_TILE";

export interface TileCandidate {
  id: string;
  number: number;
  amountCents: number;
}

export interface ChallengeInput {
  kind: ChallengeKind;
  /** false for SETUP_REQUIRED / COMPLETE challenges — they never participate. */
  eligible: boolean;
  /** BIG_FIRST: open, unreserved tiles (any order). SEQUENTIAL: open, unreserved days in ascending order from the resume day. */
  rule: "BIG_FIRST" | "SEQUENTIAL";
  openTiles: TileCandidate[];
  /** Debt only: never allocate more than the outstanding balance. */
  capCents?: number;
}

export interface RouletteInput {
  budgetCents: number;
  rothTargetCents: number;
  funTargetCents: number;
  /** true: money left after challenges becomes extra fun money. false: stays unallocated on the deposit. */
  leftoverToFun: boolean;
  topN: number;
  /** Challenges in rotation order (the caller rotates by the stored pointer for fairness across paychecks). */
  challenges: ChallengeInput[];
  seed: string;
  /** Include ROTH/FUN lines at all (Extra Paycheck Roulette may spin challenges only). */
  includeReserves?: boolean;
}

export interface ProposedLine {
  target: ProposedTarget;
  amountCents: number;
  tileId?: string;
  tileNumber?: number;
}

export interface Proposal {
  lines: ProposedLine[];
  rothCents: number;
  funBaseCents: number;
  funLeftoverCents: number;
  challengeCents: number;
  unallocatedCents: number;
  shortfall: { rothCents: number; funCents: number };
  notes: string[];
  seed: string;
}

const TARGET: Record<ChallengeKind, ProposedTarget> = { DEBT: "DEBT_TILE", MOVING_OUT: "MOVING_TILE", SCHD: "SCHD_DAY" };

/** FNV-1a → mulberry32. Small, fast, reproducible. Not for security — only fair selection. */
export function seededRng(seed: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertCents(n: number, what: string) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${what} must be a non-negative integer number of cents`);
}

export function propose(input: RouletteInput): Proposal {
  assertCents(input.budgetCents, "budget");
  assertCents(input.rothTargetCents, "Roth target");
  assertCents(input.funTargetCents, "fun target");
  const rng = seededRng(input.seed);
  const includeReserves = input.includeReserves ?? true;
  const lines: ProposedLine[] = [];
  const notes: string[] = [];
  let remaining = input.budgetCents;

  // 1–2. Reserve Roth, then protect fun money — each capped at what is available.
  const rothCents = includeReserves ? Math.min(input.rothTargetCents, remaining) : 0;
  remaining -= rothCents;
  const funBaseCents = includeReserves ? Math.min(input.funTargetCents, remaining) : 0;
  remaining -= funBaseCents;
  const shortfall = {
    rothCents: includeReserves ? input.rothTargetCents - rothCents : 0,
    funCents: includeReserves ? input.funTargetCents - funBaseCents : 0,
  };
  if (shortfall.rothCents || shortfall.funCents) notes.push("This paycheck can't fully fund the Roth and fun-money defaults. Adjust them or approve a partial plan.");

  // 3. Challenge selection with fair rotation; affordability is re-evaluated after every pick.
  const state = input.challenges.map((c) => ({
    c,
    taken: new Set<string>(),
    seqIndex: 0,
    cap: c.capCents ?? Number.POSITIVE_INFINITY,
    done: !c.eligible,
  }));
  for (const s of state) {
    if (!s.c.eligible) notes.push(`${label(s.c.kind)} is not eligible (setup required or complete).`);
    else if (!s.c.openTiles.length) { s.done = true; notes.push(`${label(s.c.kind)} has no open tiles.`); }
  }

  let challengeCents = 0;
  for (let round = 0; round < 10_000; round++) {
    let picked = false;
    for (const s of state) {
      if (s.done) continue;
      let choice: TileCandidate | undefined;
      if (s.c.rule === "SEQUENTIAL") {
        const next = s.c.openTiles[s.seqIndex];
        // Never skip ahead: if the next day is unaffordable, SCHD stops for this paycheck.
        if (next && next.amountCents <= remaining && next.amountCents <= s.cap) {
          choice = next;
          s.seqIndex++;
        } else s.done = true;
      } else {
        const affordable = s.c.openTiles
          .filter((t) => !s.taken.has(t.id) && t.amountCents <= remaining && t.amountCents <= s.cap)
          .sort((a, b) => b.amountCents - a.amountCents || b.number - a.number)
          .slice(0, Math.max(1, input.topN));
        if (affordable.length) choice = affordable[Math.floor(rng() * affordable.length)];
        else s.done = true;
      }
      if (!choice) continue;
      s.taken.add(choice.id);
      s.cap -= choice.amountCents;
      remaining -= choice.amountCents;
      challengeCents += choice.amountCents;
      lines.push({ target: TARGET[s.c.kind], amountCents: choice.amountCents, tileId: choice.id, tileNumber: choice.number });
      picked = true;
    }
    if (!picked) break;
  }

  // 4. Leftover.
  const funLeftoverCents = input.leftoverToFun ? remaining : 0;
  const unallocatedCents = remaining - funLeftoverCents;
  const funTotal = funBaseCents + funLeftoverCents;
  const head: ProposedLine[] = [];
  if (rothCents > 0) head.push({ target: "ROTH", amountCents: rothCents });
  if (funTotal > 0) head.push({ target: "FUN", amountCents: funTotal });
  const all = [...head, ...lines];

  // Self-check: exact reconciliation, never over budget, no tile twice.
  const total = all.reduce((a, l) => a + l.amountCents, 0);
  if (total + unallocatedCents !== input.budgetCents) throw new Error("Roulette reconciliation failed");
  const ids = all.filter((l) => l.tileId).map((l) => l.tileId);
  if (new Set(ids).size !== ids.length) throw new Error("Roulette selected a tile twice");

  return { lines: all, rothCents, funBaseCents, funLeftoverCents, challengeCents, unallocatedCents, shortfall, notes, seed: input.seed };
}

export function label(kind: ChallengeKind): string {
  return kind === "DEBT" ? "Debt Payoff" : kind === "MOVING_OUT" ? "Moving-Out Savings" : "SCHD Investing";
}

/** Rotate challenge order by a stored pointer so each paycheck starts with a different goal. */
export function rotate<T>(items: T[], pointer: number): T[] {
  if (!items.length) return items;
  const k = ((pointer % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Split a budget by percentages (basis points) exactly; rounding remainder stays unallocated. */
export function splitByPercent(budgetCents: number, partsBp: number[]): { amounts: number[]; remainderCents: number } {
  const totalBp = partsBp.reduce((a, b) => a + b, 0);
  if (partsBp.some((b) => !Number.isInteger(b) || b < 0) || totalBp > 10_000) throw new Error("Percentages must be whole basis points totalling at most 100%");
  const amounts = partsBp.map((bp) => Math.floor((budgetCents * bp) / 10_000));
  return { amounts, remainderCents: budgetCents - amounts.reduce((a, b) => a + b, 0) };
}
