import * as L from "./logic.js";
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { fmt, parseMoney, centsToInput, CATEGORIES, catLabel, ACCOUNTS, UNCLE_TYPES, LOCATIONS, METHODS } = L;

// ---------------- icons ----------------
const P = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z",
  split: "M4 7h13l-3-3M20 17H7l3 3",
  uncle: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  history: "M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z",
  plus: "M12 5v14M5 12h14",
  gear: "M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4",
  check: "M5 12.5l4.5 4.5L19 7",
  chev: "M9 6l6 6-6 6",
  x: "M6 6l12 12M18 6 6 18",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  upload: "M12 16V5m0 0-4 4m4-4 4 4M5 20h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  archive: "M4 9h16v11H4zM3 4h18v5H3zM10 13h4",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  cloud: "M7 18a5 5 0 1 1 .8-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  cash: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4",
  bank: "M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  swap: "M8 4v16m0 0-3-3m3 3 3-3M16 20V4m0 0-3 3m3-3 3 3",
  report: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
};
const Icon = ({ n, s = 20, w = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
);
const Money = ({ c, sign, className = "" }) => <span className={"money " + className}>{fmt(c, { sign })}</span>;
const cx = (...a) => a.filter(Boolean).join(" ");

const CAT_COLOR = { credit: 1, rent: 2, utilities: 3, household: 4, phone: 5, insurance: 6, auto: 7, loan: 8, other: 0 };
const catVar = (id) => `var(--cat-${CAT_COLOR[id] ?? 0})`;

const nowLocalDT = () => { const d = new Date(); d.setSeconds(0, 0); return L.localDate(d) + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const dtLabel = (dt) => { if (!dt) return ""; const d = new Date(dt); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); };
const tsLabel = (iso) => { const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); };
// Inside claude.ai the page gets platform capabilities; on a normal website (e.g. Netlify) it runs standalone.
const IN_CLAUDE = typeof window !== "undefined" && !!(window.claude && typeof window.claude.use === "function");
const BACKUP_NAG_DAYS = 7;
function blobDownload(filename, text) {
  const type = filename.endsWith(".csv") ? "text/csv" : "application/json";
  const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const daysSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : Infinity);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };

// ---------------- storage ----------------
// cloud: claude `db` capability, private per-person subtree, sharded by creation year.
// local: browser localStorage. memory: nothing persists.
const LS_RECORDS = "mcc.records.v1", LS_SETTINGS = "mcc.settings.v1";
const shardOf = (r) => "s" + (/^\d{4}/.test(r.createdAt || "") ? r.createdAt.slice(0, 4) : "0000");

function useStore() {
  const [mode, setMode] = useState("loading");
  const [records, setRecords] = useState({});
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(0);
  const [saveError, setSaveError] = useState("");
  const api = useRef(null);
  const recRef = useRef({});
  recRef.current = records;

  useEffect(() => {
    let dead = false;
    const unsubs = [];
    const startLocal = () => {
      let recs = {}, st = {}, okRead = true;
      try {
        const raw = localStorage.getItem(LS_RECORDS);
        if (raw) JSON.parse(raw).forEach((r) => (recs[r.id] = r));
        const s = localStorage.getItem(LS_SETTINGS);
        if (s) st = JSON.parse(s);
        localStorage.setItem("mcc.probe", "1");
      } catch { okRead = false; }
      const m = okRead ? "local" : "memory";
      let cur = recs;
      api.current = {
        put(list) { list.forEach((r) => (cur = { ...cur, [r.id]: r })); if (m === "local" && !lsSet(LS_RECORDS, JSON.stringify(Object.values(cur)))) { setSaveError("This browser refused to save. Export a backup now."); setMode("memory"); } },
        remove(ids) { cur = { ...cur }; ids.forEach((id) => delete cur[id]); if (m === "local") lsSet(LS_RECORDS, JSON.stringify(Object.values(cur))); },
        saveSettings(s) { if (m === "local") lsSet(LS_SETTINGS, JSON.stringify(s)); },
      };
      if (m === "local") { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {} }
      setRecords(recs); setSettings(st); setMode(m);
    };
    (async () => {
      const c = window.claude;
      if (!c || typeof c.use !== "function") return startLocal();
      let db = null, user = null, id = null;
      try { [db, user] = await Promise.all([c.use("db"), c.use("user")]); id = user ? await user.id() : null; } catch { db = null; }
      if (dead) return;
      if (!db || !id) return startLocal();
      const base = `data/users/${id}`;
      const settingsRef = db.doc(base + "/settings");
      const dirty = new Map(); // id -> count of queued/in-flight writes
      const queue = new Map(); // path -> {op, data, rid}
      const busy = new Set();
      const subscribed = new Set();
      const shardData = {}; // shard -> Set(ids)
      let knownShards = [];
      let cur = {};
      const pump = async (path) => {
        if (busy.has(path) || !queue.has(path)) return;
        const job = queue.get(path); queue.delete(path); busy.add(path); setSaving((n) => n + 1);
        const run = () => (job.op === "set" ? db.doc(path).set(job.data) : db.doc(path).delete());
        try { await run(); setSaveError(""); }
        catch (e) {
          if (e && e.code === "unavailable") { try { await new Promise((r) => setTimeout(r, 600 + Math.random() * 800)); await run(); setSaveError(""); } catch (e2) { setSaveError("Couldn’t save a change. Check your connection and export a backup."); } }
          else if (e && e.code === "quota_exceeded") setSaveError("Storage is full. Export a backup, then empty the Trash.");
          else setSaveError("Couldn’t save a change (" + ((e && e.code) || "error") + "). Export a backup to be safe.");
        } finally {
          busy.delete(path); setSaving((n) => n - 1);
          if (job.rid) { const n = (dirty.get(job.rid) || 1) - 1; n <= 0 ? dirty.delete(job.rid) : dirty.set(job.rid, n); }
          pump(path);
        }
      };
      const enqueue = (path, op, data, rid) => {
        if (rid) dirty.set(rid, (dirty.get(rid) || 0) + 1);
        if (queue.has(path) && queue.get(path).rid) { const n = (dirty.get(rid) || 1) - 1; n <= 0 ? dirty.delete(rid) : dirty.set(rid, n); }
        queue.set(path, { op, data, rid }); pump(path);
      };
      let settingsCur = {};
      const writeSettings = (s) => { settingsCur = s; enqueue(base + "/settings", "set", s); };
      const subShard = (sh) => {
        if (subscribed.has(sh)) return; subscribed.add(sh);
        shardData[sh] = new Set();
        const col = db.doc(`${base}/${sh}`).collection("records").limit(1000);
        unsubs.push(col.onSnapshot((snap) => {
          const ids = new Set();
          let next = { ...recRef.current };
          snap.docs.forEach((d) => { const r = d.data(); if (!r || !r.id) return; ids.add(r.id); if (!dirty.has(r.id)) next[r.id] = r; });
          shardData[sh].forEach((rid) => { if (!ids.has(rid) && !dirty.has(rid)) delete next[rid]; });
          shardData[sh] = ids;
          cur = next; setRecords(next);
        }, () => setSaveError("Lost the live connection to storage. Reload the page; export a backup if changes are missing.")));
      };
      api.current = {
        put(list) {
          let s = settingsCur;
          list.forEach((r) => {
            cur = { ...cur, [r.id]: r };
            const sh = shardOf(r);
            if (!knownShards.includes(sh)) { knownShards = [...knownShards, sh]; s = { ...s, shards: knownShards }; }
            subShard(sh);
            enqueue(`${base}/${sh}/records/${r.id}`, "set", JSON.parse(JSON.stringify(r)), r.id);
          });
          if (s !== settingsCur) writeSettings(s);
        },
        remove(ids) { ids.forEach((rid) => { const r = cur[rid] || recRef.current[rid]; if (!r) return; const n = { ...cur }; delete n[rid]; cur = n; enqueue(`${base}/${shardOf(r)}/records/${rid}`, "delete", null, rid); }); },
        saveSettings(s) { writeSettings({ ...s, shards: knownShards }); },
      };
      let first = true;
      unsubs.push(settingsRef.onSnapshot((snap) => {
        const s = snap.exists ? snap.data() : {};
        settingsCur = s;
        (s.shards || []).forEach((sh) => { if (!knownShards.includes(sh)) knownShards = [...knownShards, sh]; subShard(sh); });
        setSettings(s);
        if (first) { first = false; setMode("cloud"); }
      }, () => { if (first) { first = false; startLocal(); } }));
    })();
    return () => { dead = true; unsubs.forEach((u) => u()); };
  }, []);

  const put = useCallback((list) => { setRecords((r) => { const n = { ...r }; list.forEach((x) => (n[x.id] = x)); return n; }); api.current && api.current.put(list); }, []);
  const remove = useCallback((ids) => { setRecords((r) => { const n = { ...r }; ids.forEach((id) => delete n[id]); return n; }); api.current && api.current.remove(ids); }, []);
  const saveSettings = useCallback((s) => { setSettings(s); api.current && api.current.saveSettings(s); }, []);
  return { mode, records, settings, put, remove, saveSettings, saving, saveError };
}

// ---------------- demo data ----------------
function buildDemo() {
  const T = L.todayStr();
  const d = (n) => L.addDays(T, n);
  const at = (n, h = 10) => new Date(d(n) + `T${String(h).padStart(2, "0")}:15:00`).toISOString();
  const recs = [];
  let t1 = L.newTransfer({ amount: 120000, date: d(-34), note: "Rent for the month", splits: [{ name: "Rent", amount: 120000, category: "rent", dueDate: d(-30) }] }, at(-34));
  t1 = L.markSplitPaid(t1, t1.splits[0].id, d(-31), at(-31)); recs.push(t1);
  let t2 = L.newTransfer({ amount: 25000, date: d(-25), note: "Utilities + phone", splits: [
    { name: "Electric", amount: 12000, category: "utilities" }, { name: "Phone", amount: 8000, category: "phone" }, { name: "Car insurance", amount: 5000, category: "insurance" }] }, at(-25));
  t2 = L.markSplitPaid(t2, t2.splits[0].id, d(-22), at(-22)); t2 = L.markSplitPaid(t2, t2.splits[1].id, d(-21), at(-21)); t2 = L.markSplitPaid(t2, t2.splits[2].id, d(-20), at(-20));
  t2 = L.archiveTransfer(t2, at(-18)); recs.push(t2);
  let t3 = L.newTransfer({ amount: 30000, date: d(-6), note: "Cards and house stuff", splits: [
    { name: "Capital One credit card", amount: 10000, category: "credit", dueDate: d(2) }, { name: "Household bills", amount: 10000, category: "household", dueDate: d(4) }, { name: "American Express", amount: 10000, category: "credit", dueDate: d(9) }] }, at(-6));
  t3 = L.markSplitPaid(t3, t3.splits[0].id, d(-5), at(-5)); recs.push(t3);
  let t4 = L.newTransfer({ amount: 50000, date: d(-2), note: "Next rent, part one", splits: [{ name: "Rent", amount: 40000, category: "rent", dueDate: d(8) }] }, at(-2)); recs.push(t4);
  let t5 = L.newTransfer({ amount: 15000, date: d(-1), splits: [{ name: "Amex minimum + extra", amount: 15000, category: "credit", dueDate: d(12) }] }, at(-1));
  t5 = L.addPartialPayment(t5, t5.splits[0].id, 6000, d(-1), at(-1, 15)); recs.push(t5);
  const u = (n, h, f) => recs.push(L.newUncle({ datetime: `${d(n)}T${String(h).padStart(2, "0")}:00`, ...f }, at(n, h)));
  u(-15, 18, { amount: 200000, type: "received", to: "bank", description: "Unc gave me $2,000 to hold", method: "Cash" });
  u(-12, 11, { amount: 100000, type: "withdrawn", description: "Took out cash for Auntie", method: "Cash" });
  u(-12, 13, { amount: 100000, type: "cash_given", person: "Auntie", description: "Unc made me take out $1,000 to send to Auntie", method: "Cash" });
  u(-4, 19, { amount: 50000, type: "received", to: "bank", description: "Unc gave me another $500", method: "Zelle" });
  u(-1, 9, { amount: 25000, type: "sent", from: "bank", person: "John", description: "Unc told me to send $250 to John", method: "Zelle" });
  u(0, 8, { amount: 10000, type: "sent", from: "bank", person: "Auntie", description: "Unc told me to send 100 to Auntie", method: "Zelle", status: "pending" });
  return Object.fromEntries(recs.map((r) => [r.id, r]));
}

