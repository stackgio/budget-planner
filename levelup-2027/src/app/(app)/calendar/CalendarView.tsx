"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Plus, Repeat } from "lucide-react";
import { CATEGORY_META, type Category } from "@/domain/calendar";
import {
  type LocalDate, MONTHS, WEEKDAYS, addDays, formatInstantTime, formatLocalDate, formatTime12, instantToLocalDate,
  instantToLocalTime, makeLocalDate, monthKey, parseLocalDate, zonedToInstant,
} from "@/domain/dates";
import { cn } from "@/ui/cn";
import { Dialog } from "@/ui/dialog";
import { EventEditor, type EditorTarget } from "./EventEditor";

export type CalView = "month" | "week" | "day" | "agenda";

export interface SerializedOcc {
  key: string; eventId: string; originalStart: string; start: string; end: string; title: string;
  description: string | null; category: Category; allDay: boolean; recurring: boolean; modified: boolean;
  important: boolean; optional: boolean; readOnly?: boolean; href?: string;
}
export interface SeriesMeta { rrule: string | null; location: string | null; reminderMin: number | null; seriesStart: string; generated: string | null }

const HOUR_PX = 48;

export function CalendarView(props: {
  view: CalView; anchor: LocalDate; from: LocalDate; days: number; today: LocalDate; tz: string;
  occurrences: SerializedOcc[]; meta: Record<string, SeriesMeta>; extraMonths: string[]; payrollVerified: boolean; openNew: boolean;
}) {
  const { view, anchor, from, days, today, tz, occurrences, meta, extraMonths } = props;
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<Category>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [target, setTarget] = useState<EditorTarget | null>(props.openNew ? { mode: "new", date: anchor } : null);
  const [info, setInfo] = useState<SerializedOcc | null>(null);

  const visible = useMemo(() => occurrences.filter((o) => !hidden.has(o.category)), [occurrences, hidden]);
  const byDay = useMemo(() => {
    const m = new Map<LocalDate, SerializedOcc[]>();
    for (const o of visible) {
      const s = new Date(o.start), e = new Date(o.end);
      let d = instantToLocalDate(s, tz);
      const last = instantToLocalDate(new Date(e.getTime() - 1), tz);
      for (let i = 0; i < 60 && d <= last; i++, d = addDays(d, 1)) m.set(d, [...(m.get(d) ?? []), o]);
      if (s.getTime() === e.getTime()) m.set(d, [...(m.get(d) ?? []), o]);
    }
    return m;
  }, [visible, tz]);

  const go = (v: CalView, d: LocalDate) => router.push(`/calendar?view=${v}&date=${d}`);
  const step = (dir: 1 | -1) => {
    if (view === "month") {
      const { y, m } = parseLocalDate(anchor);
      const t = (m - 1) + dir;
      go(view, makeLocalDate(y + Math.floor(t / 12), ((t % 12) + 12) % 12 + 1, 1));
    } else go(view, addDays(anchor, dir * (view === "week" ? 7 : view === "day" ? 1 : 30)));
  };

  const open = (o: SerializedOcc) => {
    if (o.readOnly) setInfo(o);
    else setTarget({ mode: "edit", occ: o, meta: meta[o.eventId] });
  };

  const { y, m } = parseLocalDate(anchor);
  const title =
    view === "month" ? `${MONTHS[m - 1]} ${y}` :
    view === "day" ? formatLocalDate(anchor, "long") :
    view === "week" ? `${formatLocalDate(from, "weekday")} – ${formatLocalDate(addDays(from, 6), "weekday")}` :
    `From ${formatLocalDate(anchor, "weekday")}`;
  const isExtra = extraMonths.includes(monthKey(anchor));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1 className="h1">{title}</h1>
          {view === "month" && isExtra && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-go/40 bg-go/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-go">
              Extra paycheck month 💰 {!props.payrollVerified && <span className="font-medium normal-case text-warn">· provisional</span>}
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setTarget({ mode: "new", date: view === "month" && monthKey(today) !== monthKey(anchor) ? anchor : today })}>
          <Plus size={16} /> Add event
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-ink-700 bg-ink-900 p-1" role="tablist" aria-label="Calendar view">
          {(["month", "week", "day", "agenda"] as CalView[]).map((v) => (
            <button key={v} role="tab" aria-selected={v === view} onClick={() => go(v, anchor)} className={cn("min-h-[36px] rounded-lg px-3 text-[13px] font-semibold capitalize", v === view ? "bg-ink-700 text-white" : "text-mute-400")}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost btn-sm" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
          <button className="btn-secondary btn-sm" onClick={() => go(view, today)}>Today</button>
          <button className="btn-ghost btn-sm" onClick={() => step(1)} aria-label="Next"><ChevronRight size={18} /></button>
        </div>
        <button className={cn("btn-ghost btn-sm", hidden.size && "text-go")} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          <Filter size={16} /> Filter{hidden.size ? ` (${hidden.size} hidden)` : ""}
        </button>
      </div>

      {showFilters && (
        <div className="card mb-4 flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
            <button
              key={c}
              aria-pressed={!hidden.has(c)}
              onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
              className={cn("inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 text-xs font-semibold", hidden.has(c) ? "border-ink-700 text-ink-500 line-through" : "border-ink-600 text-white")}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_META[c].color }} />
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      )}

      {view === "month" && <MonthGrid from={from} days={days} month={monthKey(anchor)} today={today} byDay={byDay} onDay={(d) => go("day", d)} onOpen={open} />}
      {(view === "week" || view === "day") && (
        <TimeGrid dates={Array.from({ length: view === "week" ? 7 : 1 }, (_, i) => addDays(from, i))} today={today} tz={tz} byDay={byDay} onOpen={open} onDay={(d) => go("day", d)}
          onSlot={(d, h) => setTarget({ mode: "new", date: d, startTime: `${String(h).padStart(2, "0")}:00` })} />
      )}
      {view === "agenda" && <Agenda from={from} days={days} today={today} tz={tz} byDay={byDay} onOpen={open} extraMonths={extraMonths} />}

      {target && <EventEditor key={target.mode === "edit" ? target.occ.key : `new-${target.date}-${target.startTime ?? ""}-${target.prefill?.title ?? ""}`} target={target} tz={tz} onClose={() => setTarget(null)} onDuplicate={(t) => setTarget(t)} />}
      {info && (
        <Dialog title={info.title} open onOpenChange={(o) => !o && setInfo(null)}>
          <p className="text-sm text-mute-300">{formatLocalDate(instantToLocalDate(new Date(info.start), tz), "long")}</p>
          {info.description && <p className="mt-3 whitespace-pre-line text-sm">{info.description}</p>}
          <p className="mt-3 text-xs text-mute-400">This item comes from {info.category === "TASK" ? "your task list" : "your payroll schedule"} and is edited there.</p>
          {info.href && <Link href={info.href} className="btn-primary mt-4 w-full">Open</Link>}
        </Dialog>
      )}
    </div>
  );
}

