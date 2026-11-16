import { describe, expect, it } from "vitest";
import { buildDebtTiles } from "@/domain/debt";

const sum = (r: ReturnType<typeof buildDebtTiles>) => ("tiles" in r ? r.tiles.reduce((a, b) => a + b, 0) : -1);

describe("debt tile mappings always reconcile to the target", () => {
  it("numbered: $1…$N plus a remainder tile", () => {
    const r = buildDebtTiles("numbered", 5_050 * 100, {});
    expect("tiles" in r && r.tiles.length).toBe(100);
    const r2 = buildDebtTiles("numbered", 3_210_00, {}); // not triangular
    expect(sum(r2)).toBe(3_210_00);
  });
  it("equal tiles with a final remainder tile", () => {
    const r = buildDebtTiles("equal", 1_000_00, { tileAmountCents: 300_00 });
    expect("tiles" in r && r.tiles).toEqual([300_00, 300_00, 300_00, 100_00]);
  });
  it("custom list parses dollars and rejects junk", () => {
    expect(sum(buildDebtTiles("custom", 0, { custom: "1" }))).toBe(-1); // target required
    expect(sum(buildDebtTiles("custom", 225_00, { custom: "100, 75.00 50" }))).toBe(225_00);
    expect("error" in buildDebtTiles("custom", 100, { custom: "abc" })).toBe(true);
  });
  it("never invents a target", () => {
    expect("error" in buildDebtTiles("numbered", 0, {})).toBe(true);
  });
});