// ---------------- generic UI ----------------
function Sheet({ title, sub, onClose, children, footer, tall }) {
  const ref = useRef(null);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); ref.current && ref.current.focus(); return () => window.removeEventListener("keydown", k); }, []);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("sheet", tall && "tall")} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="sheet-head">
          <div className="grab" aria-hidden="true" />
          <div className="sheet-title-row">
            <div><h2>{title}</h2>{sub && <p className="muted small">{sub}</p>}</div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon n="x" /></button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}
function Confirm({ title, body, confirmLabel = "Confirm", danger, onConfirm, onClose }) {
  return (
    <Sheet title={title} onClose={onClose} footer={<div className="row gap"><button className="btn ghost grow" onClick={onClose}>Keep it</button><button className={cx("btn grow", danger ? "danger" : "primary")} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button></div>}>
      <div className="confirm-body">{body}</div>
    </Sheet>
  );
}
const Field = ({ label, hint, error, children, htmlFor }) => (
  <div className={cx("field", error && "has-error")}>
    {label && <label htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && !error && <div className="hint">{hint}</div>}
    {error && <div className="err-text">{error}</div>}
  </div>
);
function MoneyInput({ id, value, onChange, placeholder = "0.00", big, autoFocus }) {
  return (
    <div className={cx("money-input", big && "big")}>
      <span aria-hidden="true">$</span>
      <input id={id} inputMode="decimal" autoComplete="off" placeholder={placeholder} value={value} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))} />
    </div>
  );
}
function Seg({ options, value, onChange, small, label }) {
  return (
    <div className={cx("seg", small && "small")} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} role="tab" aria-selected={value === o.v} className={cx(value === o.v && "on")} onClick={() => onChange(o.v)}>
          {o.l}{o.n != null && <span className="seg-n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}
const Pill = ({ tone = "neutral", children }) => <span className={"pill " + tone}>{children}</span>;
const statusTone = (s) => (s === "completed" ? "good" : s === "archived" ? "neutral" : "accent");
const statusText = (t) => (t.deletedAt ? "In trash" : t.status === "completed" ? "Completed" : t.status === "archived" ? "Archived" : "Active");

function ProgressBar({ t, st }) {
  const W = t.amount || 1;
  const p = (x) => Math.max(0, (x / W) * 100) + "%";
  return (
    <div className="pbar" role="img" aria-label={`${fmt(st.paid)} paid, ${fmt(st.reserved)} reserved, ${fmt(Math.max(0, st.unassigned))} unassigned`}>
      <span className="pb-paid" style={{ width: p(st.paid) }} />
      <span className="pb-res" style={{ width: p(st.reserved) }} />
      <span className="pb-un" style={{ width: p(Math.max(0, st.unassigned)) }} />
    </div>
  );
}
function Empty({ icon, title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon n={icon} s={26} /></div>
      <h3>{title}</h3>
      {body && <p className="muted">{body}</p>}
      {action}
    </div>
  );
}

function PeriodPicker({ period, setPeriod }) {
  return (
    <div className="period">
      <Seg small label="Time period" value={period.key} onChange={(k) => setPeriod({ ...period, key: k })}
        options={[{ v: "week", l: "Week" }, { v: "month", l: "This month" }, { v: "last", l: "Last month" }, { v: "custom", l: "Custom" }]} />
      {period.key === "custom" && (
        <div className="row gap custom-range">
          <Field label="From" htmlFor="pf"><input id="pf" type="date" value={period.start || ""} onChange={(e) => setPeriod({ ...period, start: e.target.value })} /></Field>
          <Field label="To" htmlFor="pt"><input id="pt" type="date" value={period.end || ""} onChange={(e) => setPeriod({ ...period, end: e.target.value })} /></Field>
        </div>
      )}
    </div>
  );
}

// ---------------- Dashboard ----------------
function Dashboard({ data, ui }) {
  const { records, period, setPeriod } = data;
  const range = L.periodRange(period.key, period);
  const sm = useMemo(() => L.summarize(records, range), [records, range.start, range.end]);
  const due = useMemo(() => L.outstandingBills(records).slice(0, 4), [records]);
  const recent = useMemo(() => L.buildEvents(records).slice(0, 6), [records]);
  const inBills = sm.now.reserved + sm.now.unassigned;
  const cats = CATEGORIES.map((c) => ({ ...c, ...sm.period.byCat[c.id] })).filter((c) => c.paid + c.reserved > 0).sort((a, b) => b.paid + b.reserved - (a.paid + a.reserved));
  const catMax = Math.max(1, ...cats.map((c) => c.paid + c.reserved));
  return (
    <div className="stack">
      <section className="hero card">
        <div className="eyebrow">Sitting in Bills Checking right now</div>
        <div className="hero-num"><Money c={inBills} /></div>
        <div className="hero-split">
          <button className="hs" onClick={() => ui.go("bills")}>
            <span className="dot res" /> <span className="hs-l">Reserved for unpaid bills</span><Money c={sm.now.reserved} className="hs-v" />
          </button>
          <button className="hs" onClick={() => ui.go("bills")}>
            <span className="dot un" /> <span className="hs-l">Unassigned, free to plan</span><Money c={sm.now.unassigned} className="hs-v" />
          </button>
        </div>
        <div className="hero-foot">
          <span><b className="money">{sm.now.active}</b> active transfer{sm.now.active === 1 ? "" : "s"}</span>
          <span className="muted">·</span>
          <span><Money c={sm.now.paid} /> paid all time</span>
        </div>
      </section>

      <button className="uncle-strip card" onClick={() => ui.go("uncle")}>
        <div className="us-ic"><Icon n="lock" /></div>
        <div className="us-body">
          <div className="us-top"><span className="eyebrow uncle-ink">Uncle’s money held</span><Money c={sm.now.uncle.held} className="us-v" /></div>
          <div className="small muted">Not yours · Bank <Money c={sm.now.uncle.bank} /> · Cash <Money c={sm.now.uncle.cash} /></div>
        </div>
        <Icon n="chev" s={18} />
      </button>

      <div className="quick-row">
        <button className="btn primary grow" onClick={() => ui.open("transferForm", {})}><Icon n="plus" /> New transfer</button>
        <button className="btn uncle grow" onClick={() => ui.open("uncleQuick", {})}><Icon n="spark" /> Uncle entry</button>
      </div>

      <section className="card">
        <div className="card-head"><h3>Summary · {range.label}</h3></div>
        <PeriodPicker period={period} setPeriod={setPeriod} />
        <div className="kv-list">
          <KV k="Moved into Bills Checking" note="Between your own accounts. Not spending." v={sm.period.transferred} />
          <KV k="Allocated to bills" v={sm.period.allocated} />
          <KV k="Bills paid" note="Money actually spent." v={sm.period.billsPaid} strong />
          <KV k="Still reserved" note="From transfers in this period." v={sm.period.reserved} />
          <KV k="Still unassigned" v={sm.period.unassigned} />
          <KV k="Completed transfers" raw={sm.period.completed} />
          <div className="kv-sep" />
          <KV k="Uncle’s money received" v={sm.period.uncle.received} uncle />
          <KV k="Uncle’s money sent or given out" v={sm.period.uncle.delivered + sm.period.uncle.returned} uncle note={sm.period.uncle.returned ? `Includes ${fmt(sm.period.uncle.returned)} returned to him.` : null} />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Where the money is going</h3><span className="muted small">{range.label}</span></div>
        {cats.length === 0 ? <p className="muted small">No bills assigned or paid in this period yet.</p> : (
          <>
            <div className="legend"><span><i className="lg solid" /> Paid</span><span><i className="lg hatch" /> Reserved</span></div>
            <div className="catbars">
              {cats.map((c) => (
                <div className="catbar" key={c.id} title={`${c.label}: ${fmt(c.paid)} paid, ${fmt(c.reserved)} reserved`}>
                  <div className="cb-top"><span className="cb-name"><i className="sw" style={{ background: catVar(c.id) }} />{c.label}</span><Money c={c.paid + c.reserved} /></div>
                  <div className="cb-track">
                    {c.paid > 0 && <span className="cb-paid" style={{ width: (c.paid / catMax) * 100 + "%", background: catVar(c.id) }} />}
                    {c.reserved > 0 && <span className="cb-res" style={{ width: (c.reserved / catMax) * 100 + "%", color: catVar(c.id) }} />}
                  </div>
                  <div className="cb-sub muted small">{fmt(c.paid)} paid{c.reserved ? ` · ${fmt(c.reserved)} reserved` : ""}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h3>Coming up</h3><button className="link" onClick={() => ui.go("bills")}>All transfers</button></div>
        {due.length === 0 ? <p className="muted small">Nothing reserved. Every assigned bill is paid.</p> : due.map((b) => (
          <BillRow key={b.split.id} t={b.transfer} s={b.split} ui={ui} showTransfer />
        ))}
      </section>

      <section className="card">
        <div className="card-head"><h3>Recent activity</h3><button className="link" onClick={() => ui.go("history")}>History</button></div>
        {recent.length === 0 ? <p className="muted small">No activity yet.</p> : <div className="ev-list">{recent.map((e) => <EventRow key={e.id} e={e} ui={ui} />)}</div>}
      </section>
    </div>
  );
}
const KV = ({ k, v, raw, note, strong, uncle }) => (
  <div className={cx("kv", strong && "strong", uncle && "uncle-kv")}>
    <div><div className="kv-k">{k}</div>{note && <div className="kv-note">{note}</div>}</div>
    <div className="kv-v">{raw != null ? <span className="money">{raw}</span> : <Money c={v} />}</div>
  </div>
);

// ---------------- Bills ----------------
function BillRow({ t, s, ui, showTransfer }) {
  const st = L.splitState(s);
  const paid = L.splitPaid(s);
  const today = L.todayStr();
  const overdue = s.dueDate && s.dueDate < today && (st === "unpaid" || st === "partial");
  const toggle = () => {
    if (st === "canceled") return;
    if (st === "paid") ui.mutate(t.id, (x) => L.reverseSplitPayments(x, s.id), `Marked ${s.name} unpaid`);
    else ui.mutate(t.id, (x) => L.markSplitPaid(x, s.id, today), `Paid ${s.name} ${fmt(L.splitRemaining(s))}`);
  };
  return (
    <div className={cx("bill", st)}>
      <button className={cx("check", st)} onClick={toggle} disabled={st === "canceled"} aria-label={st === "paid" ? `Mark ${s.name} unpaid` : `Mark ${s.name} paid`} aria-pressed={st === "paid"}>
        {st === "paid" && <Icon n="check" s={18} w={2.6} />}
        {st === "partial" && <span className="half" />}
      </button>
      <button className="bill-main" onClick={() => ui.open("transferDetail", { id: t.id, focus: s.id })}>
        <div className="bill-name"><i className="sw" style={{ background: catVar(s.category) }} />{s.name}</div>
        <div className="bill-meta">
          {st === "paid" && <span>Paid {L.shortDate((s.payments || []).slice(-1)[0]?.date)}</span>}
          {st === "partial" && <span>{fmt(paid)} paid · {fmt(L.splitRemaining(s))} left</span>}
          {st === "canceled" && <span>Canceled{paid ? ` · ${fmt(paid)} was paid` : ""}</span>}
          {st === "unpaid" && <span>{catLabel(s.category)}</span>}
          {s.dueDate && st !== "paid" && st !== "canceled" && <span className={overdue ? "overdue" : ""}>{overdue ? "Overdue · " : "Due "}{L.shortDate(s.dueDate)}</span>}
          {showTransfer && <span>from {L.shortDate(t.date)} transfer</span>}
        </div>
      </button>
      <Money c={st === "canceled" ? paid : s.amount} className={cx("bill-amt", st === "canceled" && "strike")} />
    </div>
  );
}
function TransferCard({ t, ui }) {
  const st = L.transferStats(t);
  return (
    <article className={cx("card tcard", t.status)}>
      <button className="tc-head" onClick={() => ui.open("transferDetail", { id: t.id })}>
        <div className="grow">
          <div className="tc-meta">{L.longDate(t.date)} · {ACCOUNTS[t.from].split(" ")[0]} → {ACCOUNTS[t.to].split(" ")[0]}</div>
          <div className="tc-amt"><Money c={t.amount} /></div>
          {t.note && <div className="tc-note">{t.note}</div>}
        </div>
        <div className="tc-right">
          <Pill tone={statusTone(t.status)}>{statusText(t)}</Pill>
          <span className="tc-pct money">{st.pct}%</span>
        </div>
      </button>
      <ProgressBar t={t} st={st} />
      <div className="tc-stats">
        <span><i className="dot paid" /><Money c={st.paid} /> paid</span>
        <span><i className="dot res" /><Money c={st.reserved} /> reserved</span>
        {st.unassigned !== 0 && <span className={st.unassigned < 0 ? "neg" : ""}><i className="dot un" /><Money c={st.unassigned} /> unassigned</span>}
      </div>
      {t.splits.length > 0 && <div className="bills">{t.splits.map((s) => <BillRow key={s.id} t={t} s={s} ui={ui} />)}</div>}
      {t.splits.length === 0 && <p className="muted small pad-x">No bills assigned yet.</p>}
      {t.status === "active" && st.unassigned > 0 && (
        <button className="assign-btn" onClick={() => ui.open("splitForm", { id: t.id, amount: st.unassigned })}><Icon n="plus" s={16} /> Assign {fmt(st.unassigned)} to a bill</button>
      )}
      {t.holdOpen && <div className="note-bar">Reopened. Everything is paid. <button className="link" onClick={() => ui.mutate(t.id, L.markComplete, "Transfer marked complete")}>Mark complete</button></div>}
    </article>
  );
}
function Bills({ data, ui }) {
  const [view, setView] = useState("active");
  const transfers = data.transfers;
  const counts = { active: 0, completed: 0, archived: 0, all: 0 };
  transfers.forEach((t) => { if (t.deletedAt) return; counts[t.status]++; counts.all++; });
  const list = transfers.filter((t) => !t.deletedAt && (view === "all" || t.status === view)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const trash = transfers.filter((t) => t.deletedAt).length;
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Transfers & bills</h1><p className="muted small">Main Checking → Bills Checking, split by what each dollar is for.</p></div>
      </div>
      <button className="btn primary block" onClick={() => ui.open("transferForm", {})}><Icon n="plus" /> New transfer</button>
      <Seg label="Transfer status" value={view} onChange={setView} options={[{ v: "active", l: "Active", n: counts.active }, { v: "completed", l: "Completed", n: counts.completed }, { v: "archived", l: "Archived", n: counts.archived }, { v: "all", l: "All", n: counts.all }]} />
      {view === "completed" && list.length > 0 && <p className="muted small">Completed transfers left your Active list automatically when every bill was paid. They still count in summaries and reports.</p>}
      {list.length === 0 ? (
        view === "active" ? <Empty icon="split" title="No active transfers" body={counts.all ? "Everything is paid and closed out. Completed transfers are in the Completed tab." : "Record your first transfer from Main Checking to Bills Checking and split it into bills."} action={<button className="btn primary" onClick={() => ui.open("transferForm", {})}>New transfer</button>} />
          : <Empty icon="archive" title={`No ${view === "all" ? "" : view} transfers`} body="They’ll show up here." />
      ) : list.map((t) => <TransferCard key={t.id} t={t} ui={ui} />)}
      {trash > 0 && <button className="link center" onClick={() => ui.open("trash", {})}><Icon n="trash" s={16} /> Trash ({trash})</button>}
    </div>
  );
}

// ---------------- transfer form ----------------
function TransferForm({ id, data, ui, onClose }) {
  const existing = id ? data.byId[id] : null;
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amount) : "");
  const [date, setDate] = useState(existing ? existing.date : L.todayStr());
  const [from, setFrom] = useState(existing ? existing.from : "main");
  const [to, setTo] = useState(existing ? existing.to : "bills");
  const [note, setNote] = useState(existing ? existing.note || "" : "");
  const mk = () => ({ id: L.uid("sp"), name: "", amt: "", category: "other", dueDate: "", notes: "", status: "unpaid", payments: [], more: false, catTouched: false });
  const [splits, setSplits] = useState(existing ? existing.splits.map((s) => ({ ...s, amt: centsToInput(s.amount), more: !!(s.dueDate || s.notes), catTouched: true })) : [mk()]);
  const [tried, setTried] = useState(false);
  const names = useMemo(() => [...new Set(data.transfers.flatMap((t) => t.splits.map((s) => s.name)))].slice(0, 40), [data.transfers]);
  const cents = parseMoney(amount);
  const parsed = splits.filter((s) => s.name.trim() || s.amt).map((s) => ({ ...s, amount: parseMoney(s.amt) }));
  const errs = L.validateTransfer(cents ?? NaN, parsed);
  const allocated = L.sum(parsed, (s) => (Number.isInteger(s.amount) ? L.splitEffective(s) : 0));
  const left = (cents || 0) - allocated;
  const upd = (i, patch) => setSplits((a) => a.map((s, j) => {
    if (j !== i) return s;
    const n = { ...s, ...patch };
    if (patch.name != null && !s.catTouched) { const g = L.guessCategory(patch.name); if (g) n.category = g; }
    return n;
  }));
  const save = () => {
    setTried(true);
    if (errs.length) return;
    const clean = parsed.map(({ amt, more, catTouched, ...s }) => ({ ...s, name: s.name.trim() }));
    if (existing) {
      try { ui.mutate(existing.id, (t) => L.editTransfer(t, { amount: cents, date, note, from, to, splits: clean }), "Transfer updated"); onClose(); }
      catch (e) { ui.toast(e.message, "error"); }
    } else {
      const t = L.newTransfer({ amount: cents, date, from, to, note, splits: clean });
      ui.create([t], `Transfer of ${fmt(cents)} saved`); onClose();
    }
  };
  const meterTone = left < 0 ? "bad" : left === 0 && allocated > 0 ? "good" : "neutral";
  return (
    <Sheet tall title={existing ? "Edit transfer" : "New transfer"} sub={existing ? "Changes are logged in the transfer’s audit trail." : "Moving money between your own accounts isn’t spending."} onClose={onClose}
      footer={<>
        <div className={cx("meter", meterTone)}>
          <span>Allocated <Money c={allocated} /> of <Money c={cents || 0} /></span>
          <b>{left < 0 ? <>Over by <Money c={-left} /></> : <><Money c={left} /> unassigned</>}</b>
        </div>
        <button className="btn primary block" onClick={save} disabled={tried && errs.length > 0}>{existing ? "Save changes" : "Save transfer"}</button>
      </>}>
      <Field label="Transfer amount" htmlFor="tf-amt" error={tried && (!cents ? "Enter a transfer amount greater than $0." : null)}>
        <MoneyInput id="tf-amt" big value={amount} onChange={setAmount} autoFocus={!existing} />
      </Field>
      <div className="row gap">
        <Field label="Date" htmlFor="tf-date"><input id="tf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <div className="acct-row">
        <Field label="From" htmlFor="tf-from"><select id="tf-from" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value === to) setTo(from); }}>{Object.entries(ACCOUNTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <button className="icon-btn swap" aria-label="Swap accounts" onClick={() => { setFrom(to); setTo(from); }}><Icon n="swap" s={18} /></button>
        <Field label="To" htmlFor="tf-to"><select id="tf-to" value={to} onChange={(e) => { setTo(e.target.value); if (e.target.value === from) setFrom(to); }}>{Object.entries(ACCOUNTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </div>
      <Field label="What’s it for? (optional)" htmlFor="tf-note"><input id="tf-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Cards and house bills" /></Field>

      <div className="split-head">
        <h3>Split into bills</h3>
        <span className="muted small">Leave money unassigned if you haven’t decided yet.</span>
      </div>
      <datalist id="bill-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
      {splits.map((s, i) => {
        const paid = L.splitPaid(s);
        return (
          <div className={cx("split-edit", s.status === "canceled" && "canceled")} key={s.id}>
            <div className="se-row">
              <input aria-label={`Split ${i + 1} name`} list="bill-names" placeholder="Bill name, e.g. Capital One" value={s.name} onChange={(e) => upd(i, { name: e.target.value })} />
              <MoneyInput value={s.amt} onChange={(v) => upd(i, { amt: v })} />
            </div>
            <div className="se-row2">
              <select aria-label={`Split ${i + 1} category`} value={s.category} onChange={(e) => upd(i, { category: e.target.value, catTouched: true })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              {left > 0 && <button className="chip-btn" onClick={() => upd(i, { amt: centsToInput((parseMoney(s.amt) || 0) + left) })}>+ {fmt(left)}</button>}
              <button className="chip-btn" onClick={() => upd(i, { more: !s.more })}>{s.more ? "Less" : "Due date, notes"}</button>
              {paid > 0 ? <span className="tiny muted" title="Reverse or cancel it from the transfer view">{fmt(paid)} paid</span>
                : <button className="icon-btn sm" aria-label={`Remove split ${i + 1}`} onClick={() => setSplits((a) => a.filter((_, j) => j !== i))}><Icon n="x" s={16} /></button>}
            </div>
            {s.more && (
              <div className="se-more">
                <Field label="Due date" htmlFor={"dd" + s.id}><input id={"dd" + s.id} type="date" value={s.dueDate || ""} onChange={(e) => upd(i, { dueDate: e.target.value })} /></Field>
                <Field label="Notes" htmlFor={"nt" + s.id}><input id={"nt" + s.id} value={s.notes || ""} onChange={(e) => upd(i, { notes: e.target.value })} placeholder="Optional" /></Field>
              </div>
            )}
            {s.status === "canceled" && <div className="tiny muted">Canceled bill. Restore it from the transfer view.</div>}
          </div>
        );
      })}
      <button className="btn ghost block" onClick={() => setSplits((a) => [...a, mk()])}><Icon n="plus" /> Add another bill</button>
      {tried && errs.length > 0 && <div className="err-box" role="alert">{errs.map((e) => <div key={e}>{e}</div>)}</div>}
      {!tried && left < 0 && <div className="err-box" role="alert">{errs.find((e) => /more than/.test(e))}</div>}
    </Sheet>
  );
}

function SplitForm({ id, amount, reassign, data, ui, onClose }) {
  const t = data.byId[id];
  const from = reassign ? t.splits.find((s) => s.id === reassign) : null;
  const [name, setName] = useState("");
  const [amt, setAmt] = useState(centsToInput(amount));
  const [cat, setCat] = useState(from ? from.category : "other");
  const [touched, setTouched] = useState(false);
  const [due, setDue] = useState("");
  const [err, setErr] = useState("");
  if (!t) return null;
  const st = L.transferStats(t);
  const save = () => {
    const c = parseMoney(amt);
    if (!name.trim()) return setErr("Give the bill a name.");
    if (!c) return setErr("Enter an amount greater than $0.");
    try {
      ui.mutate(t.id, (x) => {
        let n = from ? L.cancelSplit(x, from.id) : x;
        return L.addSplit(n, { name, amount: c, category: cat, dueDate: due, reassignedFrom: from ? from.name : null });
      }, from ? `Reassigned ${fmt(c)} to ${name}` : `Assigned ${fmt(c)} to ${name}`);
      onClose();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Sheet title={from ? `Reassign ${from.name}` : "Assign money to a bill"} sub={from ? `${fmt(L.splitRemaining(from))} unpaid will move to the new bill. ${from.name} will be marked canceled.` : `${fmt(st.unassigned)} unassigned in this transfer.`} onClose={onClose}
      footer={<button className="btn primary block" onClick={save}>{from ? "Reassign" : "Assign"}</button>}>
      <Field label="Bill name" htmlFor="sf-n"><input id="sf-n" list="bill-names" value={name} autoFocus onChange={(e) => { setName(e.target.value); if (!touched) { const g = L.guessCategory(e.target.value); if (g) setCat(g); } }} placeholder="e.g. Electric" /></Field>
      <Field label="Amount" htmlFor="sf-a"><MoneyInput id="sf-a" value={amt} onChange={setAmt} /></Field>
      <div className="row gap">
        <Field label="Category" htmlFor="sf-c"><select id="sf-c" value={cat} onChange={(e) => { setCat(e.target.value); setTouched(true); }}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
        <Field label="Due date" htmlFor="sf-d"><input id="sf-d" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
      </div>
      {err && <div className="err-box" role="alert">{err}</div>}
    </Sheet>
  );
}

function PartialPay({ id, splitId, data, ui, onClose }) {
  const t = data.byId[id];
  const s = t && t.splits.find((x) => x.id === splitId);
  const [amt, setAmt] = useState("");
  const [date, setDate] = useState(L.todayStr());
  const [err, setErr] = useState("");
  if (!s) return null;
  const rem = L.splitRemaining(s);
  const save = () => {
    try { const c = parseMoney(amt); ui.mutate(t.id, (x) => L.addPartialPayment(x, s.id, c, date), `Recorded ${fmt(c)} payment to ${s.name}`); onClose(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <Sheet title={`Pay part of ${s.name}`} sub={`${fmt(rem)} still reserved for this bill.`} onClose={onClose} footer={<button className="btn primary block" onClick={save}>Record payment</button>}>
      <Field label="Amount paid" htmlFor="pp-a"><MoneyInput id="pp-a" big value={amt} onChange={setAmt} autoFocus /></Field>
      <Field label="Payment date" htmlFor="pp-d"><input id="pp-d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      {err && <div className="err-box" role="alert">{err}</div>}
    </Sheet>
  );
}

function PayDate({ id, splitId, data, ui, onClose }) {
  const t = data.byId[id]; const s = t && t.splits.find((x) => x.id === splitId);
  const [date, setDate] = useState(L.todayStr());
  if (!s) return null;
  return (
    <Sheet title={`Mark ${s.name} paid`} sub={`${fmt(L.splitRemaining(s))} will be recorded as paid.`} onClose={onClose}
      footer={<button className="btn primary block" onClick={() => { ui.mutate(t.id, (x) => L.markSplitPaid(x, s.id, date), `Paid ${s.name}`); onClose(); }}>Mark paid</button>}>
      <Field label="Payment date" htmlFor="pd-d"><input id="pd-d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    </Sheet>
  );
}

function Audit({ items }) {
  return (
    <div className="audit">
      {(items || []).slice().reverse().map((a, i) => (
        <div className="au" key={i}><span className="au-dot" /><div><div className="au-t">{a.text}</div><div className="tiny muted">{tsLabel(a.at)}</div></div></div>
      ))}
    </div>
  );
}

function TransferDetail({ id, focus, data, ui, onClose }) {
  const t = data.byId[id];
  const [open, setOpen] = useState(focus || null);
  if (!t) return <Sheet title="Transfer" onClose={onClose}><p className="muted">This transfer no longer exists.</p></Sheet>;
  const st = L.transferStats(t);
  const full = L.isFullyPaid(t);
  const act = (f, msg) => { try { ui.mutate(t.id, f, msg); } catch (e) { ui.toast(e.message, "error"); } };
  return (
    <Sheet tall title={`${fmt(t.amount)} transfer`} sub={`${L.longDate(t.date)} · ${ACCOUNTS[t.from]} → ${ACCOUNTS[t.to]}`} onClose={onClose}>
      <div className="row between"><Pill tone={t.deletedAt ? "bad" : statusTone(t.status)}>{statusText(t)}</Pill><span className="money big-pct">{st.pct}% paid</span></div>
      {t.note && <p className="detail-note">{t.note}</p>}
      <ProgressBar t={t} st={st} />
      <div className="mini-grid">
        <div><div className="tiny muted">Paid</div><Money c={st.paid} /></div>
        <div><div className="tiny muted">Reserved</div><Money c={st.reserved} /></div>
        <div><div className="tiny muted">Unassigned</div><Money c={st.unassigned} className={st.unassigned < 0 ? "neg" : ""} /></div>
      </div>
      {t.status === "active" && st.unassigned > 0 && <div className="note-bar">{fmt(st.unassigned)} isn’t assigned yet, so this transfer stays Active. <button className="link" onClick={() => ui.open("splitForm", { id: t.id, amount: st.unassigned })}>Assign it</button></div>}
      {t.holdOpen && full && <div className="note-bar">Reopened with everything paid. <button className="link" onClick={() => act(L.markComplete, "Transfer marked complete")}>Mark complete</button></div>}

      <h3 className="section-t">Bills</h3>
      {t.splits.length === 0 && <p className="muted small">No bills yet.</p>}
      <div className="bills">
        {t.splits.map((s) => {
          const ss = L.splitState(s); const paid = L.splitPaid(s);
          return (
            <div key={s.id} className="bill-wrap">
              <BillRow t={t} s={s} ui={ui} />
              <button className="more-toggle" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>{open === s.id ? "Hide options" : "Options"}</button>
              {open === s.id && (
                <div className="bill-actions">
                  {s.notes && <div className="small muted full">Note: {s.notes}</div>}
                  {(s.payments || []).length > 0 && <div className="small full">{s.payments.map((p) => <div key={p.id}>Paid <Money c={p.amount} /> on {L.longDate(p.date)}</div>)}</div>}
                  {(ss === "unpaid" || ss === "partial") && <button className="chip-btn" onClick={() => ui.open("payDate", { id: t.id, splitId: s.id })}>Paid on another date</button>}
                  {(ss === "unpaid" || ss === "partial") && <button className="chip-btn" onClick={() => ui.open("partialPay", { id: t.id, splitId: s.id })}>Pay part</button>}
                  {paid > 0 && <button className="chip-btn" onClick={() => ui.confirm({ title: `Reverse ${s.name} payment?`, body: `This removes the ${fmt(paid)} payment record and puts the money back to reserved. The reversal is logged.`, confirmLabel: "Reverse payment", onConfirm: () => act((x) => L.reverseSplitPayments(x, s.id), `Reversed ${s.name} payment`) })}>Reverse payment</button>}
                  {ss !== "canceled" && ss !== "paid" && <button className="chip-btn" onClick={() => ui.open("splitForm", { id: t.id, amount: L.splitRemaining(s), reassign: s.id })}>Reassign</button>}
                  {ss !== "canceled" && ss !== "paid" && <button className="chip-btn warn" onClick={() => ui.confirm({ title: `Cancel ${s.name}?`, body: `${fmt(L.splitRemaining(s))} goes back to unassigned in this transfer.${paid ? ` The ${fmt(paid)} already paid stays recorded.` : ""}`, confirmLabel: "Cancel bill", danger: true, onConfirm: () => act((x) => L.cancelSplit(x, s.id), `Canceled ${s.name}`) })}>Cancel bill</button>}
                  {ss === "canceled" && <button className="chip-btn" onClick={() => act((x) => L.restoreSplit(x, s.id), `Restored ${s.name}`)}>Restore bill</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="action-grid">
        {!t.deletedAt && <button className="btn ghost" onClick={() => ui.open("transferForm", { id: t.id })}><Icon n="edit" s={18} /> Edit</button>}
        {!t.deletedAt && t.status !== "active" && <button className="btn ghost" onClick={() => act(L.reopenTransfer, t.status === "archived" ? "Moved back to Active" : "Transfer reopened")}><Icon n="undo" s={18} /> {t.status === "archived" ? "Unarchive" : "Reopen"}</button>}
        {!t.deletedAt && t.status !== "archived" && <button className="btn ghost" onClick={() => act(L.archiveTransfer, "Transfer archived")}><Icon n="archive" s={18} /> Archive</button>}
        {!t.deletedAt && <button className="btn ghost danger-ink" onClick={() => ui.confirm({ title: "Move this transfer to Trash?", body: <>It will stop counting in balances and summaries. Its payment records are kept, and you can restore it from Trash at any time.</>, confirmLabel: "Move to Trash", danger: true, onConfirm: () => { act(L.softDelete, "Moved to Trash"); onClose(); } })}><Icon n="trash" s={18} /> Delete</button>}
        {t.deletedAt && <button className="btn primary" onClick={() => act(L.restoreDeleted, "Transfer restored")}><Icon n="undo" s={18} /> Restore from Trash</button>}
      </div>

      <h3 className="section-t">Audit trail</h3>
      <Audit items={t.audit} />
    </Sheet>
  );
}

// ---------------- Uncle ----------------
function UncleTab({ data, ui }) {
  const led = data.uncleLedger;
  const tot = led.totals;
  const rows = led.rows.slice().reverse();
  const [text, setText] = useState("");
  const [show, setShow] = useState("all");
  const visible = rows.filter((r) => show === "all" || (show === "pending" ? r.tx.status === "pending" : r.tx.type === show));
  const run = () => { if (!text.trim()) return; ui.open("uncleQuick", { text }); setText(""); };
  return (
    <div className="stack">
      <section className="card uncle-hero">
        <div className="eyebrow uncle-ink">Uncle’s money you’re holding</div>
        <div className="hero-num uncle-ink"><Money c={tot.held} /></div>
        <div className="loc-row">
          <div className="loc"><Icon n="bank" s={18} /><div><div className="tiny muted">Bank account</div><Money c={tot.bank} className={tot.bank < 0 ? "neg" : ""} /></div></div>
          <div className="loc"><Icon n="cash" s={18} /><div><div className="tiny muted">Cash on hand</div><Money c={tot.cash} className={tot.cash < 0 ? "neg" : ""} /></div></div>
        </div>
        <div className="uh-foot small">
          <span>Received <Money c={tot.received} /></span>
          <span>Delivered <Money c={tot.delivered} /></span>
          <span>Returned <Money c={tot.returned} /></span>
        </div>
        {(tot.bank < 0 || tot.cash < 0) && <div className="warn-bar"><Icon n="alert" s={16} /> {tot.cash < 0 ? "Cash on hand" : "Bank"} is below zero. An entry is probably missing, or the dates are out of order.</div>}
      </section>

      <section className="card">
        <label className="card-head" htmlFor="uq"><h3>Quick entry</h3><span className="muted small">Type it how you’d say it</span></label>
        <div className="quick">
          <input id="uq" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder="Unc told me to send 100 to Auntie" />
          <button className="btn uncle" onClick={run} disabled={!text.trim()}>Review</button>
        </div>
        <p className="tiny muted">Nothing is saved until you confirm the details.</p>
        <div className="examples">
          {["Unc gave me $2,000 to hold", "Unc made me take out $1,000 to send to Auntie", "Unc told me to send $250 to John"].map((x) => <button key={x} className="chip-btn" onClick={() => ui.open("uncleQuick", { text: x })}>{x}</button>)}
        </div>
        <button className="btn ghost block" onClick={() => ui.open("uncleForm", {})}><Icon n="plus" /> Add entry with the full form</button>
      </section>

      <section className="card">
        <div className="card-head"><h3>Ledger</h3><span className="muted small">Newest first · balance after each</span></div>
        <div className="chips">
          {[["all", "All"], ["received", "Received"], ["sent", "Sent"], ["withdrawn", "Withdrawals"], ["cash_given", "Cash given"], ["returned", "Returned"], ["pending", "Pending"]].map(([v, l]) => <button key={v} className={cx("chip", show === v && "on")} onClick={() => setShow(v)}>{l}</button>)}
        </div>
        {visible.length === 0 ? <Empty icon="uncle" title="No entries yet" body="Record money your uncle gives you, and every time you send, withdraw, or return it." /> : (
          <div className="ledger">
            {visible.map((r) => <LedgerRow key={r.tx.id} r={r} ui={ui} />)}
          </div>
        )}
      </section>
    </div>
  );
}
function LedgerRow({ r, ui }) {
  const tx = r.tx;
  const d = r.heldDelta;
  return (
    <button className={cx("lrow", !r.counted && "dim")} onClick={() => ui.open("uncleDetail", { id: tx.id })}>
      <div className={cx("l-ic", tx.type)}><Icon n={tx.type === "withdrawn" || tx.type === "cash_given" ? "cash" : tx.type === "received" ? "download" : tx.type === "move" ? "swap" : tx.type === "adjustment" ? "edit" : "send"} s={18} /></div>
      <div className="grow minw">
        <div className="l-t">{L.uncleTitle(tx)}</div>
        <div className="tiny muted ellip">{dtLabel(tx.datetime)}{tx.method ? ` · ${tx.method}` : ""}{tx.status !== "completed" ? ` · ${tx.status === "pending" ? "Pending, not counted" : "Voided"}` : ""}</div>
      </div>
      <div className="l-right">
        <div className={cx("money l-amt", d > 0 && "pos", d < 0 && "negv")}>{!r.counted ? fmt(tx.amount) : d === 0 ? fmt(tx.amount) : fmt(d, { sign: true })}</div>
        <div className="tiny muted">{r.counted ? (d === 0 ? "Held unchanged · " : "Held ") : "Held "}<span className="money">{fmt(r.after.held)}</span></div>
      </div>
    </button>
  );
}

function UncleFields({ f, set, people, idp = "uf" }) {
  const t = f.type;
  return (
    <>
      <Field label="What happened?">
        <div className="type-grid">
          {Object.entries(UNCLE_TYPES).map(([k, v]) => (
            <button key={k} className={cx("type-opt", t === k && "on")} onClick={() => set({ type: k })} aria-pressed={t === k}>{v.label}</button>
          ))}
        </div>
      </Field>
      <div className="row gap">
        <Field label="Amount" htmlFor={idp + "-a"}><MoneyInput id={idp + "-a"} value={f.amt} onChange={(v) => set({ amt: v })} /></Field>
        <Field label="Date & time" htmlFor={idp + "-dt"}><input id={idp + "-dt"} type="datetime-local" value={f.datetime} onChange={(e) => set({ datetime: e.target.value })} /></Field>
      </div>
      {t === "received" && <Field label="Where is it now?"><Seg small value={f.to || "bank"} onChange={(v) => set({ to: v })} options={[{ v: "bank", l: "Bank account" }, { v: "cash", l: "Cash on hand" }]} /></Field>}
      {(t === "sent" || t === "returned") && <Field label="Paid out of"><Seg small value={f.from || "bank"} onChange={(v) => set({ from: v })} options={[{ v: "bank", l: "Bank account" }, { v: "cash", l: "Cash on hand" }]} /></Field>}
      {t === "move" && <Field label="Direction"><Seg small value={f.from || "bank"} onChange={(v) => set({ from: v })} options={[{ v: "bank", l: "Bank → Cash" }, { v: "cash", l: "Cash → Bank" }]} /></Field>}
      {t === "adjustment" && (
        <div className="row gap">
          <Field label="Location"><Seg small value={f.from || "bank"} onChange={(v) => set({ from: v })} options={[{ v: "bank", l: "Bank" }, { v: "cash", l: "Cash" }]} /></Field>
          <Field label="Change"><Seg small value={f.adjDir === -1 ? "-1" : "1"} onChange={(v) => set({ adjDir: Number(v) })} options={[{ v: "1", l: "Increase" }, { v: "-1", l: "Decrease" }]} /></Field>
        </div>
      )}
      {t === "withdrawn" && <p className="info-line">Moves his money from the bank into cash. What you hold for him doesn’t change.</p>}
      {t === "cash_given" && <p className="info-line">Comes out of cash on hand and lowers what you hold.</p>}
      {(t === "sent" || t === "cash_given" || t === "returned" || t === "received") && (
        <Field label={t === "received" ? "From (optional)" : t === "returned" ? "Given to (optional)" : "Who got it?"} htmlFor={idp + "-p"}>
          <input id={idp + "-p"} list="people" value={f.person || ""} onChange={(e) => set({ person: e.target.value })} placeholder={t === "received" || t === "returned" ? "Uncle" : "e.g. Auntie"} />
        </Field>
      )}
      <datalist id="people">{people.map((p) => <option key={p} value={p} />)}</datalist>
      <div className="row gap">
        <Field label="Payment method" htmlFor={idp + "-m"}><select id={idp + "-m"} value={f.method || ""} onChange={(e) => set({ method: e.target.value })}><option value="">—</option>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Status" htmlFor={idp + "-s"}><select id={idp + "-s"} value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="completed">Completed</option><option value="pending">Pending (not counted yet)</option><option value="voided">Voided</option></select></Field>
      </div>
      <Field label="Description" htmlFor={idp + "-d"}><input id={idp + "-d"} value={f.description || ""} onChange={(e) => set({ description: e.target.value })} placeholder="What did he ask you to do?" /></Field>
      <Field label="Notes" htmlFor={idp + "-n"}><input id={idp + "-n"} value={f.notes || ""} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" /></Field>
    </>
  );
}
const toForm = (x) => ({ type: x.type || "", amt: centsToInput(x.amount), datetime: x.datetime || nowLocalDT(), person: x.person || "", from: x.from || "bank", to: x.to || "bank", adjDir: x.adjDir || 1, method: x.method || "", status: x.status || "completed", description: x.description || "", notes: x.notes || "" });
const fromForm = (f) => ({ type: f.type, amount: parseMoney(f.amt), datetime: f.datetime, person: f.person, from: f.from, to: f.to, adjDir: f.adjDir, method: f.method, status: f.status, description: f.description, notes: f.notes });

function previewHeld(allTx, tx, excludeId) {
  const list = allTx.filter((x) => x.id !== excludeId);
  const n = L.normalizeUncle({ ...tx, id: "__preview", createdAt: "9999", deletedAt: null });
  const led = L.uncleLedger([...list, n]);
  const row = led.rows.find((r) => r.tx.id === "__preview");
  return { row, totals: led.totals };
}
function UnclePreview({ allTx, f, excludeId }) {
  const v = fromForm(f);
  if (!UNCLE_TYPES[v.type] || !v.amount || !v.datetime) return null;
  const { row, totals } = previewHeld(allTx, v, excludeId);
  const neg = totals.cash < 0 || totals.bank < 0;
  return (
    <div className={cx("preview", neg && "warn")}>
      <div className="row between"><span className="small">Held after this entry</span><b className="money">{fmt(row.after.held)}</b></div>
      <div className="tiny muted">{row.counted ? (row.heldDelta === 0 ? "Total held doesn’t change." : `Changes total held by ${fmt(row.heldDelta, { sign: true })}.`) : "Pending and voided entries don’t change the balance."} Bank {fmt(row.after.bank)} · Cash {fmt(row.after.cash)}</div>
      {neg && <div className="tiny warn-ink">Heads up: this leaves {totals.cash < 0 ? "cash on hand" : "the bank balance"} below zero.</div>}
    </div>
  );
}
function UncleForm({ id, initial, data, ui, onClose }) {
  const existing = id ? data.byId[id] : null;
  const [f, setF] = useState(toForm(existing || initial || {}));
  const [tried, setTried] = useState(false);
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const errs = L.validateUncle(fromForm(f));
  const save = () => {
    setTried(true); if (errs.length) return;
    if (existing) { ui.mutate(existing.id, (x) => L.editUncle(x, fromForm(f)), "Entry updated"); }
    else ui.create([L.newUncle(fromForm(f))], "Uncle entry saved");
    onClose();
  };
  return (
    <Sheet tall title={existing ? "Edit uncle entry" : "New uncle entry"} sub="This is your uncle’s money, tracked separately from yours." onClose={onClose}
      footer={<button className="btn uncle block" onClick={save}>{existing ? "Save changes" : "Save entry"}</button>}>
      <UncleFields f={f} set={set} people={data.people} />
      <UnclePreview allTx={data.uncleTx} f={f} excludeId={existing && existing.id} />
      {tried && errs.length > 0 && <div className="err-box" role="alert">{errs.map((e) => <div key={e}>{e}</div>)}</div>}
    </Sheet>
  );
}
function UncleQuick({ text: initialText, data, ui, onClose }) {
  const [text, setText] = useState(initialText || "");
  const [parsed, setParsed] = useState(() => (initialText ? L.parseUncleText(initialText, nowLocalDT()) : null));
  const [forms, setForms] = useState(() => (parsed ? parsed.suggestions.map(toForm) : []));
  const [tried, setTried] = useState(false);
  const read = () => { const p = L.parseUncleText(text, nowLocalDT()); setParsed(p); setForms(p.suggestions.map(toForm)); setTried(false); };
  const allErrs = forms.map((f) => L.validateUncle(fromForm(f)));
  const save = () => {
    setTried(true);
    if (allErrs.some((e) => e.length)) return;
    const base = Date.now();
    const recs = forms.map((f, i) => L.newUncle(fromForm(f), new Date(base + i).toISOString()));
    ui.create(recs, recs.length > 1 ? `${recs.length} uncle entries saved` : "Uncle entry saved"); onClose();
  };
  // preview chain: include earlier suggestions when previewing later ones
  return (
    <Sheet tall title="Uncle quick entry" sub="Type it in plain words. Check the details before saving." onClose={onClose}
      footer={parsed && <button className="btn uncle block" onClick={save}>Confirm & save {forms.length > 1 ? `${forms.length} entries` : "entry"}</button>}>
      <div className="quick">
        <input aria-label="Describe what happened" value={text} autoFocus={!initialText} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && read()} placeholder="Unc told me to send 100 to Auntie" />
        <button className="btn ghost" onClick={read} disabled={!text.trim()}>Read it</button>
      </div>
      {parsed && parsed.notes.length > 0 && <div className="notes-box">{parsed.notes.map((n) => <p key={n}>{n}</p>)}</div>}
      {forms.map((f, i) => (
        <div className="sugg" key={i}>
          <div className="row between"><h3>Entry {forms.length > 1 ? `${i + 1} of ${forms.length}` : ""}</h3>
            {forms.length > 1 && <button className="link" onClick={() => setForms((a) => a.filter((_, j) => j !== i))}>Remove</button>}</div>
          <UncleFields f={f} idp={"q" + i} people={data.people} set={(p) => setForms((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x)))} />
          <UnclePreview allTx={[...data.uncleTx, ...forms.slice(0, i).map((x, j) => ({ ...L.normalizeUncle({ ...fromForm(x) }), id: "__q" + j, createdAt: "9998" + j }))]} f={f} />
          {tried && allErrs[i].length > 0 && <div className="err-box" role="alert">{allErrs[i].map((e) => <div key={e}>{e}</div>)}</div>}
        </div>
      ))}
      {parsed && <button className="btn ghost block" onClick={() => setForms((a) => [...a, toForm({})])}><Icon n="plus" /> Add another entry</button>}
    </Sheet>
  );
}
function UncleDetail({ id, data, ui, onClose }) {
  const tx = data.byId[id];
  if (!tx) return <Sheet title="Entry" onClose={onClose}><p className="muted">This entry no longer exists.</p></Sheet>;
  const row = data.uncleLedger.rows.find((r) => r.tx.id === id);
  const e = L.uncleEffect(tx);
  const explain = tx.type === "withdrawn" ? `Moved ${fmt(tx.amount)} from the bank into cash. Total held unchanged.`
    : tx.type === "move" ? `Moved ${fmt(tx.amount)} from ${LOCATIONS[tx.from].toLowerCase()} to ${LOCATIONS[tx.to].toLowerCase()}. Total held unchanged.`
      : `${e.bank + e.cash > 0 ? "Added" : "Removed"} ${fmt(Math.abs(e.bank + e.cash))} ${e.bank + e.cash > 0 ? "to" : "from"} what you hold (${LOCATIONS[tx.from || tx.to].toLowerCase()}).`;
  const act = (f, msg) => ui.mutate(tx.id, f, msg);
  return (
    <Sheet tall title={L.uncleTitle(tx)} sub={dtLabel(tx.datetime)} onClose={onClose}>
      <div className="row between"><Pill tone={tx.deletedAt ? "bad" : tx.status === "completed" ? "uncle" : tx.status === "pending" ? "warn" : "neutral"}>{tx.deletedAt ? "In trash" : tx.status === "completed" ? "Completed" : tx.status === "pending" ? "Pending" : "Voided"}</Pill><Money c={tx.amount} className="detail-amt" /></div>
      <p className="info-line">{tx.status === "completed" && !tx.deletedAt ? explain : "Not counted in the balance."}</p>
      <dl className="dl">
        <dt>Type</dt><dd>{UNCLE_TYPES[tx.type].label}</dd>
        {tx.person && <><dt>Person</dt><dd>{tx.person}</dd></>}
        {tx.method && <><dt>Method</dt><dd>{tx.method}</dd></>}
        {tx.description && <><dt>Description</dt><dd>{tx.description}</dd></>}
        {tx.notes && <><dt>Notes</dt><dd>{tx.notes}</dd></>}
        {row && <><dt>Held after</dt><dd><Money c={row.after.held} /> <span className="muted small">(bank {fmt(row.after.bank)} · cash {fmt(row.after.cash)})</span></dd></>}
      </dl>
      <div className="action-grid">
        {!tx.deletedAt && <button className="btn ghost" onClick={() => ui.open("uncleForm", { id: tx.id })}><Icon n="edit" s={18} /> Edit</button>}
        {!tx.deletedAt && tx.status === "pending" && <button className="btn ghost" onClick={() => act((x) => L.editUncle(x, { status: "completed" }), "Marked completed")}><Icon n="check" s={18} /> Mark done</button>}
        {!tx.deletedAt && tx.status === "completed" && <button className="btn ghost" onClick={() => ui.confirm({ title: "Void this entry?", body: "It stays in the ledger for the record but stops counting in the balance. You can un-void it later.", confirmLabel: "Void entry", onConfirm: () => act((x) => L.editUncle(x, { status: "voided" }), "Entry voided") })}><Icon n="x" s={18} /> Void</button>}
        {!tx.deletedAt && tx.status === "voided" && <button className="btn ghost" onClick={() => act((x) => L.editUncle(x, { status: "completed" }), "Entry restored")}><Icon n="undo" s={18} /> Un-void</button>}
        {!tx.deletedAt && <button className="btn ghost danger-ink" onClick={() => ui.confirm({ title: "Move this entry to Trash?", body: "Balances are recalculated without it. You can restore it from Trash.", confirmLabel: "Move to Trash", danger: true, onConfirm: () => { act(L.softDelete, "Moved to Trash"); onClose(); } })}><Icon n="trash" s={18} /> Delete</button>}
        {tx.deletedAt && <button className="btn primary" onClick={() => act(L.restoreDeleted, "Entry restored")}><Icon n="undo" s={18} /> Restore from Trash</button>}
      </div>
      <h3 className="section-t">Audit trail</h3>
      <Audit items={tx.audit} />
    </Sheet>
  );
}

// ---------------- History & reports ----------------
const FILTERS = [["all", "All"], ["mine", "My money"], ["uncle", "Uncle’s money"], ["capone", "Capital One"], ["amex", "American Express"], ["bills", "Bills"], ["transfers", "Transfers"], ["payments", "Payments"], ["withdrawals", "Cash withdrawals"]];
function EventRow({ e, ui }) {
  const isUncle = e.owner === "uncle";
  const ic = e.type === "transfer" ? "split" : e.type === "payment" ? "check" : e.type === "status" ? "archive" : e.type === "uncle_withdrawn" ? "cash" : "uncle";
  return (
    <button className="evrow" onClick={() => ui.open(isUncle ? "uncleDetail" : "transferDetail", { id: e.ref })}>
      <div className={cx("ev-ic", isUncle ? "u" : e.type)}><Icon n={ic} s={17} /></div>
      <div className="grow minw">
        <div className="ev-t ellip">{e.title}</div>
        <div className="tiny muted ellip">{L.shortDate(e.date)} · {e.category} · {e.status}</div>
      </div>
      {e.amount !== 0 && <div className={cx("money ev-amt", e.type === "payment" && "spent", isUncle && "u")}>{e.type === "payment" ? fmt(-e.amount) : e.type === "transfer" ? "⇄ " + fmt(e.amount) : fmt(e.signed || e.amount, { sign: !!e.signed })}</div>}
    </button>
  );
}
function History({ data, ui }) {
  const [view, setView] = useState("timeline");
  return (
    <div className="stack">
      <div className="page-head"><div><h1>History & reports</h1><p className="muted small">Everything that happened, including closed and archived transfers.</p></div></div>
      <Seg label="History view" value={view} onChange={setView} options={[{ v: "timeline", l: "Transactions" }, { v: "reports", l: "Reports" }]} />
      {view === "timeline" ? <Timeline data={data} ui={ui} /> : <Reports data={data} ui={ui} />}
    </div>
  );
}
function Timeline({ data, ui }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const all = useMemo(() => L.buildEvents(data.records), [data.records]);
  const ql = q.trim().toLowerCase();
  const list = all.filter((e) => (f === "all" || e.tags.includes(f)) && (!from || e.date >= from) && (!to || e.date <= to)
    && (!ql || (e.title + " " + e.sub + " " + e.text + " " + e.category + " " + e.account + " " + fmt(e.amount)).toLowerCase().includes(ql)));
  const groups = [];
  list.forEach((e) => { const k = e.date.slice(0, 7); let g = groups[groups.length - 1]; if (!g || g.k !== k) groups.push((g = { k, items: [] })); g.items.push(e); });
  const exportCSV = () => ui.download(`money-history-${L.todayStr()}.csv`, L.toCSV(list));
  return (
    <>
      <div className="search"><Icon n="search" s={18} /><input aria-label="Search transactions" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, notes, amounts" />{q && <button className="icon-btn sm" aria-label="Clear search" onClick={() => setQ("")}><Icon n="x" s={16} /></button>}</div>
      <div className="chips scroll">{FILTERS.map(([v, l]) => <button key={v} className={cx("chip", f === v && "on")} onClick={() => setF(v)}>{l}</button>)}</div>
      <div className="row gap custom-range">
        <Field label="From" htmlFor="hf"><input id="hf" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To" htmlFor="ht"><input id="ht" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <div className="row between"><span className="small muted">{list.length} result{list.length === 1 ? "" : "s"}</span><button className="link" onClick={exportCSV} disabled={!list.length}><Icon n="download" s={16} /> Export CSV</button></div>
      {list.length === 0 ? <Empty icon="search" title="Nothing matches" body="Try another filter or clear the dates." /> : groups.map((g) => (
        <section className="card tl-group" key={g.k}>
          <div className="card-head"><h3>{L.monthLabel(g.k + "-01")}</h3></div>
          <div className="ev-list">{g.items.map((e) => <EventRow key={e.id} e={e} ui={ui} />)}</div>
        </section>
      ))}
    </>
  );
}
function MonthChart({ series }) {
  const [hi, setHi] = useState(series.length - 1);
  const W = 340, H = 170, padL = 8, padB = 22, padT = 10;
  const max = Math.max(1, ...series.flatMap((s) => [s.moved, s.paid]));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const gw = (W - padL * 2) / series.length;
  const bw = Math.min(16, gw / 3.2);
  const y = (v) => padT + (H - padT - padB) * (1 - v / top);
  const cur = series[hi] || series[series.length - 1];
  return (
    <div className="chart">
      <div className="readout" aria-live="polite">
        <b>{cur.label}</b>
        <span><i className="lg moved" /> Moved <span className="money">{fmt(cur.moved)}</span></span>
        <span><i className="lg spent" /> Spent <span className="money">{fmt(cur.paid)}</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Money moved to Bills Checking compared with bills paid, by month">
        {[0, 1, 2, 3, 4].map((i) => { const v = (top / 4) * i; return v <= top ? <g key={i}><line x1={padL} x2={W - padL} y1={y(v)} y2={y(v)} className="grid" /><text x={W - padL} y={y(v) - 3} className="axis" textAnchor="end">{i === 0 ? "" : shortMoney(v)}</text></g> : null; })}
        {series.map((s, i) => {
          const cx0 = padL + gw * i + gw / 2;
          return (
            <g key={s.key} onMouseEnter={() => setHi(i)} onClick={() => setHi(i)} className={cx("mgroup", i === hi && "hi")}>
              <rect x={padL + gw * i} y={padT} width={gw} height={H - padT} className="hit" fill="transparent" />
              <path d={barPath(cx0 - bw - 1, y(s.moved), bw, H - padB - y(s.moved))} className="bar moved" />
              <path d={barPath(cx0 + 1, y(s.paid), bw, H - padB - y(s.paid))} className="bar spent" />
              <text x={cx0} y={H - 6} textAnchor="middle" className={cx("axis", i === hi && "axis-hi")}>{s.label}</text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only"><caption>Monthly totals</caption><thead><tr><th>Month</th><th>Moved</th><th>Spent</th></tr></thead><tbody>{series.map((s) => <tr key={s.key}><td>{s.label}</td><td>{fmt(s.moved)}</td><td>{fmt(s.paid)}</td></tr>)}</tbody></table>
    </div>
  );
}
function barPath(x, y, w, h) { if (h <= 0.5) return ""; const r = Math.min(4, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }
function niceStep(max) { const raw = max / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function shortMoney(c) { const d = c / 100; return d >= 1000 ? "$" + (d / 1000).toFixed(d % 1000 ? 1 : 0) + "k" : "$" + Math.round(d); }

function Reports({ data, ui }) {
  const { records, period, setPeriod } = data;
  const range = L.periodRange(period.key, period);
  const sm = useMemo(() => L.summarize(records, range), [records, range.start, range.end]);
  const series = useMemo(() => L.monthlySeries(records, 6), [records]);
  const outstanding = useMemo(() => L.outstandingBills(records), [records]);
  const timeline = useMemo(() => L.buildEvents(records).filter((e) => L.inRange(e.date, range)).slice(0, 8), [records, range.start, range.end]);
  const cats = CATEGORIES.map((c) => ({ ...c, paid: sm.period.byCat[c.id].paid })).filter((c) => c.paid > 0).sort((a, b) => b.paid - a.paid);
  const totalPaid = L.sum(cats, (c) => c.paid);
  const prev = series.length > 1 ? series[series.length - 2] : null, last = series[series.length - 1];
  const exportReport = () => ui.download(`money-report-${range.start}-to-${range.end}.json`, JSON.stringify({ app: L.BACKUP_APP, kind: "report", period: range, generatedAt: L.nowISO(), amountsIn: "integer cents", summary: sm, months: series, outstanding: outstanding.map((o) => ({ bill: o.split.name, category: catLabel(o.split.category), remaining: o.remaining, dueDate: o.split.dueDate, transferDate: o.transfer.date })) }, null, 2));
  return (
    <>
      <PeriodPicker period={period} setPeriod={setPeriod} />
      <section className="picture">
        <div className="pic moved"><div className="pic-k">Moved between your accounts</div><Money c={sm.period.transferred} className="pic-v" /><div className="pic-n">Main → Bills. Not spending.</div></div>
        <div className="pic reserved"><div className="pic-k">Reserved for future payments</div><Money c={sm.now.reserved} className="pic-v" /><div className="pic-n">Sitting in Bills Checking, waiting on bills. Plus <Money c={sm.now.unassigned} /> unassigned.</div></div>
        <div className="pic spent"><div className="pic-k">Actually spent</div><Money c={sm.period.billsPaid} className="pic-v" /><div className="pic-n">{sm.period.payments} bill payment{sm.period.payments === 1 ? "" : "s"} in {range.label.toLowerCase().startsWith("this") ? range.label.toLowerCase() : range.label}.</div></div>
        <div className="pic uncle"><div className="pic-k">Uncle’s money (not yours)</div><Money c={sm.now.uncle.held} className="pic-v" /><div className="pic-n">Held now. In: <Money c={sm.period.uncle.received} /> · Out: <Money c={sm.period.uncle.delivered + sm.period.uncle.returned} /></div></div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Moved vs. spent, last 6 months</h3></div>
        <MonthChart series={series} />
        {prev && <p className="small muted">{last.label}: spent {fmt(last.paid)}{prev.paid ? `, ${last.paid >= prev.paid ? "up" : "down"} ${fmt(Math.abs(last.paid - prev.paid))} from ${prev.label}` : ""}. Transfers are shown for comparison and never count as spending.</p>}
      </section>

      <section className="card">
        <div className="card-head"><h3>Spending by category</h3><span className="muted small">{range.label}</span></div>
        {cats.length === 0 ? <p className="muted small">No bills paid in this period.</p> : (
          <div className="catbars">
            {cats.map((c) => (
              <div className="catbar" key={c.id}>
                <div className="cb-top"><span className="cb-name"><i className="sw" style={{ background: catVar(c.id) }} />{c.label}</span><span><Money c={c.paid} /> <span className="muted tiny">{Math.round((c.paid / totalPaid) * 100)}%</span></span></div>
                <div className="cb-track"><span className="cb-paid" style={{ width: (c.paid / cats[0].paid) * 100 + "%", background: catVar(c.id) }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h3>Outstanding unpaid bills</h3><Money c={L.sum(outstanding, (o) => o.remaining)} /></div>
        {outstanding.length === 0 ? <p className="muted small">Nothing outstanding.</p> : outstanding.map((o) => <BillRow key={o.split.id} t={o.transfer} s={o.split} ui={ui} showTransfer />)}
      </section>

      <section className="card">
        <div className="card-head"><h3>Uncle’s money</h3><span className="muted small">{range.label}</span></div>
        <div className="kv-list">
          <KV k="Received from him" v={sm.period.uncle.received} uncle />
          <KV k="Sent or given to people" v={sm.period.uncle.delivered} uncle />
          <KV k="Returned to him" v={sm.period.uncle.returned} uncle />
          <KV k="Held right now" v={sm.now.uncle.held} strong uncle note={`Bank ${fmt(sm.now.uncle.bank)} · Cash ${fmt(sm.now.uncle.cash)}`} />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Timeline</h3><span className="muted small">{range.label}</span></div>
        {timeline.length === 0 ? <p className="muted small">No activity in this period.</p> : <div className="ev-list">{timeline.map((e) => <EventRow key={e.id} e={e} ui={ui} />)}</div>}
      </section>

      <section className="card">
        <div className="card-head"><h3>Export</h3></div>
        <div className="export-grid">
          <button className="btn ghost" onClick={() => ui.download(`money-history-${L.todayStr()}.csv`, L.toCSV(L.buildEvents(records)))}><Icon n="download" s={18} /> History (CSV)</button>
          <button className="btn ghost" onClick={exportReport}><Icon n="report" s={18} /> This report (JSON)</button>
          <button className="btn ghost" onClick={ui.exportBackup}><Icon n="lock" s={18} /> Full backup (JSON)</button>
        </div>
      </section>
    </>
  );
}

// ---------------- settings, trash, export fallback ----------------
function SettingsSheet({ data, ui, onClose, store, demo, theme, setTheme }) {
  const fileRef = useRef(null);
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { try { ui.importBackup(JSON.parse(String(rd.result))); } catch (err) { ui.toast(err.message && /backup/.test(err.message) ? err.message : "That file couldn’t be read as JSON.", "error"); } };
    rd.readAsText(file);
  };
  const trash = data.allRecords.filter((r) => r.deletedAt).length;
  return (
    <Sheet tall title="Settings & backup" onClose={onClose}>
      <StorageExplainer mode={store.mode} demo={demo} />
      <h3 className="section-t">Backup</h3>
      <p className="small"><b>Last backup:</b> {ui.lastBackup ? tsLabel(ui.lastBackup) : "never"}</p>
      <p className="small muted">A backup holds every transfer, bill, payment, uncle entry, Trash item, and audit trail. Importing merges by ID, so the same backup can be imported twice without duplicates.</p>
      <div className="export-grid">
        <button className="btn ghost" onClick={ui.exportBackup}><Icon n="download" s={18} /> Export backup</button>
        <button className="btn ghost" onClick={() => fileRef.current && fileRef.current.click()}><Icon n="upload" s={18} /> Import backup</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
      </div>
      <h3 className="section-t">Appearance</h3>
      <Seg small label="Theme" value={theme} onChange={setTheme} options={[{ v: "dark", l: "Dark" }, { v: "light", l: "Light" }, { v: "system", l: "Match device" }]} />
      <h3 className="section-t">Sample data</h3>
      {demo ? <><p className="small muted">You’re looking at sample data. Nothing you do here is saved.</p><button className="btn primary block" onClick={() => { ui.exitDemo(); onClose(); }}>Start my own tracker</button></>
        : <><p className="small muted">Look around with realistic sample transactions. Your own data is untouched and comes back when you leave the demo.</p><button className="btn ghost block" onClick={() => { ui.enterDemo(); onClose(); }}>View sample data</button></>}
      {!demo && <>
        <h3 className="section-t">Trash</h3>
        <button className="btn ghost block" onClick={() => ui.open("trash", {})}><Icon n="trash" s={18} /> Open Trash ({trash})</button>
        <h3 className="section-t">Danger zone</h3>
        <button className="btn ghost block danger-ink" disabled={!data.allRecords.length} onClick={() => ui.confirm({ title: "Erase all data?", body: `This permanently deletes all ${data.allRecords.length} records from ${store.mode === "cloud" ? "your account storage" : "this browser"}. Export a backup first if you might want them back. This can’t be undone.`, confirmLabel: "Erase everything", danger: true, onConfirm: ui.eraseAll })}>Erase all data</button>
      </>}
      <p className="tiny muted privacy">Money Command Center never connects to a bank and never asks for passwords, card numbers, or account numbers. Amounts are stored as whole cents.</p>
    </Sheet>
  );
}
function StorageExplainer({ mode, demo }) {
  const m = demo ? { t: "Demo mode", b: "Sample data only. Nothing is saved.", tone: "warn", ic: "alert" }
    : mode === "cloud" ? { t: "Saved to your Claude account", b: "Stored privately for you in this artifact’s database. Other people who open this page can’t see it. It follows you across devices where you’re signed in. Keep a backup anyway.", tone: "good", ic: "cloud" }
      : mode === "local" && !IN_CLAUDE ? { t: "Saved on this device", b: "Your data stays in this browser on this phone or computer and is never sent anywhere. On iPhone, add the app to your Home Screen (Share → Add to Home Screen) so Safari keeps the data. Clearing website data or switching devices loses it, so export a backup regularly. To move to another device, export here and import there.", tone: "good", ic: "lock" }
      : mode === "local" ? { t: "Saved in this browser only", b: "Account storage isn’t available here, so data is kept in this browser. Clearing site data, private browsing, or switching devices will lose it. Export backups often.", tone: "warn", ic: "alert" }
        : mode === "memory" ? { t: "Not being saved", b: "This view can’t store anything. Your entries disappear when the page closes. Export a backup before leaving.", tone: "bad", ic: "alert" }
          : { t: "Connecting to storage…", b: "", tone: "neutral", ic: "cloud" };
  return <div className={cx("storage-box", m.tone)}><Icon n={m.ic} /><div><b>{m.t}</b>{m.b && <p className="small">{m.b}</p>}</div></div>;
}
function TrashSheet({ data, ui, onClose }) {
  const items = data.allRecords.filter((r) => r.deletedAt).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  return (
    <Sheet tall title="Trash" sub="Deleted items don’t count in any balance. Restore them, or delete them for good." onClose={onClose}>
      {items.length === 0 ? <Empty icon="trash" title="Trash is empty" /> : items.map((r) => (
        <div className="trash-row" key={r.id}>
          <div className="grow minw">
            <div className="ellip">{r.kind === "transfer" ? `${fmt(r.amount)} transfer · ${L.shortDate(r.date)}` : `${L.uncleTitle(r)} · ${fmt(r.amount)}`}</div>
            <div className="tiny muted">{r.kind === "transfer" ? `${r.splits.length} bill${r.splits.length === 1 ? "" : "s"}, ${fmt(L.transferStats(r).paid)} paid` : "Uncle’s money"} · deleted {tsLabel(r.deletedAt)}</div>
          </div>
          <button className="chip-btn" onClick={() => ui.mutate(r.id, L.restoreDeleted, "Restored")}>Restore</button>
          <button className="icon-btn sm danger-ink" aria-label="Delete forever" onClick={() => ui.confirm({ title: "Delete forever?", body: "This record and its audit trail will be erased permanently. Export a backup first if you might need it.", confirmLabel: "Delete forever", danger: true, onConfirm: () => ui.removeForever([r.id]) })}><Icon n="trash" s={16} /></button>
        </div>
      ))}
    </Sheet>
  );
}
function ExportFallback({ filename, text, onClose, ui }) {
  const ref = useRef(null);
  const copy = async () => { try { await navigator.clipboard.writeText(text); ui.toast("Copied to clipboard"); } catch { ref.current && ref.current.select(); ui.toast("Select all and copy the text below", "error"); } };
  return (
    <Sheet tall title={`Save ${filename}`} sub="Downloads aren’t available in this view. Copy the text and save it as a file." onClose={onClose} footer={<button className="btn primary block" onClick={copy}>Copy</button>}>
      <textarea ref={ref} className="export-text" readOnly value={text} onFocus={(e) => e.target.select()} aria-label="Export contents" />
    </Sheet>
  );
}
function ImportReview({ result, onConfirm, onClose }) {
  return (
    <Sheet title="Import backup" onClose={onClose} footer={<div className="row gap"><button className="btn ghost grow" onClick={onClose}>Cancel</button><button className="btn primary grow" disabled={!result.changed.length} onClick={() => { onConfirm(); onClose(); }}>Import {result.changed.length}</button></div>}>
      <div className="kv-list">
        <KV k="New records to add" raw={result.added} />
        <KV k="Records with newer versions" raw={result.updated} />
        <KV k="Already up to date (skipped)" raw={result.unchanged} />
        {result.invalid > 0 && <KV k="Unreadable or duplicate rows (skipped)" raw={result.invalid} />}
      </div>
      {!result.changed.length && <p className="small muted">Everything in this backup is already here. Nothing to import.</p>}
    </Sheet>
  );
}

// ---------------- App ----------------
const TABS = [["home", "Dashboard", "home"], ["bills", "Transfers", "split"], ["uncle", "Uncle", "uncle"], ["history", "History", "history"]];
function App() {
  const store = useStore();
  const [tab, setTab] = useState(() => { const h = (location.hash || "").slice(1); return TABS.some((t) => t[0] === h) ? h : "home"; });
  const [sheets, setSheets] = useState([]);
  const [toast, setToast] = useState(null);
  const [demo, setDemo] = useState(false);
  const [demoRecs, setDemoRecs] = useState(null);
  const [period, setPeriod] = useState({ key: "month" });
  const [theme, setThemeS] = useState(() => lsGet("mcc.theme") || "dark");
  const decided = useRef(false);
  const [lastBackup, setLastBackup] = useState(() => lsGet("mcc.lastBackup"));
  const downloadsRef = useRef(undefined);

  useEffect(() => { document.documentElement.setAttribute("data-app-theme", theme); }, [theme]);
  const setTheme = (t) => { setThemeS(t); lsSet("mcc.theme", t); if (!demo && store.mode !== "loading") store.saveSettings({ ...store.settings, theme: t }); };
  useEffect(() => { if (store.settings.theme && !lsGet("mcc.theme")) setThemeS(store.settings.theme); }, [store.settings.theme]);
  useEffect(() => { (async () => { try { downloadsRef.current = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch { downloadsRef.current = null; } })(); }, []);

  // first run: show sample data until the person starts their own tracker
  useEffect(() => {
    if (store.mode === "loading" || decided.current) return;
    decided.current = true;
    if (Object.keys(store.records).length === 0 && !store.settings.started) { setDemoRecs(buildDemo()); setDemo(true); }
  }, [store.mode]);

  const recMap = demo ? demoRecs || {} : store.records;
  const allRecords = useMemo(() => Object.values(recMap), [recMap]);
  const live = useMemo(() => allRecords.filter((r) => !r.deletedAt), [allRecords]);
  const data = useMemo(() => {
    const transfers = allRecords.filter((r) => r.kind === "transfer");
    const uncleTx = allRecords.filter((r) => r.kind === "uncle");
    return {
      records: live, allRecords, byId: recMap, transfers, uncleTx, uncleLedger: L.uncleLedger(uncleTx), period, setPeriod,
      people: [...new Set(uncleTx.map((u) => u.person).filter(Boolean))],
    };
  }, [allRecords, live, recMap, period]);

  const showToast = useCallback((msg, tone = "ok", undo) => { setToast({ msg, tone, undo, k: Date.now() }); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), toast.undo ? 6000 : 3200); return () => clearTimeout(t); }, [toast]);

  const putRecords = (list) => { if (demo) setDemoRecs((m) => { const n = { ...m }; list.forEach((r) => (n[r.id] = r)); return n; }); else store.put(list); };
  const ui = {
    go: (t) => { setTab(t); window.scrollTo({ top: 0 }); },
    open: (type, props) => setSheets((s) => [...s, { type, props, k: Math.random() }]),
    close: () => setSheets((s) => s.slice(0, -1)),
    confirm: (props) => setSheets((s) => [...s, { type: "confirm", props, k: Math.random() }]),
    toast: showToast,
    create: (list, msg) => { putRecords(list); showToast(msg + (demo ? " (demo, not saved)" : "")); },
    mutate: (id, f, msg) => {
      const prev = recMap[id]; if (!prev) return;
      const next = f(prev);
      if (next === prev) return;
      putRecords([next]);
      let m = msg;
      if (prev.kind === "transfer" && prev.status !== "completed" && next.status === "completed") m = `${msg}. All bills paid, so the transfer is complete and moved to Completed.`;
      if (prev.kind === "transfer" && prev.status === "completed" && next.status === "active") m = `${msg}. Transfer is back in Active.`;
      showToast(m + (demo ? " (demo)" : ""), "ok", () => {
        const at = L.nowISO();
        putRecords([{ ...prev, updatedAt: at, audit: [...(prev.audit || []), { at, text: `Undid: ${msg}.` }] }]);
        showToast("Undone");
      });
    },
    removeForever: (ids) => { if (demo) setDemoRecs((m) => { const n = { ...m }; ids.forEach((i) => delete n[i]); return n; }); else store.remove(ids); showToast("Deleted permanently"); },
    eraseAll: () => { store.remove(Object.keys(store.records)); showToast("All data erased"); },
    download: async (filename, text) => {
      if (!IN_CLAUDE) { try { blobDownload(filename, text); showToast(`Downloaded ${filename}`); return true; } catch { ui.open("exportFallback", { filename, text }); return false; } }
      let dl = downloadsRef.current;
      if (dl === undefined) { try { dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch { dl = null; } downloadsRef.current = dl; }
      if (!dl) return ui.open("exportFallback", { filename, text });
      try { await dl.save({ filename, data: text }); showToast(`Saved ${filename}`); return true; }
      catch (e) {
        if (e && e.code === "declined") return false;
        if (e && e.code === "rate_limited") { showToast("A save prompt is already open.", "error"); return false; }
        ui.open("exportFallback", { filename, text }); return false;
      }
    },
    exportBackup: async () => {
      const ok = await ui.download(`money-command-center-backup-${L.todayStr()}.json`, JSON.stringify(L.makeBackup(Object.values(store.records), { theme }), null, 2));
      if (ok) { const at = L.nowISO(); lsSet("mcc.lastBackup", at); setLastBackup(at); }
    },
    lastBackup,
    importBackup: (json) => {
      const res = L.mergeBackup(Object.values(store.records), json);
      ui.open("importReview", { result: res, onConfirm: () => {
        if (demo) { setDemo(false); setDemoRecs(null); }
        store.put(res.changed);
        if (!store.settings.started) store.saveSettings({ ...store.settings, started: true });
        showToast(`Imported ${res.added} new and ${res.updated} updated records`);
      } });
    },
    exitDemo: () => { setDemo(false); setDemoRecs(null); if (!store.settings.started) store.saveSettings({ ...store.settings, started: true }); showToast(Object.keys(store.records).length ? "Back to your data" : "Your tracker is ready. Add your first transfer."); },
    enterDemo: () => { setDemoRecs(buildDemo()); setDemo(true); },
  };

  const renderSheet = (s, i) => {
    const common = { key: s.k, data, ui, onClose: () => setSheets((a) => a.filter((x) => x.k !== s.k)), ...s.props };
    switch (s.type) {
      case "transferForm": return <TransferForm {...common} />;
      case "transferDetail": return <TransferDetail {...common} />;
      case "splitForm": return <SplitForm {...common} />;
      case "partialPay": return <PartialPay {...common} />;
      case "payDate": return <PayDate {...common} />;
      case "uncleForm": return <UncleForm {...common} />;
      case "uncleQuick": return <UncleQuick {...common} />;
      case "uncleDetail": return <UncleDetail {...common} />;
      case "settings": return <SettingsSheet {...common} store={store} demo={demo} theme={theme} setTheme={setTheme} />;
      case "trash": return <TrashSheet {...common} />;
      case "exportFallback": return <ExportFallback {...common} />;
      case "importReview": return <ImportReview {...common} />;
      case "confirm": return <Confirm {...common} />;
    }
    return null;
  };
  const savingLabel = demo ? "Demo" : store.mode === "cloud" ? (store.saving > 0 ? "Saving…" : "Saved") : store.mode === "local" ? (IN_CLAUDE ? "This browser" : "On this device") : store.mode === "memory" ? "Not saved" : "Connecting…";
  const pillTone = demo ? "warn" : store.saveError ? "bad" : store.mode === "cloud" ? "good" : store.mode === "loading" ? "neutral" : store.mode === "local" ? (IN_CLAUDE ? "warn" : daysSince(lastBackup) >= BACKUP_NAG_DAYS ? "warn" : "good") : "bad";

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 16 9 11l3 3 8-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 6h5v5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="brand-t">Money Command Center</span>
        </div>
        <button className={cx("save-pill", pillTone)} onClick={() => ui.open("settings", {})}><i />{savingLabel}</button>
        <button className="icon-btn" aria-label="Settings and backup" onClick={() => ui.open("settings", {})}><Icon n="gear" /></button>
      </header>

      {demo && <div className="banner warn"><Icon n="alert" s={18} /><div className="grow"><b>Sample data.</b> Nothing here is saved.</div><button className="btn sm primary" onClick={ui.exitDemo}>Start my own</button></div>}
      {!demo && store.mode === "local" && !IN_CLAUDE && Object.keys(store.records).length > 0 && daysSince(lastBackup) >= BACKUP_NAG_DAYS && <div className="banner warn"><Icon n="alert" s={18} /><div className="grow">Your data lives only on this device. {lastBackup ? `Last backup was ${daysSince(lastBackup)} days ago.` : "You haven’t made a backup yet."}</div><button className="btn sm ghost" onClick={ui.exportBackup}>Back up</button></div>}
      {!demo && (store.mode === "memory" || (store.mode === "local" && IN_CLAUDE)) && <div className={cx("banner", store.mode === "memory" ? "bad" : "warn")}><Icon n="alert" s={18} /><div className="grow">{store.mode === "local" ? "Saved in this browser only. Export backups often." : "Nothing is being saved in this view. Export a backup before you leave."}</div><button className="btn sm ghost" onClick={ui.exportBackup}>Back up</button></div>}
      {!demo && store.saveError && <div className="banner bad"><Icon n="alert" s={18} /><div className="grow">{store.saveError}</div><button className="btn sm ghost" onClick={ui.exportBackup}>Back up</button></div>}

      <main className="main">
        {store.mode === "loading" ? <div className="loading"><div className="sk" /><div className="sk short" /><div className="sk" /><p className="muted small center">{IN_CLAUDE ? "Opening your private storage…" : "Loading…"}</p></div> : (
          <>
            {tab === "home" && <Dashboard data={data} ui={ui} />}
            {tab === "bills" && <Bills data={data} ui={ui} />}
            {tab === "uncle" && <UncleTab data={data} ui={ui} />}
            {tab === "history" && <History data={data} ui={ui} />}
          </>
        )}
      </main>

      <nav className="nav" aria-label="Sections">
        <div className="nav-in">
          {TABS.map(([k, l, ic]) => (
            <button key={k} className={cx("nav-b", tab === k && "on")} onClick={() => ui.go(k)} aria-current={tab === k ? "page" : undefined}><Icon n={ic} s={22} /><span>{l}</span></button>
          ))}
        </div>
      </nav>

      {toast && (
        <div className={cx("toast", toast.tone)} role="status" key={toast.k}>
          <span className="grow">{toast.msg}</span>
          {toast.undo && <button className="link" onClick={() => { const u = toast.undo; setToast(null); u(); }}>Undo</button>}
        </div>
      )}
      {sheets.map(renderSheet)}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
