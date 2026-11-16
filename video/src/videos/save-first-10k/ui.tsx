import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandLogo} from '../../story/components/Chrome';
import {E, kf, sp} from '../../story/lib/motion';
import {story, type Palette} from '../../story/theme';

/**
 * "Vault" look for this video — the creator's brief palette:
 * matte black #0B0F0D · bright green #39FF88 · white · gray #A1A1AA.
 * Premium fintech: dark glass panels, hairlines, one green.
 */
export const C = {
	bg: '#0B0F0D',
	green: '#39FF88',
	greenDim: 'rgba(57,255,136,0.55)',
	greenSoft: 'rgba(57,255,136,0.12)',
	white: '#FFFFFF',
	gray: '#A1A1AA',
	grayDim: 'rgba(161,161,170,0.45)',
	line: 'rgba(255,255,255,0.09)',
	track: 'rgba(255,255,255,0.08)',
	panel: 'linear-gradient(180deg, #151D19 0%, #0F1512 100%)',
	panelSolid: '#131A16',
};

export const VAULT: Palette = {
	name: 'cinematic',
	bg: C.bg,
	bg2: '#111714',
	paper: C.panelSolid,
	ink: C.white,
	body: '#D4D4D8',
	muted: C.gray,
	line: C.line,
	accent: C.green,
	accentDeep: '#1FAE5C',
	accentSoft: C.greenSoft,
	danger: '#FF6B57',
	dangerSoft: 'rgba(255,107,87,0.14)',
	gold: '#F5C451',
	shadow: 'rgba(0,0,0,0.6)',
};

/** content column inside the platform-safe area */
export const L = {x: story.safe.left, w: story.width - story.safe.left - story.safe.right, cx: (story.safe.left + story.width - story.safe.right) / 2};

export const fmt = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** Matte-black stage: faint green key light, soft top light, vignette. No particles. */
export const VaultBg: React.FC<{glow?: number; gx?: number; gy?: number}> = ({glow = 1, gx = 540, gy = 760}) => (
	<AbsoluteFill style={{background: C.bg}}>
		<AbsoluteFill style={{background: `radial-gradient(820px 820px at ${gx}px ${gy}px, rgba(57,255,136,${0.075 * glow}) 0%, rgba(57,255,136,0) 70%)`}} />
		<AbsoluteFill style={{background: 'radial-gradient(130% 55% at 50% -5%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)'}} />
		<AbsoluteFill style={{background: 'radial-gradient(120% 85% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
	</AbsoluteFill>
);

export const Panel: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; glow?: number}> = ({style, children, glow = 0}) => (
	<div
		style={{
			position: 'absolute',
			background: C.panel,
			border: `1.5px solid ${glow > 0 ? `rgba(57,255,136,${0.15 + 0.6 * glow})` : C.line}`,
			borderRadius: 34,
			boxShadow: `0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)${glow > 0 ? `, 0 0 ${40 * glow}px rgba(57,255,136,${0.18 * glow})` : ''}`,
			...style,
		}}
	>
		{children}
	</div>
);

export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = C.gray, size = 26, style}) => (
	<div style={{fontSize: size, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** "EXAMPLE" pill — every hypothetical figure carries one. */
export const ExampleTag: React.FC<{style?: React.CSSProperties; text?: string}> = ({style, text = 'EXAMPLE'}) => (
	<div style={{position: 'absolute', padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${C.grayDim}`, color: C.gray, fontSize: 24, fontWeight: 700, letterSpacing: 3, whiteSpace: 'nowrap', ...style}}>{text}</div>
);

/** Step marker: green rounded square with the step number + label. */
export const StepTag: React.FC<{n: string; label: string; at: number; exitAt?: number; style?: React.CSSProperties}> = ({n, label, at, exitAt, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'snappy');
	const pl = sp(frame, fps, at + 4, 'snappy');
	const out = exitAt === undefined ? 0 : kf(frame, [exitAt, exitAt + 10], [0, 1], E.in);
	return (
		<div style={{position: 'absolute', left: L.x, top: 180, display: 'flex', alignItems: 'center', gap: 22, opacity: 1 - out, ...style}}>
			<div style={{width: 72, height: 72, borderRadius: 20, background: C.green, color: C.bg, fontSize: 34, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, letterSpacing: -1}}>{n}</div>
			<div style={{overflow: 'hidden'}}>
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: C.white, transform: `translateX(${(1 - pl) * -110}%)`}}>{label}</div>
			</div>
		</div>
	);
};

/** Check mark in a circle, stroke drawn by `p` (0..1). */
export const Check: React.FC<{size: number; p: number; color?: string; fill?: boolean}> = ({size, p, color = C.green, fill = true}) => {
	const ring = Math.min(1, p * 1.6);
	const tick = Math.max(0, Math.min(1, (p - 0.35) / 0.65));
	return (
		<svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block'}}>
			<circle cx={50} cy={50} r={45} fill={fill ? `rgba(57,255,136,${0.16 * ring})` : 'none'} stroke={color} strokeWidth={6} strokeDasharray={283} strokeDashoffset={283 * (1 - ring)} transform="rotate(-90 50 50)" strokeLinecap="round" />
			<path d="M30 52 L45 66 L71 37" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={64} strokeDashoffset={64 * (1 - tick)} />
		</svg>
	);
};

export const Bookmark: React.FC<{size: number; fill: number; color?: string}> = ({size, fill, color = C.green}) => (
	<svg width={size} height={size * 1.25} viewBox="0 0 40 50" style={{display: 'block'}}>
		<defs>
			<clipPath id="bm">
				<path d="M6 4 H34 V46 L20 36 L6 46 Z" />
			</clipPath>
		</defs>
		<rect x={0} y={50 - 50 * fill} width={40} height={50} fill={color} clipPath="url(#bm)" />
		<path d="M6 4 H34 V46 L20 36 L6 46 Z" fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
	</svg>
);

/**
 * The $10,000 goal bar — the object that carries the story from the hook to the CTA.
 * `fill` is the share of $10,000 saved; the $1,000 tick sits at 10%.
 */
export const GoalBar: React.FC<{
	x?: number;
	y: number;
	w?: number;
	h?: number;
	fill: number;
	reveal?: number;
	labels?: number;
	endLabel?: number;
	mile?: number;
	mileLabel?: React.ReactNode;
	segments?: boolean;
	done?: number;
	/** faint full-width goal layer (0..1 opacity) */
	ghost?: number;
}> = ({x = L.x, y, w = L.w, h = 30, fill, reveal = 1, labels = 1, endLabel = 1, mile = 0, mileLabel, segments = false, done = 0, ghost = 0}) => {
	const tickX = w * 0.1;
	const f = Math.max(0, Math.min(1, fill));
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: reveal > 0.02 ? 1 : 0}}>
			{/* track */}
			<div style={{position: 'absolute', inset: 0, width: w * reveal, borderRadius: h / 2, background: C.track, border: `1px solid ${C.line}`, overflow: 'hidden'}}>
				{ghost > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(57,255,136,${0.16 * ghost})`}} />}
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: w * f,
						borderRadius: h / 2,
						background: `linear-gradient(90deg, #1FAE5C 0%, ${C.green} 100%)`,
						boxShadow: `0 0 ${18 + 30 * done}px rgba(57,255,136,${0.35 + 0.3 * done})`,
					}}
				/>
				{segments &&
					Array.from({length: 9}, (_, i) => (
						<div key={i} style={{position: 'absolute', left: (w * (i + 1)) / 10 - 1, top: 0, bottom: 0, width: 2, background: 'rgba(11,15,13,0.55)'}} />
					))}
			</div>
			{/* $1,000 milestone node */}
			<div
				style={{
					position: 'absolute',
					left: tickX - h * 0.55,
					top: -h * 0.05 - h * 0.05,
					width: h * 1.1,
					height: h * 1.1,
					borderRadius: '50%',
					background: mile > 0.5 ? C.green : C.bg,
					border: `3px solid ${mile > 0 ? C.green : C.gray}`,
					opacity: reveal > 0.15 ? labels : 0,
					transform: `scale(${1 + 0.25 * Math.sin(Math.min(1, mile) * Math.PI)})`,
					boxShadow: mile > 0 ? `0 0 ${24 * mile}px rgba(57,255,136,${0.6 * mile})` : 'none',
				}}
			/>
			{/* labels */}
			<div style={{position: 'absolute', left: 0, top: h + 16, fontSize: 30, fontWeight: 800, color: C.gray, opacity: labels}}>$0</div>
			<div style={{position: 'absolute', right: 0, top: h + 16, fontSize: 30, fontWeight: 800, color: done > 0.5 ? C.green : C.white, opacity: labels * endLabel}}>$10,000</div>
			<div style={{position: 'absolute', left: Math.max(0, tickX - 40), bottom: h + 16, fontSize: 30, fontWeight: 800, color: mile > 0 ? C.green : C.gray, opacity: labels, whiteSpace: 'nowrap'}}>
				{mileLabel ?? '$1,000'}
			</div>
		</div>
	);
};

