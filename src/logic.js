// Money Command Center — pure financial logic. All money is integer cents.

export const uid = (p) =>
  p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const nowISO = () => new Date().toISOString();
export const todayStr = () => localDate(new Date());
export function localDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------- money ----------
export function parseMoney(input) {
  if (input == null) return null;
  let s = String(input).trim().replace(/[$,\s]/g, "");
  let mult = 1;
  if (/k$/i.test(s)) { mult = 1000; s = s.slice(0, -1); }
  if (!/^\d+(\.\d{0,2})?$/.test(s) && !/^\.\d{1,2}$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  const cents = parseInt(w || "0", 10) * 100 + parseInt((f + "00").slice(0, 2), 10);
  return cents * mult;
}
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export function fmt(cents, opts = {}) {
  const c = Math.round(cents || 0);
  const s = usd.format(Math.abs(c) / 100);
  if (opts.sign && c > 0) return "+" + s;
  if (c < 0) return "−" + s;
  return s;
}
export const centsToInput = (c) => (c ? (c / 100).toFixed(2).replace(/\.00$/, "") : "");
export const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + (f(x) || 0), 0);

// ---------- categories ----------
export const CATEGORIES = [
  { id: "credit", label: "Credit card" },
  { id: "rent", label: "Rent / mortgage" },
  { id: "utilities", label: "Utilities" },
  { id: "household", label: "Household" },
  { id: "phone", label: "Phone & internet" },
  { id: "insurance", label: "Insurance" },
  { id: "auto", label: "Car & transport" },
  { id: "loan", label: "Loans" },
  { id: "other", label: "Other" },
];
export const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || CATEGORIES[8]).label;
export function guessCategory(name) {
  const n = (name || "").toLowerCase();
  if (/capital\s*one|cap one|amex|american express|discover|chase|citi|visa|mastercard|card/.test(n)) return "credit";
  if (/rent|mortgage|landlord/.test(n)) return "rent";
  if (/electric|power|gas|water|sewer|utility|utilities|energy/.test(n)) return "utilities";
  if (/phone|internet|wifi|verizon|t-mobile|at&t|comcast|xfinity|spectrum/.test(n)) return "phone";
  if (/insurance|geico|progressive|allstate/.test(n)) return "insurance";
  if (/car|auto|toyota|honda|fuel|gas station/.test(n)) return "auto";
  if (/loan|student|sallie|navient/.test(n)) return "loan";
  if (/household|grocer|house/.test(n)) return "household";
  return null;
}
export const ACCOUNTS = { main: "Main Checking", bills: "Bills Checking" };

// ---------- splits & transfers ----------
export const splitPaid = (s) => sum(s.payments || [], (p) => p.amount);
export const splitEffective = (s) => (s.status === "canceled" ? splitPaid(s) : s.amount);
export const splitRemaining = (s) => (s.status === "canceled" ? 0 : Math.max(0, s.amount - splitPaid(s)));
export function splitState(s) {
  if (s.status === "canceled") return "canceled";
  const p = splitPaid(s);
  if (p >= s.amount && s.amount > 0) return "paid";
  if (p > 0) return "partial";
  return "unpaid";
}
export function transferStats(t) {
  const splits = t.splits || [];
  const allocated = sum(splits, splitEffective);
  const paid = sum(splits, splitPaid);
  const reserved = sum(splits, splitRemaining);
  const unassigned = t.amount - allocated;
  const pct = t.amount > 0 ? Math.min(100, Math.round((paid / t.amount) * 100)) : 0;
  const open = splits.filter((s) => splitState(s) === "unpaid" || splitState(s) === "partial").length;
  return { allocated, paid, reserved, unassigned, pct, open };
}
export function isFullyPaid(t) {
  const s = transferStats(t);
  return t.amount > 0 && s.allocated > 0 && s.reserved === 0 && s.unassigned === 0;
}

