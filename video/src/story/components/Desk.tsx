import React from 'react';
import {AbsoluteFill} from 'remotion';
import {story} from '../theme';

/**
 * Overhead "real desk" kit: light stone surface in soft daylight, white paper
 * objects with natural contact + cast shadows (light from the upper left),
 * and generic props (debit card, car keys, repair estimate, pay stub).
 * Nothing here imitates a real bank, brand or app. Sample documents carry a
 * visible "EXAMPLE" label.
 */

export const desk = {
	stone: '#ECE8E1',
	stoneDeep: '#DCD6CC',
	paper: '#FFFFFF',
	paperWarm: '#FBFAF7',
	ink: '#111214',
	body: '#2A2D33',
	muted: '#8A857B',
	hair: '#E4E0D8',
	bar: '#E9E6E0',
	green: '#1E9E57',
	greenDeep: '#137A41',
	greenSoft: 'rgba(30,158,87,0.12)',
	gold: '#E2A72E',
	goldDeep: '#9A6B0E',
	goldSoft: 'rgba(226,167,46,0.16)',
};

/** Layered daylight shadow. `lift` 0 = lying flat, 1 = just picked up. */
export const paperShadow = (lift = 0) => {
	const k = 1 + lift * 1.6;
	return [
		`0 1px 1.5px rgba(46,38,26,0.16)`,
		`${3 * k}px ${5 * k}px ${10 * k}px rgba(46,38,26,${0.1 - lift * 0.02})`,
		`${10 * k}px ${22 * k}px ${44 * k}px rgba(46,38,26,${0.12 - lift * 0.03})`,
	].join(', ');
};

/** Light stone desktop: daylight falloff from the upper-left window, mottled stone, fine grain. */
export const StoneDesk: React.FC<{seed?: number}> = ({seed = 5}) => (
	<AbsoluteFill style={{background: desk.stone}}>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.22, mixBlendMode: 'multiply'}}>
			<filter id={`stone${seed}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={4} seed={seed} />
				<feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.58  0 0 0 0 0.52  0 0 0 0.9 -0.15" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#stone${seed})`} />
		</svg>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'multiply'}}>
			<filter id={`grain${seed}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed + 3} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#grain${seed})`} />
		</svg>
		{/* window daylight from the upper left, gentle falloff to the lower right */}
		<AbsoluteFill style={{background: 'radial-gradient(110% 75% at 8% 0%, rgba(255,253,247,0.75) 0%, rgba(255,253,247,0) 62%)'}} />
		<AbsoluteFill style={{background: 'radial-gradient(120% 90% at 100% 105%, rgba(70,58,40,0.13) 0%, rgba(70,58,40,0) 60%)'}} />
		{/* very soft window-frame light bands */}
		<AbsoluteFill style={{background: 'linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.10) 38%, rgba(255,255,255,0) 46%, rgba(255,255,255,0) 54%, rgba(255,255,255,0.07) 60%, rgba(255,255,255,0) 66%)'}} />
	</AbsoluteFill>
);

const font = story.font;

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 24, color = desk.muted, style}) => (
	<div style={{fontFamily: font, fontSize: size, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color, lineHeight: 1.1, ...style}}>{children}</div>
);

