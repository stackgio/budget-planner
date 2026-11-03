import React from 'react';
import {cinematic, type Palette} from '../theme';
import {NumberCounter} from './NumberCounter';

/**
 * Debt payoff meter: a 240° gauge. The green arc is what's been paid off,
 * the counter in the middle is what's left. Drive `remaining` from outside.
 */
export const DebtMeter: React.FC<{
	total: number;
	remaining: number;
	size?: number;
	palette?: Palette;
	label?: string;
	style?: React.CSSProperties;
	/** 0..1 extra glow pulse when a payment lands */
	hit?: number;
}> = ({total, remaining, size = 560, palette = cinematic, label = 'DEBT LEFT', style, hit = 0}) => {
	const paid = Math.max(0, Math.min(1, 1 - remaining / total));
	const cx = size / 2;
	const cy = size / 2;
	const r = size * 0.42;
	const sw = size * 0.075;
	const start = 150; // degrees, SVG polar (0 = right, clockwise)
	const sweep = 240;
	const pt = (deg: number, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
	const arcPath = (a0: number, a1: number) => {
		const [x0, y0] = pt(a0);
		const [x1, y1] = pt(a1);
		const large = a1 - a0 > 180 ? 1 : 0;
		return `M${x0},${y0}A${r},${r} 0 ${large} 1 ${x1},${y1}`;
	};
	const endA = start + sweep * paid;
	const [kx, ky] = pt(endA);
	const ticks = Array.from({length: 13}, (_, i) => start + (sweep * i) / 12);
	return (
		<div style={{position: 'absolute', width: size, height: size, fontFamily: 'Inter', ...style}}>
			<svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<linearGradient id="meterG" x1="0" y1="1" x2="1" y2="0">
						<stop offset="0%" stopColor={palette.accentDeep} />
						<stop offset="100%" stopColor={palette.accent} />
					</linearGradient>
				</defs>
				<path d={arcPath(start, start + sweep)} stroke={palette.line} strokeWidth={sw} fill="none" strokeLinecap="round" />
				{ticks.map((a, i) => {
					const [x0, y0] = pt(a, r - sw * 0.95);
					const [x1, y1] = pt(a, r - sw * (i % 3 === 0 ? 1.45 : 1.2));
					return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={palette.muted} strokeWidth={i % 3 === 0 ? 4 : 2} opacity={0.6} />;
				})}
				{paid > 0.002 && (
					<path
						d={arcPath(start, endA)}
						stroke="url(#meterG)"
						strokeWidth={sw}
						fill="none"
						strokeLinecap="round"
						style={{filter: palette.name === 'cinematic' ? `drop-shadow(0 0 ${10 + hit * 26}px rgba(44,212,122,${0.35 + hit * 0.4}))` : undefined}}
					/>
				)}
				<circle cx={kx} cy={ky} r={sw * 0.62} fill="#fff" stroke={palette.accent} strokeWidth={sw * 0.22} />
			</svg>
			<div style={{position: 'absolute', left: 0, right: 0, top: cy - size * 0.17, textAlign: 'center'}}>
				<div style={{fontSize: size * 0.05, fontWeight: 800, letterSpacing: size * 0.008, color: palette.muted}}>{label}</div>
				<div style={{display: 'flex', justifyContent: 'center', marginTop: size * 0.01}}>
					<NumberCounter value={remaining} fontSize={size * 0.15} color={palette.ink} />
				</div>
				<div style={{fontSize: size * 0.045, fontWeight: 800, color: palette.accent, marginTop: size * 0.01, fontVariantNumeric: 'tabular-nums'}}>
					{Math.round(paid * 100)}% PAID
				</div>
			</div>
		</div>
	);
};
