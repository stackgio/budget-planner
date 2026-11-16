import { describe, expect, it } from "vitest";
import { inView, nextDueDate } from "@/domain/tasks";
import { adjustmentSuggestions, suppressOptional } from "@/domain/modes";
import type { Occurrence } from "@/domain/calendar";

describe("task views", () => {
  const today = "2027-03-10";
  it("today includes overdue open tasks; completed excluded", () => {
    expect(inView({ status: "OPEN", dueDate: "2027-03-09" }, "today", today)).toBe(true);
    expect(inView({ status: "DONE", dueDate: "2027-03-10" }, "today", today)).toBe(false);
    expect(inView({ status: "OPEN", dueDate: "2027-03-11" }, "tomorrow", today)).toBe(true);
    expect(inView({ status: "OPEN", dueDate: null }, "upcoming", today)).toBe(false);
  });
  it("recurring tasks roll forward", () => {
    expect(nextDueDate("FREQ=WEEKLY;BYDAY=MO,TH", "2027-03-08", "2027-03-08")).toBe("2027-03-11");
  });
});

describe("work modes", () => {
  const occ = (id: string, cat: Occurrence["category"], s: string, e: string, extra: Partial<Occurrence> = {}): Occurrence => ({
    key: id, eventId: id, originalStart: new Date(s), start: new Date(s), end: new Date(e), title: id, description: null,
    category: cat, allDay: false, recurring: false, modified: false, important: false, optional: false, ...extra,
  });
  it("suppresses optional items outside Normal", () => {
    expect(suppressOptional("NORMAL")).toBe(false);
    expect(suppressOptional("ACTIVATION")).toBe(true);
  });
  it("suggests postponing gym/gig, keeps important, never auto-deletes", () => {
    const w = { start: new Date("2027-03-08T12:00:00Z"), end: new Date("2027-03-09T04:00:00Z") };
    const s = adjustmentSuggestions(w, [
      occ("gym", "WORKOUT", "2027-03-08T22:00:00Z", "2027-03-08T23:00:00Z"),
      occ("doctor", "APPOINTMENT", "2027-03-09T13:00:00Z", "2027-03-09T15:00:00Z", { important: true }),
      occ("gig", "GIG", "2027-03-09T10:00:00Z", "2027-03-09T12:00:00Z"),
      occ("later", "PERSONAL", "2027-03-12T10:00:00Z", "2027-03-12T11:00:00Z"),
    ]);
    expect(s.map((x) => [x.occurrence.eventId, x.kind])).toEqual([["gym", "postpone"], ["gig", "postpone"], ["doctor", "keep"]]);
  });
});