/** 100 weeks = 100 cells; each cell is one $100 deposit. */
export const WeekGrid: React.FC<{x: number; y: number; cell: number; gap: number; filled: number; year2Tint?: number; collapse?: number; dim?: number}> = ({x, y, cell, gap, filled, year2Tint = 0, collapse = 0, dim = 0}) => (
	<div style={{position: 'absolute', left: x, top: y}}>
		{Array.from({length: 100}, (_, i) => {
			const r = Math.floor(i / 10);
			const c = i % 10;
			const on = i < filled;
			const fresh = on && i >= filled - 1 ? 1 : 0;
			const year2 = i >= 52;
			const k = Math.max(0, Math.min(1, collapse * 1.6 - ((r * 10 + c) / 100) * 0.6));
			const bg = on ? (year2 ? `rgba(57,255,136,${1 - 0.45 * year2Tint})` : C.green) : 'rgba(255,255,255,0.05)';
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: c * (cell + gap),
						top: r * (cell + gap),
						width: cell,
						height: cell,
						borderRadius: cell * 0.22,
						background: bg,
						border: on ? 'none' : `1.5px solid ${C.line}`,
						transform: `scale(${(1 + 0.12 * fresh) * (1 - k)})`,
						opacity: (1 - k) * (1 - 0.65 * dim),
						boxShadow: on ? `0 0 14px rgba(57,255,136,${0.25 * (1 - dim)})` : 'none',
					}}
				/>
			);
		})}
	</div>
);

export const Brand: React.FC<{style?: React.CSSProperties; size?: number}> = ({style, size = 34}) => (
	<div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 16, ...style}}>
		<BrandLogo size={size * 1.2} ink={C.white} accent={C.green} />
		<div style={{fontSize: size, fontWeight: 900, letterSpacing: 6, color: C.white, whiteSpace: 'nowrap'}}>STACK WITH GIO</div>
	</div>
);

/** small "+$100" deposit chip */
export const DepositChip: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => (
	<div style={{position: 'absolute', padding: '8px 18px', borderRadius: 999, background: C.green, color: C.bg, fontSize: 30, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(57,255,136,0.25)', ...style}}>{text}</div>
);
