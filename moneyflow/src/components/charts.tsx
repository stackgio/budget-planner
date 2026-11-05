"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "@/lib/money";

const axis = { stroke: "rgb(var(--muted))", fontSize: 11, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />;
const money = (v: number) => formatCents(Math.round(v), { compact: true, noCents: true });

function Tip({ active, payload, label, labelFmt }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: Record<string, unknown> }>; label?: string; labelFmt?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <div className="mb-1 font-medium">{labelFmt ? labelFmt(String(label)) : label}</div>}
      {payload.filter((p) => p.value !== null && p.value !== undefined).map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto tabular font-medium">{formatCents(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingDonut({ data, total }: { data: Array<{ name: string; value: number; color: string }>; total: number }) {
  if (!data.length) return <div className="grid h-48 place-items-center text-sm text-muted">No spending recorded this month.</div>;
  return (
    <div className="relative h-52">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div><div className="text-[11px] uppercase tracking-wide text-muted">Spent</div><div className="text-lg font-semibold tabular">{formatCents(total, { noCents: true })}</div></div>
      </div>
    </div>
  );
}

export function IncomeSpendingBars({ data }: { data: Array<{ label: string; income: number; spending: number; projected?: boolean }> }) {
  return (
    <div className="h-60">
      <ResponsiveContainer>
        <BarChart data={data} barGap={3} margin={{ left: -8, right: 4, top: 8 }}>
          {grid}
          <XAxis dataKey="label" {...axis} />
          <YAxis tickFormatter={money} {...axis} width={52} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgb(var(--surface-2))" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="rgb(var(--brand))" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="spending" name="Spending" fill="rgb(var(--muted) / .55)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Actual balances are a solid line; projections are dashed. */
export function BalanceForecast({ points, threshold = 0 }: { points: Array<{ date: string; label: string; actual: number | null; projected: number | null }>; threshold?: number }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ left: -8, right: 8, top: 8 }}>
          {grid}
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis tickFormatter={money} {...axis} width={52} />
          <Tooltip content={<Tip />} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={threshold} stroke="rgb(var(--danger))" strokeDasharray="4 4" />
          <Line type="stepAfter" dataKey="actual" name="Actual balance" stroke="rgb(var(--brand))" strokeWidth={2.5} dot={false} connectNulls={false} />
          <Line type="stepAfter" dataKey="projected" name="Projected balance" stroke="rgb(var(--info))" strokeWidth={2} strokeDasharray="6 5" dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DebtPayoffChart({ series }: { series: Array<{ label: string; snowball?: number; avalanche?: number }> }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ left: -8, right: 8, top: 8 }}>
          {grid}
          <XAxis dataKey="label" {...axis} minTickGap={28} />
          <YAxis tickFormatter={money} {...axis} width={52} />
          <Tooltip content={<Tip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="avalanche" name="Avalanche" stroke="rgb(var(--brand))" fill="rgb(var(--brand) / .15)" strokeWidth={2} />
          <Area type="monotone" dataKey="snowball" name="Snowball" stroke="rgb(var(--info))" fill="rgb(var(--info) / .08)" strokeWidth={2} strokeDasharray="5 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContributionsVsValue({ data }: { data: Array<{ label: string; contributions: number; value: number | null }> }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          {grid}
          <XAxis dataKey="label" {...axis} minTickGap={28} />
          <YAxis tickFormatter={money} {...axis} width={52} />
          <Tooltip content={<Tip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="stepAfter" dataKey="contributions" name="Your contributions" stroke="rgb(var(--info))" fill="rgb(var(--info) / .12)" strokeWidth={2} />
          <Area type="linear" dataKey="value" name="Reported value" stroke="rgb(var(--brand))" fill="rgb(var(--brand) / .12)" strokeWidth={2} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
