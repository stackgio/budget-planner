import { describe, expect, it } from "vitest";
import { propose, rotate, splitByPercent, type ChallengeInput, type RouletteInput } from "@/domain/roulette";

const moving = (done: number[] = []): ChallengeInput => ({
  kind: "MOVING_OUT", eligible: true, rule: "BIG_FIRST",
  openTiles: Array.from({ length: 141 }, (_, i) => i + 1).filter((n) => !done.includes(n)).map((n) => ({ id: `m${n}`, number: n, amountCents: n * 100 })),
});
const schd = (from = 38): ChallengeInput => ({
  kind: "SCHD", eligible: true, rule: "SEQUENTIAL",
  openTiles: Array.from({ length: 101 - from }, (_, i) => from + i).map((n) => ({ id: `s${n}`, number: n, amountCents: n * 100 })),
});
const debtUnconfigured: ChallengeInput = { kind: "DEBT", eligible: false, rule: "BIG_FIRST", openTiles: [] };

const base = (budgetCents: number, over: Partial<RouletteInput> = {}): RouletteInput => ({
  budgetCents, rothTargetCents: 10_000, funTargetCents: 5_000, leftoverToFun: true, topN: 10,
  challenges: [debtUnconfigured, moving(), schd()], seed: "seed-1", ...over,
});

function check(p: ReturnType<typeof propose>, budget: number) {
  const total = p.lines.reduce((a, l) => a + l.amountCents, 0);
  expect(total + p.unallocatedCents).toBe(budget); // exact reconciliation
  expect(total).toBeLessThanOrEqual(budget); // never overspends
  for (const l of p.lines) expect(Number.isSafeInteger(l.amountCents) && l.amountCents > 0).toBe(true);
  const tiles = p.lines.filter((l) => l.tileId).map((l) => l.tileId);
  expect(new Set(tiles).size).toBe(tiles.length); // no tile twice
  expect(p.lines.some((l) => l.target === "DEBT_TILE")).toBe(false); // unconfigured debt excluded
}

describe("Overtime Money Roulette amounts", () => {
  for (const dollars of [0, 25, 100, 150, 250, 400, 500, 600, 1000]) {
    it(`$${dollars} paycheck reconciles exactly and never overspends`, () => {
      for (let i = 0; i < 25; i++) check(propose(base(dollars * 100, { seed: `s${i}` })), dollars * 100);
    });
  }

  it("$0: nothing allocated, full shortfall reported", () => {
    const p = propose(base(0));
    expect(p.lines).toEqual([]);
    expect(p.shortfall).toEqual({ rothCents: 10_000, funCents: 5_000 });
  });

  it("$25: smaller than reserves — all to Roth, shortfall shown, no negative values", () => {
    const p = propose(base(2_500));
    expect(p.lines).toEqual([{ target: "ROTH", amountCents: 2_500 }]);
    expect(p.shortfall).toEqual({ rothCents: 7_500, funCents: 5_000 });
  });

  it("$100: Roth only, fun shortfall", () => {
    const p = propose(base(10_000));
    expect(p.rothCents).toBe(10_000);
    expect(p.funBaseCents).toBe(0);
    expect(p.shortfall.funCents).toBe(5_000);
  });

  it("$150: exactly the reserves — all challenge tiles unaffordable", () => {
    const p = propose(base(15_000));
    expect(p.challengeCents).toBe(0);
    expect(p.lines.map((l) => l.target)).toEqual(["ROTH", "FUN"]);
  });

  it("$250: $100 left for challenges, picks are affordable, leftover becomes free money", () => {
    const p = propose(base(25_000));
    expect(p.rothCents).toBe(10_000);
    expect(p.challengeCents).toBeLessThanOrEqual(10_000);
    expect(p.challengeCents).toBeGreaterThan(0);
    expect(p.funBaseCents + p.funLeftoverCents + p.challengeCents + p.rothCents).toBe(25_000);
  });

  it("big numbers first: moving-out picks come from the 10 largest affordable tiles", () => {
    const p = propose(base(100_000, { challenges: [moving()] }));
    const first = p.lines.find((l) => l.target === "MOVING_TILE")!;
    expect(first.tileNumber).toBeGreaterThanOrEqual(132); // top 10 of 141
    expect(first.tileNumber).toBeLessThanOrEqual(141);
  });

  it("affordability is re-evaluated after each pick", () => {
    const p = propose(base(30_000, { challenges: [moving()] }));
    let remaining = 15_000;
    for (const l of p.lines.filter((x) => x.tileId)) {
      expect(l.amountCents).toBeLessThanOrEqual(remaining);
      remaining -= l.amountCents;
    }
  });

  it("never selects completed tiles", () => {
    const done = Array.from({ length: 140 }, (_, i) => i + 2); // only #1 open
    const p = propose(base(100_000, { challenges: [moving(done)] }));
    expect(p.lines.filter((l) => l.target === "MOVING_TILE").map((l) => l.tileNumber)).toEqual([1]);
  });

  it("only one eligible challenge is used", () => {
    const p = propose(base(50_000, { challenges: [debtUnconfigured, schd()] }));
    expect(new Set(p.lines.filter((l) => l.tileId).map((l) => l.target))).toEqual(new Set(["SCHD_DAY"]));
  });

  it("all challenges completed: only Roth and fun money", () => {
    const p = propose(base(100_000, { challenges: [{ ...moving(), openTiles: [] }, { ...schd(), openTiles: [] }, debtUnconfigured] }));
    expect(p.challengeCents).toBe(0);
    expect(p.funBaseCents + p.funLeftoverCents).toBe(90_000);
  });
});

