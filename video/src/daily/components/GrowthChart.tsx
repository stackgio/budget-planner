import React from 'react';
import {dmm} from '../theme';

type Series = number[];

const sample = (s: Series, idx: number) => {
	const i = Math.max(0, Math.min(s.length - 1, idx));
	const a = Math.floor(i);
	const b = Math.min(s.length - 1, a + 1);
	return s[a] + (s[b] - s[a]) * (i - a);
};

/**
 * Contributions-vs-value growth chart. `value` is drawn as an emerald area with
 * a leading dot; `base` (money actually put in) is a dashed muted line, so the
 * gap between them *is* the growth. `progress` 0..1 reveals the series
 * continuously (sub-sample interpolation, no stepping).
 */
export const GrowthChart: React.FC<{
	w: number;
	h: number;
	value: Series;
	base?: Series;
	progress: number;
	yMax: number;
	xLabels?: {at: number; text: string}[]; // at = 0..1 along x
	gapReveal?: number; // 0..1 bracket between base and value at the tip
	gapLabel?: React.ReactNode;
	baseLabel?: string;
	baseLabelReveal?: number;
}> = ({w, h, value, base, progress, yMax, xLabels = [], gapReveal = 0, gapLabel, baseLabel, baseLabelReveal = 0}) => {
	const c = dmm.color;
	const padB = 44;
	const ch = h - padB;
	const n = value.length - 1;
	const tip = Math.max(0, Math.min(1, progress)) * n;
	const X = (i: number) => (i / n) * w;
	const Y = (v: number) => ch - (v / yMax) * ch;
	const path = (s: Series) => {
		const pts: string[] = [];
		const whole = Math.floor(tip);
		for (let i = 0; i <= whole; i++) pts.push(`${X(i).toFixed(1)},${Y(s[i]).toFixed(1)}`);
		if (tip > whole) pts.push(`${X(tip).toFixed(1)},${Y(sample(s, tip)).toFixed(1)}`);
		return pts;
	};
	const vPts = path(value);
	const tipX = X(tip);
	const tipY = Y(sample(value, tip));
	const baseTipY = base ? Y(sample(base, tip)) : ch;
	return (
		<svg width={w} height={h} style={{overflow: 'visible', display: 'block'}}>
			<defs>
				<linearGradient id="dmmArea" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={c.accent} stopOpacity={0.34} />
					<stop offset="100%" stopColor={c.accent} stopOpacity={0} />
				</linearGradient>
			</defs>
			{[0.25, 0.5, 0.75, 1].map((g) => (
				<line key={g} x1={0} x2={w} y1={ch - g * ch} y2={ch - g * ch} stroke={c.grid} strokeWidth={2} />
			))}
			<line x1={0} x2={w} y1={ch} y2={ch} stroke="rgba(255,255,255,0.22)" strokeWidth={3} />
			{xLabels.map((l) => (
				<text key={l.text} x={l.at * w} y={h - 6} fill={c.muted} fontSize={24} fontWeight={700} letterSpacing={2} textAnchor={l.at === 0 ? 'start' : l.at === 1 ? 'end' : 'middle'} fontFamily={dmm.font}>
					{l.text}
				</text>
			))}
			{tip > 0 && vPts.length > 1 && (
				<>
					<polygon points={`0,${ch} ${vPts.join(' ')} ${tipX.toFixed(1)},${ch}`} fill="url(#dmmArea)" />
					{base && <polyline points={path(base).join(' ')} fill="none" stroke={c.muted} strokeWidth={4} strokeDasharray="12 12" strokeLinecap="round" opacity={0.9} />}
					<polyline points={vPts.join(' ')} fill="none" stroke={c.accent} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
				</>
			)}
			{base && baseLabel && baseLabelReveal > 0 && (
				<text x={X(tip * 0.58)} y={Y(sample(base, tip * 0.58)) + 46} fill={c.muted} fontSize={24} fontWeight={800} letterSpacing={2} textAnchor="middle" opacity={baseLabelReveal} fontFamily={dmm.font}>
					{baseLabel}
				</text>
			)}
			{gapReveal > 0 && base && (
				<g opacity={Math.min(1, gapReveal * 1.5)}>
					<line
						x1={tipX + 26}
						x2={tipX + 26}
						y1={baseTipY - 6}
						y2={baseTipY - 6 - (baseTipY - tipY - 12) * gapReveal}
						stroke={c.accent}
						strokeWidth={4}
						strokeLinecap="round"
					/>
					<line x1={tipX + 16} x2={tipX + 36} y1={baseTipY - 6} y2={baseTipY - 6} stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
					{gapReveal > 0.98 && <line x1={tipX + 16} x2={tipX + 36} y1={tipY + 6} y2={tipY + 6} stroke={c.accent} strokeWidth={4} strokeLinecap="round" />}
				</g>
			)}
			{tip > 0 && (
				<>
					<circle cx={tipX} cy={tipY} r={22} fill={c.accent} opacity={0.18} />
					<circle cx={tipX} cy={tipY} r={11} fill={c.accent} stroke={c.bg} strokeWidth={4} />
				</>
			)}
			{gapLabel && gapReveal > 0 && (
				<foreignObject x={tipX - 360} y={(tipY + baseTipY) / 2 - 36} width={330} height={72} style={{overflow: 'visible'}}>
					{gapLabel}
				</foreignObject>
			)}
		</svg>
	);
};