/** Validate transfer amount + splits. Returns array of error strings. */
export function validateTransfer(amount, splits) {
  const errs = [];
  if (!Number.isInteger(amount) || amount <= 0) errs.push("Enter a transfer amount greater than $0.");
  splits.forEach((s, i) => {
    const label = s.name ? `“${s.name}”` : `Split ${i + 1}`;
    if (!s.name || !s.name.trim()) errs.push(`Split ${i + 1} needs a name.`);
    if (!Number.isInteger(s.amount) || s.amount <= 0) errs.push(`${label} needs an amount greater than $0.`);
    else if (s.status !== "canceled" && splitPaid(s) > s.amount)
      errs.push(`${label} already has ${fmt(splitPaid(s))} paid, so its amount can’t be less than that.`);
  });
  const allocated = sum(splits, (s) => (Number.isInteger(s.amount) ? splitEffective(s) : 0));
  if (Number.isInteger(amount) && amount > 0 && allocated > amount)
    errs.push(`Splits add up to ${fmt(allocated)}, which is ${fmt(allocated - amount)} more than the ${fmt(amount)} transfer. Lower a split or raise the transfer amount.`);
  return errs;
}

const withAudit = (t, text, at = nowISO()) => ({ ...t, updatedAt: at, audit: [...(t.audit || []), { at, text }] });

/** Apply automatic completion rules after any change. */
export function reconcile(t, at = nowISO()) {
  if (t.status === "archived") return t;
  const full = isFullyPaid(t);
  let n = t;
  if (!full && n.holdOpen) n = { ...n, holdOpen: false };
  if (n.status === "active" && full && !n.holdOpen) {
    n = withAudit({ ...n, status: "completed", completedAt: at }, "Transfer completed: every bill paid, nothing left unassigned. Moved to Completed.", at);
  } else if (n.status === "completed" && !full) {
    n = withAudit({ ...n, status: "active", completedAt: null }, "Moved back to Active because money is reserved or unassigned again.", at);
  }
  return n;
}

export function newTransfer({ amount, date, from = "main", to = "bills", note = "", splits = [] }, at = nowISO()) {
  const t = {
    id: uid("tr"), kind: "transfer", amount, date, from, to, note,
    splits: splits.map((s) => ({ id: s.id || uid("sp"), name: s.name.trim(), amount: s.amount, category: s.category || "other", dueDate: s.dueDate || "", notes: s.notes || "", status: s.status || "unpaid", payments: s.payments || [] })),
    status: "active", holdOpen: false, completedAt: null, archivedAt: null, deletedAt: null,
    createdAt: at, updatedAt: at,
    audit: [{ at, text: `Transferred ${fmt(amount)} from ${ACCOUNTS[from]} to ${ACCOUNTS[to]}${splits.length ? `, split ${splits.length} ways` : ""}.` }],
  };
  return reconcile(t, at);
}

const mapSplit = (t, splitId, f) => ({ ...t, splits: t.splits.map((s) => (s.id === splitId ? f(s) : s)) });
const findSplit = (t, id) => t.splits.find((s) => s.id === id);

