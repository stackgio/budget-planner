import React from 'react';
import type {Spec} from '../schema';
import type {Timeline} from '../lib/timeline';
import {valueAt} from '../lib/timeline';
import {formatDate, formatMoney, formatPct} from '../lib/format';
import {seriesColor, theme} from '../theme';
import {TickerBadge} from './TickerBadge';

const TOP = 512;

/** Value counter driven by the exact same progress as the line, so they never drift apart. */
export const Counter: React.FC<{spec: Spec; tl: Timeline; frame: number}> = ({spec, tl, frame}) => {
	const p = tl.progress[frame];
	const idx = Math.round(p);
	const date = spec.series[0].dates[idx];
	const gainloss = spec.colorMode === 'gainloss';
	const appear = 1;
	// Whole years elapsed since the first data date, added to the starting age.
	const ageNow = (() => {
		if (!spec.age) return null;
		const [y0, m0, d0] = spec.series[0].dates[0].split('-').map(Number);
		const [y1, m1, d1] = date.split('-').map(Number);
		const before = m1 < m0 || (m1 === m0 && d1 < d0);
		return spec.age.start + (y1 - y0) - (before ? 1 : 0);
	})();
	const ageBlock =
		ageNow === null ? null : (
			<div
				style={{
					marginLeft: 'auto',
					fontSize: 58,
					fontWeight: 900,
					color: theme.ink,
					letterSpacing: -1,
					lineHeight: 1,
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				{`${spec.age!.label} ${ageNow}`}
			</div>
		);

	const rows = spec.series.map((s, i) => {
		const v = valueAt(s.values, p);
		const c = valueAt(s.contributed, p);
		const color = gainloss && !s.color ? (v >= c ? theme.up : theme.down) : seriesColor(spec, i);
		return {s, v, c, color, pct: c > 0 ? (v / c - 1) * 100 : 0};
	});

	const dateChip = (
		<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
			<div
				style={{
					fontSize: 30,
					fontWeight: 800,
					color: theme.charcoal,
					background: '#F2F3F5',
					padding: '8px 16px',
					borderRadius: 12,
					letterSpacing: 1.5,
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				{formatDate(date).toUpperCase()}
			</div>
		</div>
	);

	if (spec.series.length === 1) {
		const r = rows[0];
		return (
			<div style={{position: 'absolute', left: theme.safe.left, right: theme.safe.right - 30, top: TOP, opacity: appear}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					<TickerBadge ticker={r.s.ticker} logo={r.s.logo} color={theme.ink} size={52} />
					<div style={{fontSize: 30, fontWeight: 700, color: theme.muted}}>{spec.counterLabel}</div>
					{ageBlock}
				</div>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 6}}>
					<div
						style={{
							fontSize: 122,
							fontWeight: 900,
							color: r.color,
							letterSpacing: -3,
							fontVariantNumeric: 'tabular-nums',
							lineHeight: 1.05,
						}}
					>
						{formatMoney(r.v)}
					</div>
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 4}}>
					{dateChip}
					<div style={{fontSize: 32, fontWeight: 800, color: r.color, fontVariantNumeric: 'tabular-nums'}}>
						{formatPct(r.pct)}
					</div>
				</div>
			</div>
		);
	}

	const vfs = spec.series.length > 2 ? 54 : 70;
	return (
		<div style={{position: 'absolute', left: theme.safe.left, right: theme.safe.right - 30, top: TOP - 10, opacity: appear}}>
			{rows.map((r) => (
				<div key={r.s.id} style={{display: 'flex', alignItems: 'center', gap: 18, height: vfs + 16}}>
					<TickerBadge ticker={r.s.ticker} logo={r.s.logo} color={r.color} size={vfs * 0.82} />
					<div style={{fontSize: vfs * 0.46, fontWeight: 700, color: theme.charcoal, width: 250, whiteSpace: 'nowrap', overflow: 'hidden'}}>
						{r.s.label}
					</div>
					<div
						style={{
							marginLeft: 'auto',
							fontSize: vfs,
							fontWeight: 900,
							color: r.color,
							letterSpacing: -2,
							fontVariantNumeric: 'tabular-nums',
						}}
					>
						{formatMoney(r.v)}
					</div>
				</div>
			))}
			<div style={{marginTop: 6, display: 'flex', alignItems: 'center'}}>
				{dateChip}
				{ageBlock}
			</div>
		</div>
	);
};