describe("SCHD sequential rule", () => {
  it("starts at Day 38 and takes consecutive days ($38 + $39 + $40 = $117)", () => {
    const p = propose(base(26_700, { challenges: [schd()], leftoverToFun: false }));
    expect(p.lines.filter((l) => l.target === "SCHD_DAY").map((l) => l.tileNumber)).toEqual([38, 39, 40]);
    expect(p.challengeCents).toBe(11_700);
    expect(p.unallocatedCents).toBe(26_700 - 15_000 - 11_700);
  });

  it("never skips ahead when the next day is unaffordable", () => {
    const p = propose(base(15_000 + 3_700, { challenges: [schd()] })); // $37 left < $38
    expect(p.lines.some((l) => l.target === "SCHD_DAY")).toBe(false);
  });

  it("resumes from the next open day", () => {
    const p = propose(base(25_000, { challenges: [schd(45)] }));
    expect(p.lines.find((l) => l.target === "SCHD_DAY")?.tileNumber).toBe(45);
  });
});

describe("rerolls and fairness", () => {
  it("rerolls change the proposal but always stay valid; same seed is reproducible", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const p = propose(base(60_000, { seed: `r${i}` }));
      check(p, 60_000);
      seen.add(p.lines.map((l) => l.tileNumber ?? l.target).join(","));
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(propose(base(60_000, { seed: "x" }))).toEqual(propose(base(60_000, { seed: "x" })));
  });

  it("rotation changes which challenge goes first", () => {
    expect(rotate(["DEBT", "MOVING_OUT", "SCHD"], 1)).toEqual(["MOVING_OUT", "SCHD", "DEBT"]);
    const a = propose(base(25_000, { challenges: rotate([moving(), schd()], 1), seed: "z" }));
    expect(a.lines.find((l) => l.tileId)?.target).toBe("SCHD_DAY");
  });

  it("debt never exceeds the outstanding balance", () => {
    const debt: ChallengeInput = { kind: "DEBT", eligible: true, rule: "BIG_FIRST", capCents: 5_000, openTiles: Array.from({ length: 100 }, (_, i) => ({ id: `d${i + 1}`, number: i + 1, amountCents: (i + 1) * 100 })) };
    for (let i = 0; i < 20; i++) {
      const p = propose(base(100_000, { challenges: [debt], seed: `d${i}` }));
      expect(p.lines.filter((l) => l.target === "DEBT_TILE").reduce((a, l) => a + l.amountCents, 0)).toBeLessThanOrEqual(5_000);
    }
  });

  it("extra paycheck spin can exclude Roth/fun reserves and leave leftover unallocated", () => {
    const p = propose(base(30_000, { includeReserves: false, leftoverToFun: false, challenges: [schd()] }));
    expect(p.lines.every((l) => l.target === "SCHD_DAY")).toBe(true);
    expect(p.unallocatedCents).toBe(30_000 - p.challengeCents);
  });
});

describe("percentage split", () => {
  it("is exact; rounding remainder stays unallocated", () => {
    expect(splitByPercent(100_001, [5_000, 3_333])).toEqual({ amounts: [50_000, 33_330], remainderCents: 16_671 });
    expect(() => splitByPercent(100, [6_000, 5_000])).toThrow();
  });
});
