/** CSV versions of the Budget Review and Monthly Summary (same numbers as on screen). */
import type { MonthlyReport, PeriodReview, BudgetView } from './budget';
import { BUCKETS, BUCKET_LABELS } from './types';
import { centsToInput } from './money';
import { csvCell } from './backup';

type Row = Array<string | number>;
const money = (c: number) => centsToInput(c);

function toCSV(rows: Row[]): string {
  return rows.map((r) => r.map((v) => csvCell(String(v))).join(',')).join('\n') + '\n';
}

function viewRows(v: BudgetView): Row[] {
  const rows: Row[] = [
    ['section', 'item', 'planned_or_target', 'actual', 'reserved', 'remaining'],
    ['summary', 'Income', money(v.totals.income), '', '', ''],
    ['summary', 'Overtime (included in income)', money(v.totals.overtime), '', '', ''],
    ['summary', 'Allocated to plan lines', money(v.totals.allocated), '', '', ''],
    ['summary', 'Spent', '', money(v.totals.spent), '', ''],
    ['summary', 'Saved & invested', '', money(v.totals.contributed), '', ''],
    ['summary', 'Debt paid', '', money(v.totals.debtPaid), '', ''],
    ['summary', 'Reserved (unpaid bills)', '', '', money(v.totals.reserved), ''],
    ['summary', 'Remaining budget', '', '', '', money(v.totals.remaining)],
  ];
  for (const b of BUCKETS) {
    const s = v.buckets[b];
    const actual = s.spent + s.contributed + s.debtPaid;
    rows.push(['bucket', BUCKET_LABELS[b], money(s.target - s.redirectOut + s.redirectIn), money(actual), money(s.reserved), money(s.remaining)]);
    if (s.redirectOut) rows.push(['bucket', `${BUCKET_LABELS[b]} redirected to debt payoff`, money(s.redirectOut), '', '', '']);
    for (const ls of s.lines) rows.push([`line:${BUCKET_LABELS[b]}`, ls.line.name, money(ls.planned), money(ls.actual), money(ls.reserved), '']);
    if (s.unplannedSpent) rows.push([`line:${BUCKET_LABELS[b]}`, 'Not on a plan line', '', money(s.unplannedSpent), '', '']);
  }
  return rows;
}

export function reviewCSV(r: PeriodReview): string {
  const rows = viewRows(r.view);
  for (const c of r.byCategory) rows.push(['category', c.name, '', money(c.spent), '', '']);
  for (const o of r.overspent) rows.push(['overspent', o.label, money(o.planned), money(o.actual), '', '']);
  for (const t of r.recommendations) rows.push(['recommendation', t, '', '', '', '']);
  return toCSV([[`Budget review ${r.view.range.start} to ${r.view.range.end}`], ...rows]);
}

export function monthlyCSV(m: MonthlyReport): string {
  const rows = viewRows(m.view);
  for (const c of m.byCategory) rows.push(['category', c.name, '', money(c.spent), '', '']);
  for (const c of m.comparison) rows.push(['vs_previous_month', c.label, money(c.previous), money(c.current), '', money(c.current - c.previous)]);
  for (const p of m.periods) rows.push(['pay_period_in_month', `${p.inMonth.start} to ${p.inMonth.end} (paid ${p.paycheck.date})`, '', money(p.spent), '', '']);
  if (m.uncovered.spent) rows.push(['pay_period_in_month', 'Days with no paycheck period', '', money(m.uncovered.spent), '', '']);
  return toCSV([[`Monthly summary ${m.key}`], ...rows]);
}
