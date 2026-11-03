import React from 'react';
import {editorial, type Palette} from '../theme';

/** Banknote (generic, no real currency art). Draw size via `w`; height is w*0.46. */
export const Bill: React.FC<{w?: number; value?: string; rot?: number; style?: React.CSSProperties; tint?: string}> = ({
	w = 220,
	value = '100',
	rot = 0,
	style,
	tint = '#2FA463',
}) => {
	const h = w * 0.46;
	return (
		<div style={{position: 'absolute', width: w, height: h, transform: `translate(-50%,-50%) rotate(${rot}deg)`, ...style}}>
			<svg width={w} height={h} viewBox="0 0 220 101" style={{display: 'block', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.18))'}}>
				<rect x={1} y={1} width={218} height={99} rx={9} fill={tint} stroke="#17673C" strokeWidth={2} />
				<rect x={9} y={9} width={202} height={83} rx={5} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeDasharray="2 4" />
				<circle cx={110} cy={50} r={27} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} />
				<text x={110} y={62} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" fontFamily="Inter">$</text>
				<text x={22} y={34} fontSize={18} fontWeight={900} fill="#fff" fontFamily="Inter">{value}</text>
				<text x={198} y={86} textAnchor="end" fontSize={18} fontWeight={900} fill="#fff" fontFamily="Inter">{value}</text>
			</svg>
		</div>
	);
};

export const Coin: React.FC<{size?: number; style?: React.CSSProperties; spin?: number}> = ({size = 70, style, spin = 0}) => (
	<div style={{position: 'absolute', width: size, height: size, transform: `translate(-50%,-50%) scaleX(${Math.cos(spin) || 0.05})`, ...style}}>
		<svg width={size} height={size} viewBox="0 0 70 70">
			<circle cx={35} cy={35} r={33} fill="#E8B23A" stroke="#A97A16" strokeWidth={3} />
			<circle cx={35} cy={35} r={24} fill="none" stroke="#FFE19A" strokeWidth={3} />
			<text x={35} y={46} textAnchor="middle" fontSize={30} fontWeight={900} fill="#8A6210" fontFamily="Inter">$</text>
		</svg>
	</div>
);

/** A neat stack of bills, `count` visible layers. */
export const CashStack: React.FC<{w?: number; count?: number; style?: React.CSSProperties}> = ({w = 220, count = 5, style}) => (
	<div style={{position: 'absolute', width: w, height: w * 0.46 + count * 9, transform: 'translate(-50%,-100%)', ...style}}>
		{Array.from({length: count}).map((_, i) => (
			<Bill key={i} w={w} style={{left: w / 2 + (i % 2 ? 3 : -3), top: w * 0.23 + (count - 1 - i) * 9}} />
		))}
	</div>
);

/** Wallet that opens (`open` 0..1) to reveal bills. */
export const Wallet: React.FC<{w?: number; open?: number; bills?: number; style?: React.CSSProperties}> = ({w = 300, open = 0, bills = 3, style}) => {
	const h = w * 0.68;
	return (
		<div style={{position: 'absolute', width: w, height: h, transform: 'translate(-50%,-50%)', ...style}}>
			{Array.from({length: bills}).map((_, i) => (
				<Bill key={i} w={w * 0.8} rot={-4 + i * 4} style={{left: w * 0.5 + (i - 1) * 14, top: h * 0.42 - open * (60 + i * 18), opacity: open > 0.02 ? 1 : 0}} />
			))}
			<svg width={w} height={h} viewBox="0 0 300 204" style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.25))'}}>
				<rect x={4} y={40} width={292} height={160} rx={22} fill="#2A2522" />
				<rect x={16} y={52} width={268} height={136} rx={14} fill="none" stroke="#4A423C" strokeWidth={3} strokeDasharray="7 7" />
				<g transform={`translate(0,${40 + open * -10}) rotate(${-open * 18},296,0)`}>
					<path d="M4,0H274Q296,0 296,22V72H210Q190,72 190,92V96H4Z" fill="#3A332E" />
					<circle cx={236} cy={46} r={9} fill="#C9B9A6" />
				</g>
			</svg>
		</div>
	);
};

/**
 * Receipt / bill (zig-zag bottom). `reveal` 0..1 prints the lines,
 * `stamp` 0..1 slams a PAID stamp, `tone` colours the total.
 */
