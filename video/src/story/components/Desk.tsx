import React from 'react';
import {AbsoluteFill} from 'remotion';
import {editorial} from '../theme';

/**
 * "Desk shoot" kit: a warm off-white desk surface photographed top-down with
 * soft window light, plus paper props (account cards, a repair estimate, a pay
 * stub) and car keys. Everything is illustrative: no bank UI, no real logos.
 */

export const desk = {
	surface: '#EEE8DC',
	paper: '#FFFFFF',
	ink: '#121316',
	muted: '#8A8274',
	hair: '#E6E0D3',
	/** natural, slightly warm contact + ambient shadow; `lift` 0..1 raises the object */
	shadow: (lift = 0) =>
		`0 1px 1px rgba(70,52,25,0.10), 0 ${3 + lift * 6}px ${6 + lift * 10}px rgba(70,52,25,${0.08 + lift * 0.04}), 0 ${14 + lift * 26}px ${34 + lift * 40}px rgba(70,52,25,${0.11 + lift * 0.07})`,
};

/** Top-down desk: off-white linen-paper surface, window light from the top-left, gentle falloff. */
export const DeskSurface: React.FC<{light?: number; seed?: number}> = ({light = 1, seed = 11}) => (
	<AbsoluteFill style={{background: desk.surface}}>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'multiply'}}>
			<filter id={`desk-fibre${seed}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves={3} seed={seed} />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#desk-fibre${seed})`} />
		</svg>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'multiply'}}>
			<filter id={`desk-grain${seed}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed + 1} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#desk-grain${seed})`} />
		</svg>
		<AbsoluteFill style={{background: `radial-gradient(110% 65% at 18% 6%, rgba(255,252,244,${0.75 * light}) 0%, rgba(255,252,244,0) 62%)`}} />
		<AbsoluteFill style={{background: 'radial-gradient(130% 85% at 55% 48%, rgba(0,0,0,0) 58%, rgba(84,64,32,0.16) 100%)'}} />
	</AbsoluteFill>
);

/**
 * A white account card lying on the desk. Positioned by its top-left corner.
 * `lift` raises it (bigger shadow, tiny scale), `highlight` draws the green
 * edge, `dim` pushes it back while the other card is explained.
 */
export const AccountCard: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	rot?: number;
	lift?: number;
	highlight?: number;
	dim?: number;
	accent?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({x, y, w, h, rot = 0, lift = 0, highlight = 0, dim = 0, accent = editorial.accent, style, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			borderRadius: 26,
			background: desk.paper,
			boxShadow: desk.shadow(lift),
			transform: `translateY(${-lift * 10}px) rotate(${rot}deg) scale(${1 + lift * 0.03})`,
			transformOrigin: '50% 60%',
			...style,
		}}
	>
		<div style={{position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden'}}>
			{/* paper sheen from the window light */}
			<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0) 40%, rgba(120,100,60,0.035) 100%)'}} />
			{/* green top edge on highlight */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: accent, transform: `scaleY(${highlight})`, transformOrigin: 'top'}} />
		</div>
		<div style={{position: 'absolute', inset: 0, borderRadius: 26, boxShadow: `inset 0 0 0 ${5 * highlight}px ${accent}`}} />
		{children}
		<div style={{position: 'absolute', inset: -2, borderRadius: 28, background: desk.surface, opacity: dim * 0.5, pointerEvents: 'none'}} />
	</div>
);

