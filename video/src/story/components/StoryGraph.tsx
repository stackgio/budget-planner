import React from 'react';
import {cinematic, type Palette} from '../theme';

export type GraphSeries = {
	id: string;
	values: number[]; // evenly spaced on x
	color: string;
	width?: number;
	dash?: string;
	fill?: boolean;
	/** label pinned to the line's end once drawn */
	endLabel?: React.ReactNode;
};

/**
 * Animated line graph for story videos (payoff curves, growth, comparisons).
 * Signature bold L-shaped axes (shared with the /graph engine). `progress`
 * 0..1 draws every series along x at the same rate so lengths are comparable.
 */
export const StoryGraph: React.FC<{
	w: number;
	h: number;
	series: GraphSeries[];
	progress: number;
	yMax: number;
	xLabels?: {at: number; text: string}[]; // at = 0..1 along x
	yLabels?: {v: number; text: string}[];
	palette?: Palette;
	pad?: {l: number; r: number; t: number; b: number};
	axisOpacity?: number;
	style?: React.CSSProperties;
	/** optional marker on an x position (0..1) with a label, e.g. "PAID OFF" */
	markers?: {at: number; seriesId: string; label: React.ReactNode; show: number}[];
}> = ({w, h, series, progress, yMax, xLabels = [], yLabels = [], palette = cinematic, pad = {l: 110, r: 40, t: 30, b: 70}, axisOpacity = 1, style, markers = []}) => {
	const PW = w - pad.l - pad.r;
	const PH = h - pad.t - pad.b;
	const maxLen = Math.max(...series.map((s) => s.values.length));
	const X = (i: number) => pad.l + (i / (maxLen - 1)) * PW;
	const Y = (v: number) => pad.t + PH - (v / yMax) * PH;
	const p = Math.max(0, Math.min(1, progress));
	const reach = p * (maxLen - 1);
	const pathOf = (vals: number[]) => {
		const last = Math.min(vals.length - 1, Math.floor(reach));
		let d = `M${X(0)},${Y(vals[0])}`;
		for (let i = 1; i <= last; i++) d += `L${X(i).toFixed(1)},${Y(vals[i]).toFixed(1)}`;
		if (reach < vals.length - 1 && reach > last) {
			const f = reach - last;
			const v = vals[last] + (vals[last + 1] - vals[last]) * f;
			d += `L${(X(last) + (X(last + 1) - X(last)) * f).toFixed(1)},${Y(v).toFixed(1)}`;
		}
		return d;
	};
	const tip = (vals: number[]) => {
		const r = Math.min(reach, vals.length - 1);
		const i = Math.floor(r);
		const f = r - i;
		const v = i + 1 < vals.length ? vals[i] + (vals[i + 1] - vals[i]) * f : vals[i];
		return [pad.l + (r / (maxLen - 1)) * PW, Y(v), r >= vals.length - 1] as const;
	};
	return (
		<div style={{position: 'absolute', width: w, height: h, fontFamily: 'Inter', ...style}}>
			<svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					{series.map((s) => (
						<linearGradient key={s.id} id={`sg-${s.id}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
							<stop offset="100%" stopColor={s.color} stopOpacity={0} />
						</linearGradient>
					))}
				</defs>
				<g opacity={axisOpacity}>
					{yLabels.map((t) => (
						<g key={t.v}>
							<line x1={pad.l} x2={pad.l + PW} y1={Y(t.v)} y2={Y(t.v)} stroke={palette.line} strokeWidth={2} />
							<text x={pad.l - 18} y={Y(t.v) + 9} textAnchor="end" fontSize={26} fontWeight={700} fill={palette.muted}>
								{t.text}
							</text>
						</g>
					))}
					{xLabels.map((t) => (
						<text key={t.text} x={pad.l + t.at * PW} y={pad.t + PH + 46} textAnchor="middle" fontSize={26} fontWeight={700} fill={palette.muted}>
							{t.text}
						</text>
					))}
					<path d={`M${pad.l},${pad.t - 14}L${pad.l},${pad.t + PH}L${pad.l + PW},${pad.t + PH}`} fill="none" stroke={palette.ink} strokeWidth={6} strokeLinecap="square" />
				</g>
				{series.map((s) =>
					s.fill ? (
						<path key={`f${s.id}`} d={`${pathOf(s.values)}L${tip(s.values)[0]},${pad.t + PH}L${X(0)},${pad.t + PH}Z`} fill={`url(#sg-${s.id})`} />
					) : null,
				)}
				{series.map((s) => (
					<path
						key={s.id}
						d={pathOf(s.values)}
						fill="none"
						stroke={s.color}
						strokeWidth={s.width ?? 8}
						strokeDasharray={s.dash}
						strokeLinecap="round"
						strokeLinejoin="round"
						style={palette.name === 'cinematic' && !s.dash ? {filter: `drop-shadow(0 0 10px ${s.color}66)`} : undefined}
					/>
				))}
				{series.map((s) => {
					const [tx, ty, done] = tip(s.values);
					return p > 0 ? <circle key={`t${s.id}`} cx={tx} cy={ty} r={done ? 11 : 13} fill={s.color} stroke={palette.bg} strokeWidth={5} /> : null;
				})}
				{markers.map((m) => {
					const s = series.find((ss) => ss.id === m.seriesId)!;
					const i = Math.round(m.at * (maxLen - 1));
					return m.show > 0 ? (
						<circle key={`m${m.seriesId}${m.at}`} cx={X(i)} cy={Y(s.values[Math.min(i, s.values.length - 1)])} r={18 + 10 * (1 - m.show)} fill="none" stroke={s.color} strokeWidth={5} opacity={m.show} />
					) : null;
				})}
			</svg>
			{series.map((s) => {
				const [tx, ty] = tip(s.values);
				return s.endLabel ? (
					<div key={`l${s.id}`} style={{position: 'absolute', left: tx, top: ty, transform: `translate(${tx > w - pad.r - 120 ? '-100%' : '-50%'}, -130%)`, whiteSpace: 'nowrap'}}>
						{s.endLabel}
					</div>
				) : null;
			})}
			{markers.map((m) => {
				const s = series.find((ss) => ss.id === m.seriesId)!;
				const i = Math.round(m.at * (maxLen - 1));
				return (
					<div key={`ml${m.seriesId}${m.at}`} style={{position: 'absolute', left: X(i), top: Y(s.values[Math.min(i, s.values.length - 1)]), transform: `translate(-50%, ${-150 - (1 - m.show) * 20}%)`, opacity: m.show, whiteSpace: 'nowrap'}}>
						{m.label}
					</div>
				);
			})}
		</div>
	);
};