export function markSplitPaid(t, splitId, date = todayStr(), at = nowISO()) {
  const s = findSplit(t, splitId);
  const rem = splitRemaining(s);
  if (!s || rem <= 0) return t;
  const n = mapSplit(t, splitId, (x) => ({ ...x, status: "paid", payments: [...(x.payments || []), { id: uid("pay"), date, amount: rem, at }] }));
  return reconcile(withAudit(n, `Paid ${s.name} ${fmt(rem)} on ${date}.`, at), at);
}
export function addPartialPayment(t, splitId, amount, date = todayStr(), at = nowISO()) {
  const s = findSplit(t, splitId);
  if (!s || !Number.isInteger(amount) || amount <= 0) throw new Error("Enter a payment amount greater than $0.");
  const rem = splitRemaining(s);
  if (amount > rem) throw new Error(`That’s more than the ${fmt(rem)} still owed on ${s.name}.`);
  const n = mapSplit(t, splitId, (x) => {
    const payments = [...(x.payments || []), { id: uid("pay"), date, amount, at }];
    return { ...x, payments, status: sum(payments, (p) => p.amount) >= x.amount ? "paid" : "unpaid" };
  });
  return reconcile(withAudit(n, `Partial payment to ${s.name}: ${fmt(amount)} on ${date} (${fmt(rem - amount)} still reserved).`, at), at);
}
export function reverseSplitPayments(t, splitId, at = nowISO()) {
  const s = findSplit(t, splitId);
  const paid = splitPaid(s);
  if (!s || paid === 0) return t;
  const n = mapSplit(t, splitId, (x) => ({ ...x, status: x.status === "canceled" ? "canceled" : "unpaid", payments: [] }));
  return reconcile(withAudit(n, `Reversed payment of ${s.name} (${fmt(paid)}). Marked unpaid.`, at), at);
}
export function cancelSplit(t, splitId, at = nowISO()) {
  const s = findSplit(t, splitId);
  if (!s || s.status === "canceled") return t;
  const rem = splitRemaining(s);
  const n = mapSplit(t, splitId, (x) => ({ ...x, status: "canceled" }));
  return reconcile(withAudit(n, `Canceled ${s.name}. ${fmt(rem)} went back to unassigned.`, at), at);
}
export function restoreSplit(t, splitId, at = nowISO()) {
  const s = findSplit(t, splitId);
  if (!s || s.status !== "canceled") return t;
  const n = mapSplit(t, splitId, (x) => ({ ...x, status: splitPaid(x) >= x.amount ? "paid" : "unpaid" }));
  const errs = validateTransfer(n.amount, n.splits);
  if (errs.length) throw new Error(`Can’t restore ${s.name}: not enough unassigned money. ${errs[0]}`);
  return reconcile(withAudit(n, `Restored canceled bill ${s.name} (${fmt(s.amount)}).`, at), at);
}
export function addSplit(t, split, at = nowISO()) {
  const sp = { id: uid("sp"), name: split.name.trim(), amount: split.amount, category: split.category || "other", dueDate: split.dueDate || "", notes: split.notes || "", status: "unpaid", payments: [] };
  const splits = [...t.splits, sp];
  const errs = validateTransfer(t.amount, splits);
  if (errs.length) throw new Error(errs[0]);
  return reconcile(withAudit({ ...t, splits }, `Assigned ${fmt(sp.amount)} to ${sp.name}${split.reassignedFrom ? ` (reassigned from ${split.reassignedFrom})` : ""}.`, at), at);
}
/** Full edit of a transfer: new header fields + new splits array. */
export function editTransfer(t, { amount, date, note, from, to, splits }, at = nowISO()) {
  const errs = validateTransfer(amount, splits);
  if (errs.length) throw new Error(errs[0]);
  const changes = [];
  if (amount !== t.amount) changes.push(`amount ${fmt(t.amount)} → ${fmt(amount)}`);
  if (date !== t.date) changes.push(`date ${t.date} → ${date}`);
  if ((note || "") !== (t.note || "")) changes.push("description");
  if (from !== t.from || to !== t.to) changes.push(`accounts → ${ACCOUNTS[from]} to ${ACCOUNTS[to]}`);
  const oldById = Object.fromEntries(t.splits.map((s) => [s.id, s]));
  const newIds = new Set();
  splits.forEach((s) => {
    newIds.add(s.id);
    const o = oldById[s.id];
    if (!o) changes.push(`added ${s.name} ${fmt(s.amount)}`);
    else {
      if (o.name !== s.name) changes.push(`renamed ${o.name} → ${s.name}`);
      if (o.amount !== s.amount) changes.push(`${s.name} ${fmt(o.amount)} → ${fmt(s.amount)}`);
      if (o.category !== s.category) changes.push(`${s.name} category ${catLabel(o.category)} → ${catLabel(s.category)}`);
      if ((o.dueDate || "") !== (s.dueDate || "")) changes.push(`${s.name} due date`);
    }
  });
  t.splits.forEach((o) => { if (!newIds.has(o.id)) changes.push(`removed ${o.name}${splitPaid(o) ? ` (and its ${fmt(splitPaid(o))} payment record)` : ""}`); });
  // re-derive status of each split from its payments
  const fixed = splits.map((s) => ({ ...s, status: s.status === "canceled" ? "canceled" : splitPaid(s) >= s.amount ? "paid" : "unpaid" }));
  const n = { ...t, amount, date, note, from, to, splits: fixed };
  return reconcile(changes.length ? withAudit(n, `Edited: ${changes.join("; ")}.`, at) : n, at);
}
export function reopenTransfer(t, at = nowISO()) {
  if (t.status === "active") return t;
  const wasArchived = t.status === "archived";
  return reconcile(withAudit({ ...t, status: "active", holdOpen: isFullyPaid(t), completedAt: null, archivedAt: null },
    wasArchived ? "Restored from archive to Active." : "Reopened. Kept in Active until you mark it complete or a payment changes.", at), at);
}
export function markComplete(t, at = nowISO()) {
  if (!isFullyPaid(t)) return t;
  return withAudit({ ...t, status: "completed", holdOpen: false, completedAt: at }, "Marked complete.", at);
}
export function archiveTransfer(t, at = nowISO()) {
  if (t.status === "archived") return t;
  return withAudit({ ...t, status: "archived", archivedAt: at, holdOpen: false }, `Archived${t.status === "completed" ? " after completion" : ""}. Still counted in summaries.`, at);
}
export function softDelete(rec, at = nowISO()) {
  return withAudit({ ...rec, deletedAt: at }, "Moved to Trash. Excluded from balances and summaries until restored.", at);
}
export function restoreDeleted(rec, at = nowISO()) {
  return withAudit({ ...rec, deletedAt: null }, "Restored from Trash.", at);
}

