import { describe, expect, it } from "vitest";
import { expandSeries, formatRRule, parseRRule, ruleDates } from "@/domain/recurrence";
import { instantToLocalDate, instantToLocalTime, zonedToInstant } from "@/domain/dates";
import { occurrencesFor, findConflicts, type SeriesInput } from "@/domain/calendar";

const TZ = "America/New_York";
const DOC = "FREQ=WEEKLY;BYDAY=SA,SU,MO,TU,WE";

function docSeries(exceptions: SeriesInput["exceptions"] = []): SeriesInput {
  return {
    id: "doc", title: "DOC shift", description: null, category: "DOC_SHIFT",
    startAt: zonedToInstant("2027-01-02", "08:00", TZ), endAt: zonedToInstant("2027-01-02", "16:00", TZ),
    allDay: false, timezone: TZ, rrule: DOC, important: true, optional: false, exceptions,
  };
}

describe("time zones", () => {
  it("converts New York wall time across DST", () => {
    expect(zonedToInstant("2027-01-04", "08:00", TZ).toISOString()).toBe("2027-01-04T13:00:00.000Z");
    expect(zonedToInstant("2027-07-05", "08:00", TZ).toISOString()).toBe("2027-07-05T12:00:00.000Z");
  });
});

describe("RRULE subset", () => {
  it("round-trips", () => {
    expect(formatRRule(parseRRule(DOC))).toBe("FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,SA");
    expect(formatRRule(parseRRule("FREQ=MONTHLY;INTERVAL=2;COUNT=5"))).toBe("FREQ=MONTHLY;INTERVAL=2;COUNT=5");
  });
  it("rejects unsupported rules", () => {
    expect(() => parseRRule("FREQ=HOURLY")).toThrow();
  });
  it("monthly on the 31st skips short months", () => {
    const ds = [...ruleDates(parseRRule("FREQ=MONTHLY;COUNT=4"), "2027-01-31", "2027-12-31")];
    expect(ds).toEqual(["2027-01-31", "2027-03-31", "2027-05-31", "2027-07-31"]);
  });
  it("UNTIL is inclusive", () => {
    const ds = [...ruleDates(parseRRule("FREQ=DAILY;UNTIL=20270103"), "2027-01-01", "2027-12-31")];
    expect(ds).toEqual(["2027-01-01", "2027-01-02", "2027-01-03"]);
  });
});

describe("DOC recurring shifts", () => {
  it("produce Sat–Wed 8:00–16:00 in New York, Thu/Fri off", () => {
    const occ = expandSeries(docSeries(), zonedToInstant("2027-03-06", "00:00", TZ), zonedToInstant("2027-03-20", "00:00", TZ));
    const days = occ.map((o) => instantToLocalDate(o.start, TZ));
    expect(days).toEqual(["2027-03-06","2027-03-07","2027-03-08","2027-03-09","2027-03-10","2027-03-13","2027-03-14","2027-03-15","2027-03-16","2027-03-17"]);
    // DST began 2027-03-14 — wall time must stay 8:00
    for (const o of occ) {
      expect(instantToLocalTime(o.start, TZ)).toBe("08:00");
      expect(instantToLocalTime(o.end, TZ)).toBe("16:00");
    }
  });

  it("has 260 shifts in 2027 (5 per week × 52; 2027 has 53 Fridays)", () => {
    const occ = expandSeries(docSeries(), zonedToInstant("2027-01-01", "00:00", TZ), zonedToInstant("2028-01-01", "00:00", TZ));
    expect(occ.length).toBe(260);
  });

  it("a single-occurrence exception changes only that shift", () => {
    const orig = zonedToInstant("2027-03-08", "08:00", TZ);
    const s = docSeries([{ originalStart: orig, cancelled: false, startAt: zonedToInstant("2027-03-08", "08:00", TZ), endAt: zonedToInstant("2027-03-09", "00:00", TZ), title: "DOC double (16h)", description: null }]);
    const occ = occurrencesFor(s, zonedToInstant("2027-03-07", "00:00", TZ), zonedToInstant("2027-03-10", "00:00", TZ));
    expect(occ.map((o) => [instantToLocalDate(o.start, TZ), o.title, o.modified])).toEqual([
      ["2027-03-07", "DOC shift", false],
      ["2027-03-08", "DOC double (16h)", true],
      ["2027-03-09", "DOC shift", false],
    ]);
  });

  it("a cancelled occurrence disappears without touching the series", () => {
    const s = docSeries([{ originalStart: zonedToInstant("2027-03-08", "08:00", TZ), cancelled: true, startAt: null, endAt: null, title: null, description: null }]);
    const occ = occurrencesFor(s, zonedToInstant("2027-03-06", "00:00", TZ), zonedToInstant("2027-03-11", "00:00", TZ));
    expect(occ.map((o) => instantToLocalDate(o.start, TZ))).toEqual(["2027-03-06", "2027-03-07", "2027-03-09", "2027-03-10"]);
  });

  it("an occurrence moved to another day appears on the new day", () => {
    const s = docSeries([{ originalStart: zonedToInstant("2027-03-10", "08:00", TZ), cancelled: false, startAt: zonedToInstant("2027-03-11", "08:00", TZ), endAt: zonedToInstant("2027-03-11", "16:00", TZ), title: null, description: null }]);
    const occ = occurrencesFor(s, zonedToInstant("2027-03-11", "00:00", TZ), zonedToInstant("2027-03-12", "00:00", TZ));
    expect(occ).toHaveLength(1);
    expect(occ[0]!.modified).toBe(true);
  });

  it("detects conflicts", () => {
    const occ = occurrencesFor(docSeries(), zonedToInstant("2027-03-08", "00:00", TZ), zonedToInstant("2027-03-09", "00:00", TZ));
    const c = findConflicts({ start: zonedToInstant("2027-03-08", "15:00", TZ), end: zonedToInstant("2027-03-08", "17:00", TZ) }, occ);
    expect(c).toHaveLength(1);
    expect(findConflicts({ start: zonedToInstant("2027-03-08", "16:00", TZ), end: zonedToInstant("2027-03-08", "17:00", TZ) }, occ)).toHaveLength(0);
  });
});