/** Car keys (ring + fob + blade) seen from above. Centered on (x, y). */
export const CarKeys: React.FC<{x: number; y: number; w?: number; rot?: number; shadowLift?: number}> = ({x, y, w = 420, rot = 0, shadowLift = 0}) => {
	const h = w * 0.62;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translate(-50%,-50%) rotate(${rot}deg)`}}>
			<svg
				width={w}
				height={h}
				viewBox="0 0 420 260"
				style={{display: 'block', overflow: 'visible', filter: `drop-shadow(0 ${3 + shadowLift * 18}px ${4 + shadowLift * 14}px rgba(60,44,20,${0.32 - shadowLift * 0.1}))`}}
			>
				<defs>
					<linearGradient id="kmetal" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#F4F4F2" />
						<stop offset="0.45" stopColor="#B9BBBD" />
						<stop offset="0.7" stopColor="#E3E4E3" />
						<stop offset="1" stopColor="#8E9194" />
					</linearGradient>
					<linearGradient id="kfob" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#2E3034" />
						<stop offset="1" stopColor="#141518" />
					</linearGradient>
					<radialGradient id="kbtn" cx="0.4" cy="0.35" r="0.7">
						<stop offset="0" stopColor="#4A4D53" />
						<stop offset="1" stopColor="#24262A" />
					</radialGradient>
				</defs>
				{/* split ring */}
				<circle cx={88} cy={96} r={58} fill="none" stroke="url(#kmetal)" strokeWidth={9} />
				<circle cx={88} cy={96} r={58} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeDasharray="40 320" strokeDashoffset={-30} />
				{/* fob */}
				<g transform="translate(130,40) rotate(14)">
					<rect x={0} y={0} width={170} height={96} rx={42} fill="url(#kfob)" />
					<rect x={6} y={5} width={158} height={30} rx={15} fill="rgba(255,255,255,0.07)" />
					<circle cx={52} cy={50} r={16} fill="url(#kbtn)" stroke="#0C0D0F" strokeWidth={2} />
					<circle cx={98} cy={50} r={16} fill="url(#kbtn)" stroke="#0C0D0F" strokeWidth={2} />
					<rect x={130} y={36} width={22} height={28} rx={8} fill="url(#kbtn)" stroke="#0C0D0F" strokeWidth={2} />
					<path d="M45,50 l7,-7 l7,7" fill="none" stroke="#9EA2A8" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
					<path d="M91,46 h14 M91,54 h14" stroke="#9EA2A8" strokeWidth={3} strokeLinecap="round" />
					<rect x={-14} y={30} width={22} height={34} rx={8} fill="url(#kmetal)" />
				</g>
				{/* metal key */}
				<g transform="translate(40,140) rotate(-8)">
					<circle cx={30} cy={30} r={30} fill="url(#kmetal)" stroke="#7E8184" strokeWidth={2} />
					<circle cx={30} cy={30} r={9} fill="#EEE8DC" stroke="#7E8184" strokeWidth={2} />
					<path
						d="M58,20 H250 l14,10 l-14,10 H232 l-6,8 l-8,-8 l-8,8 l-8,-8 l-8,8 l-8,-8 H58 Z"
						fill="url(#kmetal)"
						stroke="#7E8184"
						strokeWidth={2}
						strokeLinejoin="round"
					/>
					<line x1={66} y1={30} x2={244} y2={30} stroke="rgba(90,92,96,0.5)" strokeWidth={2} />
				</g>
			</svg>
		</div>
	);
};

/** A shop repair estimate sheet. Line-item prices sit in a column that can be framed off-screen. */
export const RepairEstimate: React.FC<{x: number; y: number; w?: number; rot?: number; style?: React.CSSProperties; mark?: number; markColor?: string}> = ({
	x,
	y,
	w = 640,
	rot = 0,
	style,
	mark = 0,
	markColor = editorial.accent,
}) => {
	const s = w / 640;
	const line = (top: number, label: string) => (
		<div key={label} style={{position: 'absolute', left: 48 * s, right: 48 * s, top: top * s, height: 54 * s, borderBottom: `${2 * s}px solid ${desk.hair}`, display: 'flex', alignItems: 'center'}}>
			<span style={{fontSize: 30 * s, fontWeight: 600, color: '#3A3D44'}}>{label}</span>
		</div>
	);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: 860 * s,
				background: '#FFFEFB',
				borderRadius: 6 * s,
				boxShadow: desk.shadow(0),
				transform: `rotate(${rot}deg)`,
				fontFamily: 'Inter',
				...style,
			}}
		>
			<div style={{position: 'absolute', left: 48 * s, top: 54 * s, fontSize: 26 * s, fontWeight: 700, letterSpacing: 3 * s, color: desk.muted}}>NEIGHBORHOOD AUTO</div>
			<div style={{position: 'absolute', left: 48 * s, top: 96 * s, fontSize: 52 * s, fontWeight: 900, letterSpacing: -1, color: desk.ink}}>
				Repair estimate
				<div style={{position: 'absolute', left: -6 * s, right: -10 * s, bottom: 2 * s, height: 18 * s, background: markColor, opacity: 0.28, transform: `scaleX(${mark})`, transformOrigin: 'left', zIndex: -1}} />
			</div>
			<div style={{position: 'absolute', left: 48 * s, top: 176 * s, fontSize: 26 * s, fontWeight: 600, color: desk.muted}}>Vehicle check-in · Front brakes</div>
			{line(250, 'Brake pads')}
			{line(310, 'Rotors, front')}
			{line(370, 'Labor')}
			{line(430, 'Shop supplies')}
			<div style={{position: 'absolute', left: 48 * s, right: 48 * s, top: 520 * s, borderTop: `${4 * s}px solid ${desk.ink}`, paddingTop: 16 * s, fontSize: 34 * s, fontWeight: 900, color: desk.ink}}>Estimated total</div>
			<div style={{position: 'absolute', left: 48 * s, top: 640 * s, width: 260 * s, height: 2 * s, background: desk.hair}} />
			<div style={{position: 'absolute', left: 48 * s, top: 654 * s, fontSize: 22 * s, fontWeight: 600, color: desk.muted}}>Customer approval</div>
		</div>
	);
};

/**
 * A plain example pay stub: header, pay period and a single "your pay" bar.
 * Deliberately says nothing about taxes. `slice` 0..1 is the share carved out
 * of the bar (drawn as a dashed gap once `gone` > 0 — the piece left the stub).
 */
export const PayStub: React.FC<{x: number; y: number; w?: number; rot?: number; slice?: number; sliceShow?: number; gone?: number; color?: string; style?: React.CSSProperties}> = ({
	x,
	y,
	w = 560,
	rot = 0,
	slice = 0.14,
	sliceShow = 0,
	gone = 0,
	color = editorial.accent,
	style,
}) => {
	const s = w / 560;
	const barW = 464 * s;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: 300 * s,
				background: '#FFFEFB',
				borderRadius: 8 * s,
				boxShadow: desk.shadow(0),
				transform: `rotate(${rot}deg)`,
				fontFamily: 'Inter',
				...style,
			}}
		>
			<div style={{position: 'absolute', left: 48 * s, top: 34 * s, fontSize: 24 * s, fontWeight: 800, letterSpacing: 4 * s, color: desk.muted}}>PAY STUB · EXAMPLE</div>
			<div style={{position: 'absolute', left: 48 * s, top: 72 * s, fontSize: 44 * s, fontWeight: 900, color: desk.ink, letterSpacing: -1}}>Your paycheck</div>
			<div style={{position: 'absolute', left: 48 * s, top: 142 * s, width: 220 * s, height: 2 * s, background: desk.hair}} />
			<div style={{position: 'absolute', left: 48 * s, top: 188 * s, width: barW, height: 56 * s, borderRadius: 10 * s, background: '#E9E4D8', overflow: 'hidden'}}>
				<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: barW * (1 - slice * sliceShow), background: '#3A3D44'}} />
				<div
					style={{
						position: 'absolute',
						right: 0,
						top: 0,
						bottom: 0,
						width: barW * slice * sliceShow,
						background: color,
						opacity: 1 - gone,
					}}
				/>
				<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: barW * slice * sliceShow, border: `${3 * s}px dashed ${color}`, borderRadius: 10 * s, opacity: gone, boxSizing: 'border-box'}} />
			</div>
		</div>
	);
};
