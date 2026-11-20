import React from 'react';
import {AbsoluteFill} from 'remotion';
import {story} from '../theme';

/**
 * Top-down "desk" kit: grounded, flat objects in natural light for videos that
 * should feel like someone handling real paperwork. Neutral surface, soft
 * window light from the top-left, shadows falling bottom-right. No gloss, no 3D.
 * Use when real footage is unavailable (simple branded illustration).
 */
export const deskColors = {
	surface: '#D8D4CC',
	paper: '#FBFAF7',
	paperLine: '#E4E1DA',
	ink: '#0B0C0E',
	inkSoft: '#3A3D44',
	muted: '#8B8A85',
	green: '#2CD47A',
	pen: '#17B863',
};

/** Natural-light shadow for an object lying on the desk (lift 0..1 raises it). */
export const deskShadow = (lift = 0) =>
	`${10 + 24 * lift}px ${14 + 34 * lift}px ${22 + 40 * lift}px rgba(40,34,24,${0.22 + 0.08 * lift}), 1px 2px 3px rgba(40,34,24,0.18)`;

const DeskGrain: React.FC<{seed?: number}> = ({seed = 7}) => (
	<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'multiply'}}>
		<filter id={`deskgrain${seed}`}>
			<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter={`url(#deskgrain${seed})`} />
	</svg>
);

/** Neutral desk surface with window light from the top-left. */
export const DeskSurface: React.FC<{tone?: string; light?: number}> = ({tone = deskColors.surface, light = 1}) => (
	<AbsoluteFill style={{background: tone}}>
		<AbsoluteFill style={{background: `radial-gradient(130% 80% at 8% 0%, rgba(255,253,246,${0.55 * light}) 0%, rgba(255,253,246,0) 62%)`}} />
		<AbsoluteFill style={{background: 'radial-gradient(120% 90% at 100% 100%, rgba(60,50,35,0.16) 0%, rgba(0,0,0,0) 60%)'}} />
		<DeskGrain />
	</AbsoluteFill>
);

/** Hand-drawn pen ellipse that draws itself (progress 0..1). Coordinates are the parent's. */
export const PenEllipse: React.FC<{cx: number; cy: number; rx: number; ry: number; progress: number; color?: string; stroke?: number; rot?: number}> = ({
	cx,
	cy,
	rx,
	ry,
	progress,
	color = deskColors.pen,
	stroke = 9,
	rot = -8,
}) => {
	if (progress <= 0) return null;
	// slightly open, overshooting loop so it reads as drawn by hand
	const d = `M ${cx + rx * 0.9} ${cy - ry * 0.55}
		C ${cx + rx * 1.15} ${cy + ry * 0.6}, ${cx + rx * 0.2} ${cy + ry * 1.12}, ${cx - rx * 0.55} ${cy + ry * 0.92}
		C ${cx - rx * 1.2} ${cy + ry * 0.7}, ${cx - rx * 1.08} ${cy - ry * 0.75}, ${cx - rx * 0.2} ${cy - ry * 1.02}
		C ${cx + rx * 0.5} ${cy - ry * 1.2}, ${cx + rx * 1.12} ${cy - ry * 0.75}, ${cx + rx * 1.02} ${cy - ry * 0.12}`;
	return (
		<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
			<path
				d={d}
				fill="none"
				stroke={color}
				strokeWidth={stroke}
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - Math.min(1, progress)}
				transform={`rotate(${rot} ${cx} ${cy})`}
			/>
		</svg>
	);
};

/** Any SVG path drawn on (progress 0..1). */
export const PenPath: React.FC<{d: string; progress: number; color?: string; stroke?: number; dash?: string}> = ({d, progress, color = deskColors.pen, stroke = 6, dash}) =>
	progress <= 0 ? null : (
		<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
			<defs>
				<mask id={`m${d.length}${Math.round(stroke)}`}>
					<path d={d} fill="none" stroke="#fff" strokeWidth={stroke + 4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, progress)} />
				</mask>
			</defs>
			<path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={dash} mask={`url(#m${d.length}${Math.round(stroke)})`} />
		</svg>
	);

/** Round check badge; the tick draws itself. */
export const DrawCheck: React.FC<{size: number; progress: number; bg?: string; fg?: string; style?: React.CSSProperties}> = ({size, progress, bg = deskColors.green, fg = deskColors.ink, style}) => {
	const pop = Math.min(1, progress * 2.2);
	const tick = Math.max(0, Math.min(1, progress * 1.6 - 0.4));
	return (
		<div style={{width: size, height: size, flex: 'none', transform: `scale(${0.5 + 0.5 * pop})`, opacity: pop, ...style}}>
			<svg width={size} height={size} viewBox="0 0 40 40">
				<circle cx={20} cy={20} r={19} fill={bg} />
				<path d="M11 20.5 L17.5 27 L29.5 13.5" fill="none" stroke={fg} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
			</svg>
		</div>
	);
};

