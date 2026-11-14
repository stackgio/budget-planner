import React from 'react';
import {dmm} from '../theme';

/**
 * A shallow 2.5D glass tray (seen slightly from above) holding a liquid level.
 * `level` 0..1, `tone` decides the liquid (accent = money kept, muted = spent),
 * `glow` 0..1 adds an internal light. Everything in world coordinates.
 */
export const Tray: React.FC<{cx: number; cy: number; w: number; h?: number; level: number; tone: 'accent' | 'muted'; glow?: number; wobble?: number}> = ({
	cx,
	cy,
	w,
	h = 92,
	level,
	tone,
	glow = 0,
	wobble = 0,
}) => {
	const c = dmm.color;
	const rx = w / 2;
	const ry = w * 0.075;
	const top = cy - h / 2;
	const bot = cy + h / 2;
	const inset = w * 0.08; // bowl tapers toward the base
	const id = `tray${Math.round(cx)}_${Math.round(cy)}`;
	const liquidTop = bot - (h - 6) * Math.max(0, Math.min(1, level));
	const lw = rx - inset * (1 - (bot - liquidTop) / h); // liquid surface half-width at its height
	const liquid = tone === 'accent' ? c.accent : '#C9CDD3';
	const bowl = `M ${cx - rx} ${top} L ${cx - rx + inset} ${bot} A ${rx - inset} ${ry * 0.8} 0 0 0 ${cx + rx - inset} ${bot} L ${cx + rx} ${top} Z`;
	return (
		<g>
			<defs>
				<clipPath id={`${id}c`}>
					<path d={bowl} />
				</clipPath>
				<linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={liquid} stopOpacity={tone === 'accent' ? 0.95 : 0.55} />
					<stop offset="100%" stopColor={liquid} stopOpacity={tone === 'accent' ? 0.55 : 0.25} />
				</linearGradient>
				<radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={c.accent} stopOpacity={0.45 * glow} />
					<stop offset="100%" stopColor={c.accent} stopOpacity={0} />
				</radialGradient>
			</defs>
			{glow > 0 && <ellipse cx={cx} cy={cy} rx={w * 0.95} ry={h * 1.6} fill={`url(#${id}g)`} />}
			{/* back rim */}
			<path d={`M ${cx - rx} ${top} A ${rx} ${ry} 0 0 1 ${cx + rx} ${top}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
			{/* bowl volume */}
			<path d={bowl} fill="rgba(255,255,255,0.035)" />
			{/* liquid */}
			{level > 0.002 && (
				<g clipPath={`url(#${id}c)`}>
					<rect x={cx - rx} y={liquidTop} width={w} height={bot - liquidTop + ry} fill={`url(#${id}l)`} />
					<ellipse cx={cx} cy={liquidTop} rx={lw} ry={ry * 0.85 * (1 + wobble * 0.3)} fill={liquid} opacity={tone === 'accent' ? 0.9 : 0.5} />
				</g>
			)}
			{/* front walls + rim */}
			<path d={bowl} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={2.5} strokeLinejoin="round" />
			<path d={`M ${cx - rx} ${top} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
			<path d={`M ${cx - rx + 14} ${top + 10} L ${cx - rx + inset + 10} ${bot - 6}`} stroke="rgba(255,255,255,0.22)" strokeWidth={5} strokeLinecap="round" />
		</g>
	);
};

/** A falling liquid stream between two points; `width` 0 hides it. Animated texture via `phase`. */
export const Stream: React.FC<{x: number; y0: number; y1: number; width: number; tone: 'accent' | 'muted'; phase: number}> = ({x, y0, y1, width, tone, phase}) => {
	if (width <= 0.3 || y1 <= y0) return null;
	const col = tone === 'accent' ? dmm.color.accent : '#C9CDD3';
	const id = `st${Math.round(x)}_${Math.round(y0)}`;
	return (
		<g>
			<defs>
				<linearGradient id={id} x1="0" y1={0} x2="0" y2={1}>
					<stop offset="0%" stopColor={col} stopOpacity={0.95} />
					<stop offset="100%" stopColor={col} stopOpacity={0.7} />
				</linearGradient>
			</defs>
			<rect x={x - width / 2} y={y0} width={width} height={y1 - y0} rx={width / 2} fill={`url(#${id})`} />
			<line x1={x - width * 0.15} x2={x - width * 0.15} y1={y0} y2={y1} stroke="rgba(255,255,255,0.55)" strokeWidth={Math.max(1, width * 0.18)} strokeDasharray="14 22" strokeDashoffset={-phase * 9} />
		</g>
	);
};