// ---------- uncle ledger ----------
export const UNCLE_TYPES = {
  received: { label: "Money received from uncle", short: "Received", dir: 1 },
  sent: { label: "Money sent to someone", short: "Sent", dir: -1 },
  withdrawn: { label: "Cash withdrawn", short: "Withdrew cash", dir: 0 },
  cash_given: { label: "Cash given to someone", short: "Gave cash", dir: -1 },
  returned: { label: "Money returned to uncle", short: "Returned", dir: -1 },
  move: { label: "Transfer between holding locations", short: "Moved", dir: 0 },
  adjustment: { label: "Adjustment or correction", short: "Adjustment", dir: 0 },
};
export const LOCATIONS = { bank: "Bank account", cash: "Cash on hand" };
export const METHODS = ["Cash", "Bank transfer", "Zelle", "Cash App", "Venmo", "Check", "Money order", "Wire", "Other"];

/** Normalize locations for a type so effects are always well-defined. */
export function normalizeUncle(tx) {
  const n = { ...tx };
  if (n.type === "withdrawn") { n.from = "bank"; n.to = "cash"; }
  if (n.type === "cash_given") { n.from = "cash"; n.to = null; }
  if (n.type === "received") { n.from = null; n.to = n.to === "cash" ? "cash" : "bank"; }
  if (n.type === "sent" || n.type === "returned") { n.from = n.from === "cash" ? "cash" : "bank"; n.to = null; }
  if (n.type === "move") { n.from = n.from === "cash" ? "cash" : "bank"; n.to = n.from === "bank" ? "cash" : "bank"; }
  if (n.type === "adjustment") { n.from = n.from === "cash" ? "cash" : "bank"; n.to = null; n.adjDir = n.adjDir === -1 ? -1 : 1; }
  return n;
}
export function uncleEffect(tx) {
  const a = tx.amount, e = { bank: 0, cash: 0, delivered: 0, returned: 0, received: 0 };
  switch (tx.type) {
    case "received": e[tx.to] += a; e.received += a; break;
    case "sent": e[tx.from] -= a; e.delivered += a; break;
    case "cash_given": e.cash -= a; e.delivered += a; break;
    case "returned": e[tx.from] -= a; e.returned += a; break;
    case "withdrawn": e.bank -= a; e.cash += a; break;
    case "move": e[tx.from] -= a; e[tx.to] += a; break;
    case "adjustment": e[tx.from] += a * tx.adjDir; break;
  }
  return e;
}
export const uncleCounts = (tx) => !tx.deletedAt && tx.status === "completed";
export function uncleSort(a, b) {
  return (a.datetime || "").localeCompare(b.datetime || "") || (a.createdAt || "").localeCompare(b.createdAt || "");
}
/** Running ledger. Returns rows (chronological) with balances after each, and totals. */
export function uncleLedger(txs) {
  const list = txs.filter((t) => !t.deletedAt).slice().sort(uncleSort);
  const bal = { bank: 0, cash: 0, delivered: 0, returned: 0, received: 0 };
  const rows = list.map((tx) => {
    const counted = uncleCounts(tx);
    const e = uncleEffect(tx);
    if (counted) for (const k in bal) bal[k] += e[k];
    return { tx, counted, effect: e, after: { ...bal, held: bal.bank + bal.cash }, heldDelta: counted ? e.bank + e.cash : 0 };
  });
  return { rows, totals: { ...bal, held: bal.bank + bal.cash } };
}
export function newUncle(f, at = nowISO()) {
  const tx = normalizeUncle({
    id: uid("un"), kind: "uncle", datetime: f.datetime, amount: f.amount, type: f.type, person: (f.person || "").trim(),
    description: (f.description || "").trim(), method: f.method || "", notes: f.notes || "", status: f.status || "completed",
    from: f.from, to: f.to, adjDir: f.adjDir, deletedAt: null, createdAt: at, updatedAt: at, audit: [],
  });
  tx.audit = [{ at, text: `Recorded: ${uncleTitle(tx)} ${fmt(tx.amount)}${tx.status !== "completed" ? ` (${tx.status})` : ""}.` }];
  return tx;
}
export function validateUncle(f) {
  const errs = [];
  if (!UNCLE_TYPES[f.type]) errs.push("Choose a transaction type.");
  if (!Number.isInteger(f.amount) || f.amount <= 0) errs.push("Enter an amount greater than $0.");
  if (!f.datetime) errs.push("Choose a date and time.");
  if ((f.type === "sent" || f.type === "cash_given") && !(f.person || "").trim()) errs.push("Who received the money?");
  return errs;
}
export function editUncle(tx, f, at = nowISO()) {
  const n = normalizeUncle({ ...tx, ...f });
  const ch = [];
  if (tx.amount !== n.amount) ch.push(`amount ${fmt(tx.amount)} → ${fmt(n.amount)}`);
  if (tx.type !== n.type) ch.push(`type ${UNCLE_TYPES[tx.type].short} → ${UNCLE_TYPES[n.type].short}`);
  if (tx.status !== n.status) ch.push(`status ${tx.status} → ${n.status}`);
  if (tx.person !== n.person) ch.push(`person “${tx.person || "—"}” → “${n.person || "—"}”`);
  if (tx.datetime !== n.datetime) ch.push("date/time");
  if (tx.from !== n.from || tx.to !== n.to || tx.adjDir !== n.adjDir) ch.push("location");
  if (tx.description !== n.description || tx.notes !== n.notes || tx.method !== n.method) ch.push("details");
  return ch.length ? withAudit(n, `Edited: ${ch.join("; ")}.`, at) : n;
}
export function uncleTitle(tx) {
  const p = tx.person ? ` ${tx.person}` : "";
  switch (tx.type) {
    case "received": return `Received from uncle${tx.to === "cash" ? " (cash)" : ""}`;
    case "sent": return `Sent to${p || " someone"}`;
    case "cash_given": return `Gave cash to${p || " someone"}`;
    case "returned": return "Returned to uncle";
    case "withdrawn": return "Withdrew cash from bank";
    case "move": return tx.from === "cash" ? "Deposited cash into bank" : "Moved bank money to cash";
    case "adjustment": return `Correction (${tx.adjDir === -1 ? "−" : "+"} ${LOCATIONS[tx.from].toLowerCase()})`;
  }
  return "Uncle transaction";
}

