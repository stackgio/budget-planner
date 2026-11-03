import React from 'react';
import {interpolate} from 'remotion';
import {E} from '../lib/motion';
import {editorial, type Palette} from '../theme';

export type Allocation = {label: string; amount: number; color?: string};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Paycheck / budget breakdown: one bar that fills segment by segment, with a
 * legend row per category. `progress` 0..1 sweeps through the segments in
 * order (each segment gets an equal slice of progress), so you can key each
 * category's reveal to the word that names it by driving progress from cues.
 * Amounts are shown exactly as passed — compute them, never type totals by hand.
 */
export const AllocationBar: React.FC<{
	items: Allocation[];
	progress: number;
	w: number;
	h?: number;
	total?: number; // defaults to sum of items
	palette?: Palette;
	showLegend?: boolean;
	format?: (v: number) => string;
	/** dim everything except this index (-1 = none) */
	focus?: number;
	style?: React.CSSProperties;
}> = ({items, progress, w, h = 92, total, palette = editorial, showLegend = true, format = (v) => `$${Math.round(v).toLocaleString('en-US')}`, focus = -1, style}) => {
	const sum = total ?? items.reduce((a, b) => a + b.amount, 0);
	const fallback = [palette.accent, palette.ink, palette.gold, palette.danger, palette.muted, palette.accentDeep];
	let x = 0;
	const segs = items.map((it, i) => {
		const segW = (it.amount / sum) * w;
		const p = interpolate(progress * items.length - i, [0, 1], [0, 1], {...clamp, easing: E.out});
		const out = {it, i, x, segW, p, color: it.color ?? fallback[i % fallback.length]};
		x += segW;
		return out;
	});
	return (
		<div style={{position: 'absolute', width: w, ...style}}>
			<div style={{position: 'relative', width: w, height: h, borderRadius: h / 2.6, background: palette.line, overflow: 'hidden'}}>
				{segs.map((s) => (
					<div
						key={s.i}
						style={{
							position: 'absolute',
							left: s.x,
							top: 0,
							width: Math.max(0, s.segW * s.p - 3),
							height: h,
							background: s.color,
							opacity: focus >= 0 && focus !== s.i ? 0.28 : 1,
						}}
					/>
				))}
			</div>
			{showLegend && (
				<div style={{marginTop: 34, display: 'flex', flexDirection: 'column', gap: 18}}>
					{segs.map((s) => (
						<div
							key={s.i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 20,
								opacity: s.p * (focus >= 0 && focus !== s.i ? 0.35 : 1),
								transform: `translateY(${(1 - s.p) * 24}px)`,
							}}
						>
							<div style={{width: 30, height: 30, borderRadius: 9, background: s.color}} />
							<div style={{flex: 1, fontSize: 44, fontWeight: 800, color: palette.ink}}>{s.it.label}</div>
							<div style={{fontSize: 48, fontWeight: 900, color: palette.ink, fontVariantNumeric: 'tabular-nums'}}>{format(s.it.amount)}</div>
							<div style={{width: 110, textAlign: 'right', fontSize: 34, fontWeight: 700, color: palette.muted}}>{Math.round((s.it.amount / sum) * 100)}%</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
