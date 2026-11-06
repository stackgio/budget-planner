import * as L from "../src/logic.js";
import assert from "node:assert/strict";
const ok = (n) => console.log("PASS", n);
// 1
let t = L.newTransfer({ amount: 30000, date: "2026-10-23", splits: [
  { name: "Capital One", amount: 10000, category: "credit" },
  { name: "Household bills", amount: 10000, category: "household" },
  { name: "American Express", amount: 10000, category: "credit" }] });
let s = L.transferStats(t);
assert.equal(s.allocated, 30000); assert.equal(s.reserved, 30000); assert.equal(s.unassigned, 0); assert.equal(t.status, "active"); ok("1 $300 split 3x$100");
// 2
t = L.markSplitPaid(t, t.splits[0].id, "2026-10-24"); s = L.transferStats(t);
assert.equal(s.paid, 10000); assert.equal(s.reserved, 20000); assert.equal(s.pct, 33); assert.equal(t.status, "active"); ok("2 one paid -> $200 reserved, 33%");
// 3
t = L.markSplitPaid(t, t.splits[2].id, "2026-10-25"); t = L.markSplitPaid(t, t.splits[1].id, "2026-10-26");
assert.equal(t.status, "completed"); const active = [t].filter(x => x.status === "active"); assert.equal(active.length, 0); ok("3 all paid -> completed, hidden from Active");
// 4
let ev = L.buildEvents([t]); assert.ok(ev.some(e => e.type === "transfer")); assert.equal(ev.filter(e => e.type === "payment").length, 3); ok("4 completed transfer in history");
// 5
let r = L.reopenTransfer(t); assert.equal(r.status, "active"); assert.equal(r.holdOpen, true);
r = L.reverseSplitPayments(r, r.splits[1].id); assert.equal(r.status, "active"); assert.equal(r.holdOpen, false); assert.equal(L.transferStats(r).reserved, 10000);
r = L.markSplitPaid(r, r.splits[1].id, "2026-10-27"); assert.equal(r.status, "completed");
let r2 = L.markComplete(L.reopenTransfer(t)); assert.equal(r2.status, "completed");
// reversing on a completed one moves it back to active
let r3 = L.reverseSplitPayments(t, t.splits[0].id); assert.equal(r3.status, "active"); ok("5 reopen/reverse/complete statuses");
// 6
let p = L.newTransfer({ amount: 30000, date: "2026-10-23", splits: [{ name: "Rent", amount: 20000, category: "rent" }] });
p = L.markSplitPaid(p, p.splits[0].id); assert.equal(p.status, "active"); assert.equal(L.transferStats(p).unassigned, 10000); ok("6 partial allocation stays active");
// over-allocation validation
assert.ok(L.validateTransfer(30000, [{ name: "a", amount: 20000 }, { name: "b", amount: 15000 }]).some(e => /more than/.test(e))); ok("6b over-allocation rejected");
// cancel -> unassigned, reassign
let c = L.newTransfer({ amount: 20000, date: "2026-10-23", splits: [{ name: "Phone", amount: 20000, category: "phone" }] });
c = L.cancelSplit(c, c.splits[0].id); assert.equal(L.transferStats(c).unassigned, 20000);
c = L.addSplit(c, { name: "Electric", amount: 20000, category: "utilities", reassignedFrom: "Phone" }); assert.equal(L.transferStats(c).unassigned, 0);
assert.throws(() => L.restoreSplit(c, c.splits[0].id)); ok("6c cancel/reassign/restore-guard");
// partial payment
let pp = L.newTransfer({ amount: 10000, date: "2026-10-23", splits: [{ name: "Amex", amount: 10000 }] });
pp = L.addPartialPayment(pp, pp.splits[0].id, 4000); assert.equal(L.splitState(pp.splits[0]), "partial"); assert.equal(L.transferStats(pp).reserved, 6000);
assert.throws(() => L.addPartialPayment(pp, pp.splits[0].id, 7000));
pp = L.addPartialPayment(pp, pp.splits[0].id, 6000); assert.equal(pp.status, "completed"); ok("6d partial payments");
// 7
const dt = (d) => d + "T10:00";
let u1 = L.newUncle({ datetime: dt("2026-10-01"), amount: 200000, type: "received", to: "bank" });
let u2 = L.newUncle({ datetime: dt("2026-10-02"), amount: 100000, type: "withdrawn" });
let u3 = L.newUncle({ datetime: dt("2026-10-03"), amount: 100000, type: "cash_given", person: "Auntie" });
let led = L.uncleLedger([u1, u2, u3]);
assert.equal(led.rows[1].after.held, 200000); assert.equal(led.totals.held, 100000); assert.equal(led.totals.cash, 0); assert.equal(led.totals.bank, 100000); ok("7 uncle held = $1,000");
let u4 = L.newUncle({ datetime: dt("2026-10-04"), amount: 50000, type: "received", to: "bank" });
assert.equal(L.uncleLedger([u1, u2, u3, u4]).totals.held, 150000); ok("7b example ends at $1,500");
// 8
let u3e = L.editUncle(u3, { amount: 60000 }); assert.equal(L.uncleLedger([u1, u2, u3e]).totals.held, 140000);
let u3v = L.editUncle(u3, { status: "voided" }); assert.equal(L.uncleLedger([u1, u2, u3v]).totals.held, 200000);
let u2d = L.softDelete(u2); assert.equal(L.uncleLedger([u1, u2d, u3]).totals.cash, -100000);
assert.equal(L.uncleLedger([u1, L.restoreDeleted(u2d), u3]).totals.held, 100000); ok("8 uncle edits/reversals recalc");
// 9
const recs = [t, p, u1, u2, u3];
const sm = L.summarize(recs, L.periodRange("all"));
assert.equal(sm.period.transferred, 60000); assert.equal(sm.period.billsPaid, 50000);
assert.equal(L.sum(Object.values(sm.period.byCat), x => x.paid), 50000); ok("9 transfers not counted as spending (paid 500 of 600 moved)");
// 10
const b = JSON.parse(JSON.stringify(L.makeBackup(recs)));
let m = L.mergeBackup(recs, b); assert.equal(m.records.length, recs.length); assert.equal(m.added, 0); assert.equal(m.unchanged, 5);
m = L.mergeBackup([], b); assert.equal(m.added, 5); assert.deepEqual(m.records, b.records);
const m2 = L.mergeBackup(m.records, b); assert.equal(m2.records.length, 5); ok("10 export/import no duplicates");
// parser
const q = (x) => L.parseUncleText(x, "2026-10-23T10:00").suggestions;
console.log(q("Unc gave me $2,000 to hold").map(s => [s.type, s.amount, s.person]));
console.log(q("Unc made me take out $1,000 to send to Auntie").map(s => [s.type, s.amount, s.person]));
console.log(q("Unc told me to send $250 to John").map(s => [s.type, s.amount, s.person]));
console.log(q("Unc gave me another $500").map(s => [s.type, s.amount, s.person]));
console.log(q("Unc told me to send 100 to Auntie").map(s => [s.type, s.amount, s.person]));
console.log(q("gave unc back 300 cash").map(s => [s.type, s.amount, s.from]));
console.log(L.periodRange("week", {}, "2026-10-23"), L.periodRange("last", {}, "2026-10-23"));
console.log(L.parseMoney("1,234.5"), L.parseMoney("0.07"), L.parseMoney("2k"), L.parseMoney("abc"), L.fmt(123456));