// ---------- quick-entry parser (suggestions only; never applied without confirmation) ----------
const STOP = new Set("hold keep send give take pay me him her them it deposit put save the bank cash my his a an and so for to of out back unc uncle auntie's".split(" "));
export function parseUncleText(text, datetime) {
  const raw = text || "";
  const s = raw.toLowerCase();
  const notes = [];
  const m = raw.match(/\$?\s?(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?/i);
  const amount = m ? parseMoney(m[1] + (m[2] ? "k" : "")) : null;
  if (!amount) notes.push("I didn’t find an amount. Enter it below.");
  let person = "";
  const pm = raw.match(/\b(?:to|for)\s+([A-Za-z][A-Za-z'’\-]*)(\s+[A-Z][A-Za-z'’\-]*)?/g) || [];
  for (const chunk of pm) {
    const w = chunk.replace(/^(to|for)\s+/i, "").trim();
    const first = w.split(/\s+/)[0].toLowerCase();
    if (!STOP.has(first)) { person = w.replace(/\b\w/g, (c) => c.toUpperCase()); break; }
  }
  const isReturn = /\b(gave|give|paid|pay|sent|send|handed|hand)\s+(it\s+|him\s+|unc\s+|uncle\s+|his money\s+)?(it\s+)?back\b|\breturn(ed)?\b/.test(s);
  const isReceive = !isReturn && (/\b(gave|give|handed|sent|send|transferred|zelled)\s+me\b/.test(s) || /\breceived\b|\bgot\b.*\bfrom\b/.test(s));
  const isWithdraw = /\b(take|took|pull|pulled|get|got)\s+(it\s+)?out\b|\bwithdr[ae]w/.test(s);
  const isSend = /\bsen[dt]\b|\bzelle|\bcash ?app\b|\bvenmo\b|\bwire\b|\bwired\b|\bmail(ed)?\b/.test(s);
  const isGive = /\b(give|gave|hand|handed)\b/.test(s) && !/\b(gave|give|handed)\s+me\b/.test(s);
  const method = /zelle/.test(s) ? "Zelle" : /cash ?app/.test(s) ? "Cash App" : /venmo/.test(s) ? "Venmo" : /wire/.test(s) ? "Wire" : "";
  const base = { amount, datetime, description: raw.trim(), status: "completed" };
  const out = [];
  if (isReturn) {
    out.push({ ...base, type: "returned", from: /cash/.test(s) ? "cash" : "bank", method: method || (/cash/.test(s) ? "Cash" : "") });
    notes.push("Returning money to your uncle lowers what you hold.");
  } else if (isReceive) {
    out.push({ ...base, type: "received", to: /cash/.test(s) ? "cash" : "bank", method: method || (/cash/.test(s) ? "Cash" : "") });
    notes.push("Check where you’re keeping it: bank account or cash on hand.");
  } else if (isWithdraw && (isSend || isGive) && person) {
    out.push({ ...base, type: "withdrawn", description: `Cash withdrawal for ${person}`, method: "Cash" });
    out.push({ ...base, type: "cash_given", person, method: "Cash" });
    notes.push(`I split this into two entries: a cash withdrawal (doesn’t change what you hold) and cash given to ${person} (lowers it). Change the second one if you sent it another way.`);
  } else if (isWithdraw) {
    out.push({ ...base, type: "withdrawn", method: "Cash" });
    notes.push("A cash withdrawal only moves his money from the bank to cash. The total you hold stays the same.");
  } else if (isSend) {
    out.push({ ...base, type: "sent", person, from: "bank", method: method || "Bank transfer" });
    if (/\btold me to|\bwants me to|\bask(ed)? me to/.test(s)) notes.push("This sounds like an instruction. If you haven’t sent it yet, set the status to Pending so it doesn’t change the balance.");
  } else if (isGive) {
    out.push({ ...base, type: "cash_given", person, method: "Cash" });
  } else {
    out.push({ ...base, type: "", person });
    notes.push("I couldn’t tell what kind of transaction this is. Pick a type below.");
  }
  if (out.some((o) => (o.type === "sent" || o.type === "cash_given") && !o.person)) notes.push("I didn’t catch who got the money. Add their name.");
  return { suggestions: out, notes };
}

// ---------- dates & periods ----------
export function addDays(dStr, n) { const d = new Date(dStr + "T12:00:00"); d.setDate(d.getDate() + n); return localDate(d); }
export function periodRange(key, custom = {}, today = todayStr()) {
  const d = new Date(today + "T12:00:00");
  if (key === "week") { const dow = (d.getDay() + 6) % 7; return { start: addDays(today, -dow), end: addDays(today, 6 - dow), label: "This week" }; }
  if (key === "month") { const s = today.slice(0, 8) + "01"; return { start: s, end: monthEnd(s), label: monthLabel(s) }; }
  if (key === "last") { const p = new Date(d.getFullYear(), d.getMonth() - 1, 1); const s = localDate(p); return { start: s, end: monthEnd(s), label: monthLabel(s) }; }
  if (key === "all") return { start: "0000-01-01", end: "9999-12-31", label: "All time" };
  const start = custom.start || today, end = custom.end || today;
  return start <= end ? { start, end, label: `${shortDate(start)} – ${shortDate(end)}` } : { start: end, end: start, label: `${shortDate(end)} – ${shortDate(start)}` };
}
export function monthEnd(firstStr) { const d = new Date(firstStr + "T12:00:00"); return localDate(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); }
export function monthLabel(s) { return new Date(s.slice(0, 7) + "-15T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
export function shortDate(s) { if (!s) return ""; return new Date(s.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
export function longDate(s) { if (!s) return ""; return new Date(s.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
export const inRange = (dStr, r) => !!dStr && dStr.slice(0, 10) >= r.start && dStr.slice(0, 10) <= r.end;
/** Date part of an ISO timestamp in local time. */
export const isoToLocalDate = (iso) => (iso ? localDate(new Date(iso)) : "");

// ---------- summaries ----------
export function allPayments(transfers) {
  const out = [];
  transfers.filter((t) => !t.deletedAt).forEach((t) => t.splits.forEach((s) => (s.payments || []).forEach((p) => out.push({ ...p, split: s, transfer: t }))));
  return out;
}
export function summarize(records, range) {
  const transfers = records.filter((r) => r.kind === "transfer" && !r.deletedAt);
  const uncle = records.filter((r) => r.kind === "uncle");
  const inP = transfers.filter((t) => inRange(t.date, range));
  const pays = allPayments(transfers);
  const paysP = pays.filter((p) => inRange(p.date, range));
  const now = transfers.reduce((a, t) => { const s = transferStats(t); a.reserved += s.reserved; a.unassigned += s.unassigned; a.allocated += s.allocated; a.paid += s.paid; a.moved += t.amount; return a; }, { reserved: 0, unassigned: 0, allocated: 0, paid: 0, moved: 0 });
  const per = inP.reduce((a, t) => { const s = transferStats(t); a.reserved += s.reserved; a.unassigned += s.unassigned; a.allocated += s.allocated; return a; }, { reserved: 0, unassigned: 0, allocated: 0 });
  const byCat = {};
  CATEGORIES.forEach((c) => (byCat[c.id] = { paid: 0, reserved: 0 }));
  paysP.forEach((p) => (byCat[p.split.category] || byCat.other).paid += p.amount);
  inP.forEach((t) => t.splits.forEach((s) => ((byCat[s.category] || byCat.other).reserved += splitRemaining(s))));
  const ul = uncleLedger(uncle);
  const uP = { received: 0, delivered: 0, returned: 0, count: 0 };
  ul.rows.forEach((r) => { if (r.counted && inRange(isoToLocalDate(r.tx.datetime) || r.tx.datetime, range)) { uP.received += r.effect.received; uP.delivered += r.effect.delivered; uP.returned += r.effect.returned; uP.count++; } });
  return {
    period: {
      transferred: sum(inP, (t) => t.amount), transfers: inP.length, billsPaid: sum(paysP, (p) => p.amount), payments: paysP.length,
      reserved: per.reserved, unassigned: per.unassigned, allocated: per.allocated,
      completed: transfers.filter((t) => t.completedAt && inRange(isoToLocalDate(t.completedAt), range)).length,
      uncle: uP, byCat,
    },
    now: { ...now, active: transfers.filter((t) => t.status === "active").length, uncle: ul.totals },
  };
}
export function monthlySeries(records, months = 6, today = todayStr()) {
  const d = new Date(today + "T12:00:00");
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const s = localDate(new Date(d.getFullYear(), d.getMonth() - i, 1, 12));
    const r = { start: s, end: monthEnd(s) };
    const sm = summarize(records, r);
    out.push({ key: s.slice(0, 7), label: new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short" }), moved: sm.period.transferred, paid: sm.period.billsPaid, uncleIn: sm.period.uncle.received, uncleOut: sm.period.uncle.delivered + sm.period.uncle.returned });
  }
  return out;
}
export function outstandingBills(records, today = todayStr()) {
  const out = [];
  records.filter((r) => r.kind === "transfer" && !r.deletedAt).forEach((t) => t.splits.forEach((s) => {
    const rem = splitRemaining(s);
    if (rem > 0) out.push({ transfer: t, split: s, remaining: rem, overdue: !!s.dueDate && s.dueDate < today });
  }));
  return out.sort((a, b) => (a.split.dueDate || "9999").localeCompare(b.split.dueDate || "9999"));
}

// ---------- unified history ----------
const CAPONE = /capital\s*one|cap\s*one|capone/i, AMEX = /amex|american\s*express/i;
export function buildEvents(records, { includeDeleted = false } = {}) {
  const ev = [];
  records.forEach((r) => {
    if (r.deletedAt && !includeDeleted) return;
    if (r.kind === "transfer") {
      const st = transferStats(r);
      ev.push({ id: r.id + ":t", date: r.date, ts: r.createdAt, ref: r.id, owner: "me", type: "transfer", typeLabel: "Transfer",
        title: `Moved ${fmt(r.amount)} to ${ACCOUNTS[r.to]}`, sub: r.note || (r.splits.length ? r.splits.map((s) => s.name).join(", ") : "No splits yet"),
        amount: r.amount, signed: 0, account: `${ACCOUNTS[r.from]} → ${ACCOUNTS[r.to]}`, category: "Internal transfer",
        status: r.deletedAt ? "In trash" : r.status === "active" ? (st.unassigned > 0 ? "Active · unassigned" : "Active") : r.status === "completed" ? "Completed" : "Archived",
        tags: ["mine", "transfers", ...r.splits.flatMap((s) => (CAPONE.test(s.name) ? ["capone"] : AMEX.test(s.name) ? ["amex"] : []))],
        text: [r.note, ...r.splits.map((s) => s.name + " " + (s.notes || ""))].join(" ") });
      r.splits.forEach((s) => (s.payments || []).forEach((p) => {
        const paid = splitPaid(s);
        ev.push({ id: p.id, date: p.date, ts: p.at, ref: r.id, owner: "me", type: "payment", typeLabel: "Bill payment",
          title: `Paid ${s.name}`, sub: paid < s.amount ? `Partial · ${fmt(paid)} of ${fmt(s.amount)}` : catLabel(s.category),
          amount: p.amount, signed: -p.amount, account: ACCOUNTS[r.to], category: catLabel(s.category), status: s.status === "canceled" ? "Bill canceled" : "Paid",
          tags: ["mine", "payments", "bills", ...(CAPONE.test(s.name) ? ["capone"] : []), ...(AMEX.test(s.name) ? ["amex"] : [])], text: s.name + " " + (s.notes || "") });
      }));
      if (r.completedAt) ev.push({ id: r.id + ":c", date: isoToLocalDate(r.completedAt), ts: r.completedAt, ref: r.id, owner: "me", type: "status", typeLabel: "Status",
        title: `Transfer completed`, sub: `${fmt(r.amount)} from ${r.date}`, amount: 0, signed: 0, account: ACCOUNTS[r.to], category: "Status update",
        status: r.status === "archived" ? "Archived" : "Completed", tags: ["mine", "transfers"], text: r.note || "" });
    } else if (r.kind === "uncle") {
      const e = uncleEffect(r);
      ev.push({ id: r.id, date: isoToLocalDate(r.datetime), ts: r.datetime, ref: r.id, owner: "uncle", type: "uncle_" + r.type, typeLabel: UNCLE_TYPES[r.type].short,
        title: uncleTitle(r), sub: r.description || r.method || "", amount: r.amount, signed: e.bank + e.cash,
        account: r.type === "withdrawn" || r.type === "move" ? `${LOCATIONS[r.from]} → ${LOCATIONS[r.to]}` : LOCATIONS[r.from || r.to] || "",
        category: "Uncle’s money", status: r.deletedAt ? "In trash" : r.status === "completed" ? "Completed" : r.status === "pending" ? "Pending" : "Voided",
        tags: ["uncle", ...(r.type === "withdrawn" ? ["withdrawals"] : [])], text: [r.person, r.description, r.notes, r.method].join(" ") });
    }
  });
  return ev.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.ts || "").localeCompare(a.ts || ""));
}

// ---------- backup ----------
export const BACKUP_APP = "money-command-center";
export function makeBackup(records, settings) {
  return { app: BACKUP_APP, version: 1, exportedAt: nowISO(), currency: "USD", amountsIn: "integer cents", settings: settings || {}, records };
}
function validRecord(r) {
  if (!r || typeof r.id !== "string" || !Number.isInteger(r.amount)) return false;
  if (r.kind === "transfer") return Array.isArray(r.splits) && r.splits.every((s) => typeof s.id === "string" && Number.isInteger(s.amount) && Array.isArray(s.payments || []));
  if (r.kind === "uncle") return !!UNCLE_TYPES[r.type];
  return false;
}
/** Merge a backup into existing records by id. Never duplicates. */
export function mergeBackup(existing, backup) {
  if (!backup || backup.app !== BACKUP_APP || !Array.isArray(backup.records)) throw new Error("This file isn’t a Money Command Center backup.");
  const map = new Map(existing.map((r) => [r.id, r]));
  let added = 0, updated = 0, unchanged = 0, invalid = 0;
  const changed = [];
  const seen = new Set();
  backup.records.forEach((r) => {
    if (!validRecord(r) || seen.has(r.id)) { invalid++; return; }
    seen.add(r.id);
    const cur = map.get(r.id);
    if (!cur) { map.set(r.id, r); changed.push(r); added++; }
    else if ((r.updatedAt || "") > (cur.updatedAt || "")) { map.set(r.id, r); changed.push(r); updated++; }
    else unchanged++;
  });
  return { records: [...map.values()], changed, added, updated, unchanged, invalid };
}
export function toCSV(events) {
  const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ["Date", "Description", "Details", "Amount", "Account", "Category", "Type", "Status", "Whose money"];
  const rows = events.map((e) => [e.date, e.title, e.sub, (e.amount / 100).toFixed(2), e.account, e.category, e.typeLabel, e.status, e.owner === "uncle" ? "Uncle" : "Mine"]);
  return [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