const SHORT: Partial<Record<Category, string>> = { DOC_SHIFT: "DOC", PAYDAY_REGULAR: "💰 Pay", PAYDAY_OVERTIME: "OT pay", OVERTIME_SHIFT: "OT", ACTIVATION: "Active" };

function Chip({ o, onOpen, compact }: { o: SerializedOcc; onOpen: (o: SerializedOcc) => void; compact?: boolean }) {
  const color = CATEGORY_META[o.category].color;
  const label = compact && SHORT[o.category] && !o.modified ? SHORT[o.category] : o.title;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(o); }}
      className={cn("flex w-full items-center gap-1 truncate rounded-md px-1 text-left font-medium", compact ? "min-h-[18px] text-[10px] sm:text-[11px]" : "min-h-[28px] text-xs")}
      style={{ background: `${color}22`, color, borderLeft: `3px solid ${color}` }}
      title={o.title}
    >
      <span className={compact ? "overflow-hidden whitespace-nowrap" : "truncate"}>{label}</span>
    </button>
  );
}

function MonthGrid({ from, days, month, today, byDay, onDay, onOpen }: {
  from: LocalDate; days: number; month: string; today: LocalDate; byDay: Map<LocalDate, SerializedOcc[]>;
  onDay: (d: LocalDate) => void; onOpen: (o: SerializedOcc) => void;
}) {
  return (
    <div className="card-tight overflow-hidden">
      <div className="grid grid-cols-7 border-b border-ink-700 text-center">
        {WEEKDAYS.map((w) => <div key={w} className="py-2 text-[11px] font-semibold uppercase tracking-wider text-mute-400">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: days }, (_, i) => addDays(from, i)).map((d) => {
          const list = byDay.get(d) ?? [];
          const inMonth = monthKey(d) === month;
          return (
            <div
              key={d}
              role="button"
              tabIndex={0}
              aria-label={`${formatLocalDate(d, "long")}, ${list.length} items`}
              onClick={() => onDay(d)}
              onKeyDown={(e) => e.key === "Enter" && onDay(d)}
              className={cn("min-h-[84px] cursor-pointer border-b border-r border-ink-800 p-1 transition-colors hover:bg-ink-800/60 sm:min-h-[112px]", !inMonth && "bg-ink-900/60 opacity-50")}
            >
              <div className={cn("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold num", d === today ? "bg-go text-ink-950" : "text-mute-300")}>
                {parseLocalDate(d).d}
              </div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((o) => <Chip key={o.key} o={o} onOpen={onOpen} compact />)}
                {list.length > 3 && <p className="px-1 text-[10px] text-mute-400">+{list.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function layoutLanes(items: { o: SerializedOcc; top: number; bottom: number }[]) {
  const sorted = [...items].sort((a, b) => a.top - b.top || b.bottom - a.bottom);
  const out: { o: SerializedOcc; top: number; bottom: number; lane: number; lanes: number }[] = [];
  let cluster: typeof out = [];
  let clusterEnd = -1;
  const flush = () => { const n = Math.max(1, ...cluster.map((c) => c.lane + 1)); cluster.forEach((c) => (c.lanes = n)); out.push(...cluster); cluster = []; };
  for (const it of sorted) {
    if (it.top >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((c) => c.bottom > it.top).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ ...it, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, it.bottom);
  }
  if (cluster.length) flush();
  return out;
}

function TimeGrid({ dates, today, tz, byDay, onOpen, onDay, onSlot }: {
  dates: LocalDate[]; today: LocalDate; tz: string; byDay: Map<LocalDate, SerializedOcc[]>;
  onOpen: (o: SerializedOcc) => void; onDay: (d: LocalDate) => void; onSlot: (d: LocalDate, hour: number) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <div className="card-tight overflow-hidden">
      <div className="grid border-b border-ink-700" style={{ gridTemplateColumns: `44px repeat(${dates.length}, minmax(0,1fr))` }}>
        <div />
        {dates.map((d) => (
          <button key={d} onClick={() => onDay(d)} className="py-2 text-center">
            <span className="block text-[11px] font-semibold uppercase text-mute-400">{WEEKDAYS[new Date(d + "T12:00:00Z").getUTCDay()]}</span>
            <span className={cn("mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold num", d === today && "bg-go text-ink-950")}>{parseLocalDate(d).d}</span>
          </button>
        ))}
      </div>
      {/* all-day row */}
      <div className="grid border-b border-ink-700" style={{ gridTemplateColumns: `44px repeat(${dates.length}, minmax(0,1fr))` }}>
        <div className="py-1 pr-1 text-right text-[10px] text-mute-400">all-day</div>
        {dates.map((d) => (
          <div key={d} className="space-y-0.5 border-l border-ink-800 p-0.5">
            {(byDay.get(d) ?? []).filter((o) => o.allDay).map((o) => <Chip key={o.key} o={o} onOpen={onOpen} compact />)}
          </div>
        ))}
      </div>
      <div className="max-h-[65dvh] overflow-y-auto" ref={(el) => { if (el && !el.dataset.scrolled) { el.scrollTop = 6 * HOUR_PX; el.dataset.scrolled = "1"; } }}>
        <div className="relative grid" style={{ gridTemplateColumns: `44px repeat(${dates.length}, minmax(0,1fr))` }}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="pr-1 text-right text-[10px] text-mute-400 num">
                {h === 0 ? "" : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`}
              </div>
            ))}
          </div>
          {dates.map((d) => {
            const dayStart = zonedToInstant(d, "00:00", tz).getTime();
            const dayEnd = zonedToInstant(addDays(d, 1), "00:00", tz).getTime();
            const items = (byDay.get(d) ?? []).filter((o) => !o.allDay).map((o) => {
              const s = Math.max(new Date(o.start).getTime(), dayStart), e = Math.min(new Date(o.end).getTime(), dayEnd);
              const top = ((s - dayStart) / 3_600_000) * HOUR_PX;
              return { o, top, bottom: Math.max(top + 20, ((e - dayStart) / 3_600_000) * HOUR_PX) };
            });
            return (
              <div key={d} className="relative border-l border-ink-800" style={{ height: 24 * HOUR_PX }}>
                {hours.map((h) => (
                  <button key={h} aria-label={`Add event ${formatLocalDate(d, "weekday")} ${formatTime12(`${String(h).padStart(2, "0")}:00`)}`} onClick={() => onSlot(d, h)} className="block w-full border-b border-ink-800/70 hover:bg-ink-800/40" style={{ height: HOUR_PX }} />
                ))}
                {layoutLanes(items).map(({ o, top, bottom, lane, lanes }) => {
                  const color = CATEGORY_META[o.category].color;
                  return (
                    <button
                      key={o.key}
                      onClick={() => onOpen(o)}
                      className="absolute overflow-hidden rounded-md px-1 py-0.5 text-left text-[10px] font-semibold leading-tight sm:text-[11px]"
                      style={{ top, height: bottom - top - 2, left: `calc(${(lane / lanes) * 100}% + 1px)`, width: `calc(${100 / lanes}% - 2px)`, background: `${color}26`, color, borderLeft: `3px solid ${color}` }}
                    >
                      <span className="block truncate">{o.title}</span>
                      <span className="block truncate font-normal opacity-80">{formatInstantTime(new Date(o.start), tz)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Agenda({ from, days, today, tz, byDay, onOpen, extraMonths }: {
  from: LocalDate; days: number; today: LocalDate; tz: string; byDay: Map<LocalDate, SerializedOcc[]>; onOpen: (o: SerializedOcc) => void; extraMonths: string[];
}) {
  const list = Array.from({ length: days }, (_, i) => addDays(from, i)).filter((d) => (byDay.get(d) ?? []).length);
  if (!list.length) return <div className="card text-sm text-mute-400">Nothing scheduled in the next {days} days.</div>;
  return (
    <div className="space-y-3">
      {list.map((d) => (
        <section key={d} className="card">
          <h2 className={cn("mb-2 flex items-center gap-2 text-sm font-semibold", d === today && "text-go")}>
            {formatLocalDate(d, "long")} {d === today && <span className="chip-go">Today</span>}
            {d.endsWith("-01") && extraMonths.includes(monthKey(d)) && <span className="chip-go">Extra paycheck month 💰</span>}
          </h2>
          <ul className="divide-line">
            {(byDay.get(d) ?? []).map((o) => (
              <li key={o.key}>
                <button onClick={() => onOpen(o)} className="flex min-h-[48px] w-full items-center gap-3 py-2 text-left">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_META[o.category].color }} />
                  <span className="w-20 shrink-0 text-xs text-mute-400 num">{o.allDay ? "All day" : `${formatInstantTime(new Date(o.start), tz)}`}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.title}</span>
                  {o.recurring && <Repeat size={14} className="shrink-0 text-mute-400" aria-label="Repeats" />}
                  {o.modified && <span className="chip-mute">edited</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function occToTimes(o: SerializedOcc, tz: string) {
  const s = new Date(o.start), e = new Date(o.end);
  return {
    date: instantToLocalDate(s, tz),
    endDate: o.allDay ? addDays(instantToLocalDate(e, tz), -1) : instantToLocalDate(e, tz),
    startTime: instantToLocalTime(s, tz),
    endTime: instantToLocalTime(e, tz),
  };
}