export const Receipt: React.FC<{
	w?: number;
	title: string;
	lines: [string, string][];
	total: string;
	reveal?: number;
	stamp?: number;
	stampText?: string;
	totalTone?: 'danger' | 'accent' | 'ink';
	palette?: Palette;
	style?: React.CSSProperties;
	icon?: React.ReactNode;
}> = ({w = 360, title, lines, total, reveal = 1, stamp = 0, stampText = 'PAID', totalTone = 'danger', palette = editorial, style, icon}) => {
	const pad = w * 0.08;
	const fs = w * 0.052;
	const h = w * 0.36 + lines.length * fs * 1.9 + fs * 3.6;
	const zig = Array.from({length: 13}, (_, k) => 12 - k).map((i) => `L${((w / 12) * i).toFixed(1)},${h - (i % 2 ? 0 : 14)}`).join('');
	const color = totalTone === 'danger' ? palette.danger : totalTone === 'accent' ? palette.accent : palette.ink;
	return (
		<div style={{position: 'absolute', width: w, height: h, transform: 'translate(-50%,-50%)', ...style}}>
			<svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 18px 26px ${palette.shadow})`}}>
				<path d={`M0,0H${w}V${h - 14}${zig}Z`} fill="#FFFFFF" />
			</svg>
			<div style={{position: 'absolute', inset: 0, padding: pad, fontFamily: 'Inter', color: palette.ink}}>
				<div style={{display: 'flex', alignItems: 'center', gap: fs * 0.7}}>
					{icon}
					<div style={{fontSize: fs * 1.25, fontWeight: 900, letterSpacing: 1}}>{title}</div>
				</div>
				<div style={{borderTop: `3px dashed ${palette.line}`, margin: `${fs * 0.7}px 0`}} />
				{lines.map(([a, b], i) => {
					const o = Math.max(0, Math.min(1, reveal * (lines.length + 1) - i));
					return (
						<div key={a} style={{display: 'flex', justifyContent: 'space-between', fontSize: fs, fontWeight: 600, color: palette.body, lineHeight: 1.9, opacity: o, transform: `translateY(${(1 - o) * 10}px)`}}>
							<span>{a}</span>
							<span style={{fontVariantNumeric: 'tabular-nums'}}>{b}</span>
						</div>
					);
				})}
				<div style={{borderTop: `3px dashed ${palette.line}`, margin: `${fs * 0.6}px 0`}} />
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: Math.min(1, Math.max(0, reveal * (lines.length + 1) - lines.length))}}>
					<span style={{fontSize: fs * 1.05, fontWeight: 800, letterSpacing: 2, color: palette.muted}}>TOTAL</span>
					<span style={{fontSize: fs * 2.1, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', letterSpacing: -1}}>{total}</span>
				</div>
			</div>
			{stamp > 0 && (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '52%',
						transform: `translate(-50%,-50%) rotate(-14deg) scale(${1 + (1 - Math.min(1, stamp)) * 1.6})`,
						opacity: Math.min(1, stamp * 1.6),
						border: `${w * 0.018}px solid ${palette.accent}`,
						borderRadius: w * 0.03,
						padding: `${w * 0.01}px ${w * 0.05}px`,
						color: palette.accent,
						fontSize: w * 0.15,
						fontWeight: 900,
						letterSpacing: w * 0.012,
						fontFamily: 'Inter',
						background: 'rgba(255,255,255,0.75)',
					}}
				>
					{stampText}
				</div>
			)}
		</div>
	);
};

/**
 * Savings jar — the emergency fund. `level` 0..1 is how full it is,
 * `label`/`amount` sit on the jar's tag.
 */
export const SavingsJar: React.FC<{w?: number; level?: number; label?: string; amount?: string; palette?: Palette; style?: React.CSSProperties}> = ({
	w = 260,
	level = 1,
	label = 'EMERGENCY FUND',
	amount = '$500',
	palette = editorial,
	style,
}) => {
	const h = w * 1.25;
	const top = 70;
	const bottom = 312;
	const fillTop = bottom - (bottom - top - 10) * Math.max(0, Math.min(1, level));
	return (
		<div style={{position: 'absolute', width: w, height: h, transform: 'translate(-50%,-100%)', ...style}}>
			<svg width={w} height={h} viewBox="0 0 260 325" style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 16px 22px ${palette.shadow})`}}>
				<defs>
					<clipPath id="jarIn">
						<path d="M40,70H220Q246,70 246,100V290Q246,318 218,318H42Q14,318 14,290V100Q14,70 40,70Z" />
					</clipPath>
				</defs>
				<path d="M40,70H220Q246,70 246,100V290Q246,318 218,318H42Q14,318 14,290V100Q14,70 40,70Z" fill="rgba(255,255,255,0.55)" stroke="#121316" strokeWidth={6} />
				<g clipPath="url(#jarIn)">
					<rect x={0} y={fillTop} width={260} height={330} fill={palette.accent} />
					{[0, 1, 2, 3].map((i) => (
						<rect key={i} x={30 + i * 50} y={fillTop + 14 + (i % 2) * 22} width={44} height={20} rx={4} fill="#5BC58A" opacity={level > 0.15 ? 0.9 : 0} />
					))}
					<rect x={0} y={fillTop - 4} width={260} height={8} fill="#7FD9A6" />
				</g>
				<rect x={30} y={30} width={200} height={44} rx={10} fill="#121316" />
				<rect x={46} y={86} width={14} height={120} rx={7} fill="#fff" opacity={0.6} />
			</svg>
			<div
				style={{
					position: 'absolute',
					left: w * 0.08,
					right: w * 0.08,
					top: h * 0.42,
					background: palette.paper,
					border: '5px solid #121316',
					borderRadius: w * 0.05,
					textAlign: 'center',
					fontFamily: 'Inter',
					padding: `${w * 0.03}px 0`,
				}}
			>
				<div style={{fontSize: w * 0.056, fontWeight: 900, letterSpacing: 0.5, whiteSpace: 'nowrap', color: palette.muted}}>{label}</div>
				<div style={{fontSize: w * 0.17, fontWeight: 900, color: palette.ink, letterSpacing: -1, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{amount}</div>
			</div>
		</div>
	);
};
