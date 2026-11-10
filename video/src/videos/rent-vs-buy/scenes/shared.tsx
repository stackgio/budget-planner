import React from 'react';
import {story, type Palette, editorial} from '../../../story/theme';
import {FACTS} from '../facts';

/** White / bright look for the finance explainer (same type system, brighter paper). */
export const white: Palette = {
	...editorial,
	bg: '#FFFFFF',
	bg2: '#F4F4F1',
	paper: '#FAFAF7',
	ink: '#0E0F12',
	accent: '#16A34A',
	accentDeep: '#15803D',
	accentSoft: 'rgba(22,163,74,0.12)',
	line: '#E5E5E0',
	muted: '#555A62',
};

/** Warm amber accent for the July AC scenes. */
export const AMBER = '#FFB547';
export const COOL = '#8FD3FF';

export const fmtUSD = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/**
 * The recurring illustrated "$5,000" AC estimate. Deliberately generic:
 * no contractor, no name/address, no payment confirmation.
 * `amount` lets the caller animate the figure (defaults to the settled fact).
 */
export const EstimateCard: React.FC<{w?: number; amount?: React.ReactNode; palette?: Palette; style?: React.CSSProperties; owner?: number}> = ({w = 640, amount, palette = editorial, style, owner = 0}) => {
	const fs = w / 640;
	return (
		<div
			style={{
				position: 'absolute',
				width: w,
				transform: 'translate(-50%,-50%)',
				background: '#FFFFFF',
				borderRadius: 28 * fs,
				boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
				fontFamily: story.font,
				color: palette.ink,
				overflow: 'hidden',
				...style,
			}}
		>
			<div style={{background: '#121316', color: '#F5F2EA', padding: `${22 * fs}px ${40 * fs}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontSize: 34 * fs, fontWeight: 900, letterSpacing: 6 * fs}}>ESTIMATE</div>
				<svg width={44 * fs} height={44 * fs} viewBox="0 0 40 40">
					{[0, 60, 120].map((r) => (
						<line key={r} x1="20" y1="3" x2="20" y2="37" stroke="#8FD3FF" strokeWidth="4" strokeLinecap="round" transform={`rotate(${r} 20 20)`} />
					))}
				</svg>
			</div>
			<div style={{padding: `${28 * fs}px ${40 * fs}px ${26 * fs}px`}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30 * fs, fontWeight: 700, color: '#2B2F36'}}>
					<span>AC replacement</span>
					<span style={{fontWeight: 800}}>1</span>
				</div>
				<div style={{borderTop: `${3 * fs}px dashed #E0D8C7`, margin: `${22 * fs}px 0 ${12 * fs}px`}} />
				<div style={{fontSize: 26 * fs, fontWeight: 800, letterSpacing: 4 * fs, color: '#857D6E'}}>TOTAL</div>
				<div style={{fontSize: 150 * fs, fontWeight: 900, letterSpacing: -4 * fs, color: '#D9472F', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>
					{amount ?? fmtUSD(FACTS.acRepair.value)}
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 14 * fs, marginTop: 10 * fs, height: 50 * fs}}>
					<div style={{fontSize: 28 * fs, fontWeight: 800, letterSpacing: 2 * fs, color: '#857D6E'}}>BILLED TO:</div>
					<div
						style={{
							fontSize: 34 * fs,
							fontWeight: 900,
							letterSpacing: 2 * fs,
							color: '#121316',
							background: `linear-gradient(90deg, rgba(226,167,46,0.55) ${owner * 100}%, transparent ${owner * 100}%)`,
							padding: `${2 * fs}px ${10 * fs}px`,
							borderRadius: 6 * fs,
							opacity: Math.min(1, owner * 3),
						}}
					>
						YOU
					</div>
				</div>
			</div>
			<div style={{background: '#F5F0E6', padding: `${14 * fs}px ${40 * fs}px`, fontSize: Math.max(24, 26 * fs), fontWeight: 700, color: '#857D6E', letterSpacing: 1}}>Illustrative estimate</div>
		</div>
	);
};

/** Small uppercase label chip. */
export const Chip: React.FC<{text: string; bg: string; color: string; size?: number; style?: React.CSSProperties; strike?: number}> = ({text, bg, color, size = 40, style, strike = 0}) => (
	<div
		style={{
			position: 'absolute',
			transform: 'translate(-50%,-50%)',
			background: bg,
			color,
			fontFamily: story.font,
			fontWeight: 900,
			fontSize: size,
			letterSpacing: size * 0.06,
			padding: `${size * 0.32}px ${size * 0.6}px`,
			borderRadius: size * 0.4,
			whiteSpace: 'nowrap',
			lineHeight: 1,
			...style,
		}}
	>
		<span style={{position: 'relative'}}>
			{text}
			{strike > 0 && <span style={{position: 'absolute', left: -6, right: -6, top: '48%', height: Math.max(5, size * 0.12), background: '#D9472F', transformOrigin: '0 50%', transform: `scaleX(${strike})`, borderRadius: 4}} />}
		</span>
	</div>
);

/** Uppercase kicker label. */
export const Kicker: React.FC<{text: string; color: string; size?: number; style?: React.CSSProperties}> = ({text, color, size = 34, style}) => (
	<div style={{position: 'absolute', fontFamily: story.font, fontWeight: 900, fontSize: size, letterSpacing: size * 0.14, color, whiteSpace: 'nowrap', ...style}}>{text}</div>
);