/** White account card (top-down). Children are absolutely positioned inside. */
export const AccountCard: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	rot?: number;
	scale?: number;
	lift?: number;
	/** 0..1 green highlight ring + tint */
	highlight?: number;
	highlightColor?: string;
	/** 0..1 de-emphasis (kept visible for context) */
	dim?: number;
	opacity?: number;
	children?: React.ReactNode;
}> = ({x, y, w, h, rot = 0, scale = 1, lift = 0, highlight = 0, highlightColor = desk.green, dim = 0, opacity = 1, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			borderRadius: 26,
			background: desk.paper,
			boxShadow: `${paperShadow(lift)}, inset 0 0 0 ${highlight * 7}px ${highlightColor}`,
			transform: `rotate(${rot}deg) scale(${scale})`,
			transformOrigin: '50% 50%',
			opacity,
			overflow: 'hidden',
			fontFamily: font,
		}}
	>
		<div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(255,255,255,0) 40%, rgba(70,58,40,0.035) 100%)`}} />
		{highlight > 0 && <div style={{position: 'absolute', inset: 0, background: highlightColor, opacity: 0.07 * highlight}} />}
		{children}
		{dim > 0 && <div style={{position: 'absolute', inset: 0, background: desk.stone, opacity: dim * 0.55}} />}
	</div>
);

/** Generic matte debit card — no issuer, no logo, no number. 85.6 × 54 mm proportions. */
export const DebitCard: React.FC<{x: number; y: number; w?: number; rot?: number; lift?: number}> = ({x, y, w = 330, rot = 0, lift = 0}) => {
	const h = w / 1.586;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: w * 0.045,
				background: 'linear-gradient(135deg, #2A2C31 0%, #17181B 55%, #0F1012 100%)',
				boxShadow: paperShadow(lift),
				transform: `rotate(${rot}deg)`,
				overflow: 'hidden',
				fontFamily: font,
			}}
		>
			<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)'}} />
			{/* chip */}
			<div style={{position: 'absolute', left: w * 0.1, top: h * 0.36, width: w * 0.14, height: w * 0.105, borderRadius: 6, background: 'linear-gradient(135deg,#E9D9A6,#B99A52)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)'}}>
				<div style={{position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.25)'}} />
				<div style={{position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.25)'}} />
				<div style={{position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.25)'}} />
			</div>
			{/* contactless mark */}
			<svg width={w * 0.07} height={w * 0.09} viewBox="0 0 20 26" style={{position: 'absolute', left: w * 0.28, top: h * 0.37}}>
				{[4, 9, 14].map((r, i) => (
					<path key={i} d={`M ${4 + i * 4} ${13 - r * 0.7} Q ${8 + i * 5} 13 ${4 + i * 4} ${13 + r * 0.7}`} stroke="rgba(255,255,255,0.55)" strokeWidth={2} fill="none" strokeLinecap="round" />
				))}
			</svg>
			<div style={{position: 'absolute', right: w * 0.08, bottom: h * 0.1, fontSize: w * 0.075, fontWeight: 800, letterSpacing: 3, color: 'rgba(255,255,255,0.8)'}}>DEBIT</div>
			<div style={{position: 'absolute', left: w * 0.1, bottom: h * 0.14, display: 'flex', gap: 10}}>
				{[0, 1, 2, 3].map((i) => (
					<div key={i} style={{width: w * 0.1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.22)'}} />
				))}
			</div>
		</div>
	);
};

/** Top-down car keys: fob with buttons, ring, metal key, small leather tag. Size ≈ 300 px long at scale 1. */
export const CarKeys: React.FC<{x: number; y: number; scale?: number; rot?: number; lift?: number; jiggle?: number}> = ({x, y, scale = 1, rot = 0, lift = 0, jiggle = 0}) => {
	const sh = 6 + lift * 40;
	const so = 0.28 - lift * 0.1;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: 320, height: 240, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: '50% 50%'}}>
			<svg width={320} height={240} viewBox="0 0 320 240" style={{overflow: 'visible', filter: `drop-shadow(${sh * 0.5}px ${sh}px ${sh * 0.9}px rgba(46,38,26,${so})) drop-shadow(0 1px 1px rgba(46,38,26,0.3))`}}>
				<defs>
					<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#F2F2F0" />
						<stop offset="0.45" stopColor="#B9BBBE" />
						<stop offset="0.7" stopColor="#E4E5E6" />
						<stop offset="1" stopColor="#8E9196" />
					</linearGradient>
					<linearGradient id="fob" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#34363B" />
						<stop offset="1" stopColor="#141518" />
					</linearGradient>
					<linearGradient id="leather" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#B07A4C" />
						<stop offset="1" stopColor="#7A4E2C" />
					</linearGradient>
				</defs>
				{/* metal key (blade toward lower right) */}
				<g transform={`rotate(${28 + jiggle * 6} 150 110)`}>
					<circle cx={150} cy={110} r={24} fill="url(#metal)" stroke="#8E9196" strokeWidth={1.5} />
					<circle cx={150} cy={96} r={6} fill="#ECE8E1" stroke="#8E9196" strokeWidth={1} />
					<path d="M 168 116 L 262 116 L 268 122 L 262 130 L 252 130 L 248 126 L 242 132 L 236 126 L 228 132 L 222 126 L 168 128 Z" fill="url(#metal)" stroke="#8E9196" strokeWidth={1.2} />
					<line x1={176} y1={121} x2={256} y2={121} stroke="rgba(0,0,0,0.18)" strokeWidth={1.5} />
				</g>
				{/* leather tag */}
				<g transform={`rotate(${-62 - jiggle * 5} 150 110)`}>
					<rect x={160} y={98} width={92} height={26} rx={13} fill="url(#leather)" />
					<circle cx={240} cy={111} r={4} fill="rgba(0,0,0,0.25)" />
					<line x1={170} y1={104} x2={232} y2={104} stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="4 4" />
				</g>
				{/* split ring */}
				<circle cx={150} cy={110} r={30} fill="none" stroke="url(#metal)" strokeWidth={5} />
				<circle cx={150} cy={110} r={30} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
				{/* fob */}
				<g transform={`rotate(${160 + jiggle * 4} 150 110)`}>
					<rect x={170} y={84} width={118} height={56} rx={26} fill="url(#fob)" />
					<rect x={176} y={88} width={106} height={14} rx={7} fill="rgba(255,255,255,0.07)" />
					{[196, 228, 260].map((cx, i) => (
						<g key={i}>
							<circle cx={cx} cy={112} r={11} fill="#22242A" stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} />
							{i === 0 && <rect x={cx - 4} y={109} width={8} height={7} rx={1.5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} />}
							{i === 1 && <rect x={cx - 4} y={109} width={8} height={7} rx={1.5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} />}
							{i === 2 && <path d={`M ${cx - 5} ${116} L ${cx} ${106} L ${cx + 5} ${116} Z`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} />}
						</g>
					))}
					<rect x={160} y={104} width={16} height={12} rx={4} fill="url(#metal)" />
				</g>
			</svg>
		</div>
	);
};

const Bar: React.FC<{w: number | string; h?: number; c?: string; style?: React.CSSProperties}> = ({w, h = 14, c = desk.bar, style}) => (
	<div style={{width: w, height: h, borderRadius: h / 2, background: c, ...style}} />
);

/** A sheet of paper on the desk. */
export const Paper: React.FC<{x: number; y: number; w: number; h: number; rot?: number; lift?: number; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, lift = 0, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			background: desk.paperWarm,
			borderRadius: 4,
			boxShadow: paperShadow(lift),
			transform: `rotate(${rot}deg)`,
			fontFamily: font,
			overflow: 'hidden',
		}}
	>
		<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(255,255,255,0) 55%, rgba(70,58,40,0.05) 100%)'}} />
		{children}
	</div>
);

export const ExampleTag: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 24, style}) => (
	<div
		style={{
			display: 'inline-block',
			padding: `${size * 0.22}px ${size * 0.55}px`,
			borderRadius: 8,
			border: `2px solid ${desk.muted}`,
			color: desk.muted,
			fontSize: size,
			fontWeight: 800,
			letterSpacing: 3,
			lineHeight: 1,
			...style,
		}}
	>
		EXAMPLE
	</div>
);

/** Generic repair estimate (no amounts, no shop name). */
export const RepairEstimate: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number}> = ({x, y, w = 430, h = 520, rot = 0}) => (
	<Paper x={x} y={y} w={w} h={h} rot={rot}>
		<div style={{position: 'absolute', left: 34, top: 32, right: 34}}>
			<div style={{fontSize: 40, fontWeight: 900, letterSpacing: -0.5, color: desk.ink, lineHeight: 1}}>REPAIR</div>
			<div style={{fontSize: 40, fontWeight: 900, letterSpacing: -0.5, color: desk.ink, lineHeight: 1.05}}>ESTIMATE</div>
			<ExampleTag size={18} style={{position: 'absolute', right: 0, top: 4}} />
			<div style={{height: 3, background: desk.ink, marginTop: 16, marginBottom: 18}} />
			{[
				['VEHICLE', 150],
				['ISSUE', 190],
				['PARTS', 120],
				['LABOR', 140],
			].map(([l, bw]) => (
				<div key={l as string} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17}}>
					<div style={{fontSize: 18, fontWeight: 800, letterSpacing: 2.5, color: desk.muted}}>{l}</div>
					<Bar w={bw as number} />
				</div>
			))}
			<div style={{height: 2, background: desk.hair, margin: '6px 0 18px'}} />
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontSize: 20, fontWeight: 900, letterSpacing: 2, color: desk.ink}}>TOTAL</div>
				<Bar w={130} h={18} c="#DCD8D0" />
			</div>
		</div>
	</Paper>
);

/** Neutral sample pay stub: no tax lines, no pre/post-tax wording, amounts as grey bars. */
export const PayStub: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number; lineHighlight?: number; lineLifted?: number}> = ({
	x,
	y,
	w = 540,
	h = 470,
	rot = 0,
	lineHighlight = 0,
	lineLifted = 0,
}) => (
	<Paper x={x} y={y} w={w} h={h} rot={rot}>
		<div style={{position: 'absolute', left: 36, top: 30, right: 36}}>
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				<div style={{fontSize: 38, fontWeight: 900, letterSpacing: -0.5, color: desk.ink}}>PAY STUB</div>
				<ExampleTag size={20} />
			</div>
			<div style={{display: 'flex', gap: 28, marginTop: 14}}>
				<div>
					<div style={{fontSize: 16, fontWeight: 800, letterSpacing: 2.5, color: desk.muted}}>EMPLOYEE</div>
					<Bar w={150} style={{marginTop: 8}} />
				</div>
				<div>
					<div style={{fontSize: 16, fontWeight: 800, letterSpacing: 2.5, color: desk.muted}}>PAY PERIOD</div>
					<Bar w={130} style={{marginTop: 8}} />
				</div>
			</div>
			<div style={{height: 3, background: desk.ink, margin: '20px 0 16px'}} />
			<div style={{fontSize: 18, fontWeight: 900, letterSpacing: 2.5, color: desk.ink, marginBottom: 12}}>EARNINGS</div>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
				<div style={{fontSize: 22, fontWeight: 700, color: desk.body}}>Regular pay</div>
				<Bar w={120} />
			</div>
			<div style={{fontSize: 18, fontWeight: 900, letterSpacing: 2.5, color: desk.ink, marginBottom: 8}}>DEDUCTIONS</div>
			{/* the 401(k) line — highlighted, then its amount lifts away */}
			<div
				style={{
					position: 'relative',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '10px 12px',
					margin: '0 -12px 6px',
					borderRadius: 10,
					background: `rgba(30,158,87,${0.12 * lineHighlight})`,
					boxShadow: `inset 0 0 0 ${3 * lineHighlight}px ${desk.green}`,
				}}
			>
				<div style={{fontSize: 22, fontWeight: 800, color: desk.ink}}>401(k) contribution</div>
				<Bar w={90} c={lineLifted > 0.5 ? 'rgba(30,158,87,0.25)' : desk.bar} style={{opacity: 1 - lineLifted * 0.6}} />
			</div>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0'}}>
				<div style={{fontSize: 22, fontWeight: 700, color: desk.body}}>Other deductions</div>
				<Bar w={100} />
			</div>
			<div style={{height: 2, background: desk.hair, margin: '10px 0 16px'}} />
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontSize: 22, fontWeight: 900, letterSpacing: 2, color: desk.ink}}>NET PAY</div>
				<Bar w={140} h={18} c="#DCD8D0" />
			</div>
		</div>
	</Paper>
);

/** Pen, for desk realism. */
export const Pen: React.FC<{x: number; y: number; rot?: number; len?: number}> = ({x, y, rot = 0, len = 300}) => (
	<div style={{position: 'absolute', left: x, top: y, width: len, height: 22, transform: `rotate(${rot}deg)`, transformOrigin: '0 50%', filter: 'drop-shadow(5px 9px 7px rgba(46,38,26,0.25))'}}>
		<div style={{position: 'absolute', left: 18, top: 0, width: len - 18, height: 22, borderRadius: 11, background: 'linear-gradient(180deg,#2A2C31 0%,#121316 60%,#26282D 100%)'}} />
		<div style={{position: 'absolute', left: 0, top: 5, width: 26, height: 12, background: 'linear-gradient(180deg,#D9D9D6,#9C9EA2)', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)'}} />
		<div style={{position: 'absolute', right: 40, top: -3, width: 90, height: 8, borderRadius: 4, background: 'linear-gradient(180deg,#E6E6E3,#9C9EA2)'}} />
	</div>
);