/** Black redaction bar — hides amounts, names, IDs. */
export const RedactBar: React.FC<{w: number; h?: number; style?: React.CSSProperties}> = ({w, h = 22, style}) => (
	<div style={{width: w, height: h, background: deskColors.ink, borderRadius: 3, ...style}} />
);

/**
 * Thermal receipt lying on the desk. Every amount is a redaction bar (no dollar
 * figures). `rows` are label strings; `icon` is an optional SVG in the header.
 */
export const ThermalReceipt: React.FC<{w: number; title: string; rows: string[]; icon?: React.ReactNode; rot?: number; lift?: number; style?: React.CSSProperties}> = ({
	w,
	title,
	rows,
	icon,
	rot = 0,
	lift = 0,
	style,
}) => {
	const s = w / 440;
	const zig = Array.from({length: 22}, (_, i) => `${(i / 22) * 100}% ${i % 2 ? 100 : 97.5}%`).join(',');
	return (
		<div
			style={{
				position: 'absolute',
				width: w,
				transform: `rotate(${rot}deg)`,
				filter: `drop-shadow(${8 + 18 * lift}px ${12 + 26 * lift}px ${14 + 22 * lift}px rgba(40,34,24,0.26))`,
				fontFamily: story.font,
				...style,
			}}
		>
			<div style={{background: deskColors.paper, padding: `${34 * s}px ${36 * s}px ${54 * s}px`, clipPath: `polygon(0 0, 100% 0, 100% 97.5%, ${zig}, 0 100%)`}}>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 * s, marginBottom: 18 * s}}>
					{icon}
					<div style={{fontSize: 40 * s, fontWeight: 900, letterSpacing: 6 * s, color: deskColors.ink}}>{title}</div>
				</div>
				<div style={{borderTop: `${3 * s}px dashed ${deskColors.paperLine}`, margin: `${8 * s}px 0 ${20 * s}px`}} />
				{rows.map((r, i) => {
					const total = i === rows.length - 1;
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								fontSize: (total ? 32 : 28) * s,
								fontWeight: total ? 900 : 700,
								letterSpacing: 2 * s,
								color: total ? deskColors.ink : deskColors.inkSoft,
								margin: `${(total ? 26 : 12) * s}px 0`,
								paddingTop: total ? 18 * s : 0,
								borderTop: total ? `${3 * s}px dashed ${deskColors.paperLine}` : undefined,
							}}
						>
							<span>{r}</span>
							<RedactBar w={(total ? 130 : 96) * s} h={(total ? 30 : 24) * s} />
						</div>
					);
				})}
				<div style={{marginTop: 26 * s, display: 'flex', justifyContent: 'center', gap: 3 * s}}>
					{Array.from({length: 34}, (_, i) => (
						<div key={i} style={{width: (i % 3 === 0 ? 5 : 2) * s, height: 46 * s, background: deskColors.inkSoft, opacity: 0.55}} />
					))}
				</div>
			</div>
		</div>
	);
};

/** Generic top-down phone (no brand, no UI chrome). `children` render on the screen. */
export const TopDownPhone: React.FC<{w: number; awake?: number; rot?: number; lift?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
	w,
	awake = 1,
	rot = 0,
	lift = 0,
	children,
	style,
}) => {
	const h = w * 2.05;
	const r = w * 0.15;
	const bezel = w * 0.035;
	return (
		<div
			style={{
				position: 'absolute',
				width: w,
				height: h,
				borderRadius: r,
				background: 'linear-gradient(145deg, #2A2C30 0%, #141518 60%, #0E0F11 100%)',
				boxShadow: `${deskShadow(lift)}, inset 0 0 0 ${w * 0.008}px rgba(255,255,255,0.10)`,
				transform: `rotate(${rot}deg)`,
				...style,
			}}
		>
			<div style={{position: 'absolute', inset: bezel, borderRadius: r - bezel, background: '#050506', overflow: 'hidden'}}>
				<div style={{position: 'absolute', inset: 0, opacity: awake, background: 'linear-gradient(170deg, #1C1F24 0%, #101215 100%)'}}>{children}</div>
				{/* matte screen reflection from the window */}
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%)'}} />
			</div>
		</div>
	);
};
