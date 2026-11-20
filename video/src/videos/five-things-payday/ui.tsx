import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../story/components/Backgrounds';
import {useCues} from '../../story/lib/cues';
import {E, kf, prog, sp} from '../../story/lib/motion';
import {cinematic as P, story} from '../../story/theme';
import {STEP_DONE, STEP_START} from './script';

/** Layout grid shared by every scene (1080×1920, captions band from 1430). */
export const L = {
	left: story.safe.left, // 72
	right: 1080 - story.safe.left, // symmetric 72 gutter for centred compositions
	width: 1080 - story.safe.left * 2, // 936
	progTop: 184,
	kickerTop: 262,
	headTop: 302,
	stageTop: 520,
	stageBottom: story.contentBottom, // 1390
};

export const C = {
	bg: P.bg,
	panel: '#15171B',
	panel2: '#1B1E23',
	line: '#2A2E35',
	ink: '#F5F2EA',
	white: '#FFFFFF',
	muted: '#7C828B',
	soft: '#A3A8B0',
	green: P.accent,
	greenDeep: P.accentDeep,
	greenSoft: 'rgba(44,212,122,0.14)',
};

export const font = story.font;

export const Stage: React.FC<{children?: React.ReactNode; lightY?: number}> = ({children, lightY = 900}) => (
	<AbsoluteFill style={{fontFamily: font}}>
		<CinematicBg warm={false} light={0.45} lightY={lightY} />
		{children}
	</AbsoluteFill>
);

/** Green check mark drawn as a stroke (p 0→1). */
export const CheckGlyph: React.FC<{size: number; p: number; color?: string; stroke?: number}> = ({size, p, color = '#0B0C0E', stroke = 4.2}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
		<path d="M5 12.5l4.6 4.6L19 7.6" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - p)} />
	</svg>
);

/** Checkbox: empty outline → green fill with drawn check at `at`. */
export const CheckBox: React.FC<{size?: number; at?: number; style?: React.CSSProperties}> = ({size = 56, at, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fill = at === undefined ? 0 : sp(frame, fps, at, 'snappy');
	const draw = at === undefined ? 0 : prog(frame, at + 3, 9);
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: size * 0.26,
				border: `${Math.max(3, size * 0.06)}px solid ${fill > 0.02 ? C.green : '#4A4F57'}`,
				background: fill > 0.02 ? C.green : 'transparent',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, fill) * Math.PI)})`,
				boxSizing: 'border-box',
				flexShrink: 0,
				...style,
			}}
		>
			{fill > 0.02 && <CheckGlyph size={size * 0.78} p={draw} />}
		</div>
	);
};

/** Small "EXAMPLE" tag that must accompany every dollar amount. */
export const ExampleTag: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 26, style}) => (
	<div
		style={{
			display: 'inline-block',
			fontSize: size,
			fontWeight: 900,
			letterSpacing: size * 0.16,
			color: C.ink,
			border: `2px solid ${C.muted}`,
			borderRadius: 8,
			padding: `${size * 0.2}px ${size * 0.45}px`,
			lineHeight: 1,
			...style,
		}}
	>
		EXAMPLE
	</div>
);

/** Letter-spaced uppercase label. */
export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 28, color = C.soft, style}) => (
	<div style={{fontSize: size, fontWeight: 800, letterSpacing: size * 0.13, color, lineHeight: 1.1, ...style}}>{children}</div>
);

/**
 * Step heading: "STEP 3" kicker + uppercase headline (≤ 2 lines).
 * `swap` replaces the headline mid-scene (debt scene: minimums → extra).
 */
export const StepHeading: React.FC<{n: number; text: string; at: number; swap?: {text: string; at: number}; accentWords?: string[]}> = ({n, text, at, swap, accentWords = []}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const kIn = sp(frame, fps, at, 'snappy');
	const hIn = sp(frame, fps, at + 3, 'snappy');
	const sOut = swap ? kf(frame, [swap.at, swap.at + 8], [0, 1], E.in) : 0;
	const sIn = swap ? sp(frame, fps, swap.at + 6, 'snappy') : 0;
	const line = (t: string, p: number, out: number) => (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				fontSize: 70,
				fontWeight: 900,
				letterSpacing: -1.5,
				lineHeight: 1.04,
				color: C.white,
				opacity: Math.min(1, p * 1.4) * (1 - out),
				transform: `translateY(${(1 - p) * 40 - out * 30}px)`,
			}}
		>
			{t.split(' ').map((w, i) => (
				<span key={i} style={{color: accentWords.includes(w) ? C.green : undefined}}>
					{w}{' '}
				</span>
			))}
		</div>
	);
	return (
		<>
			<div style={{position: 'absolute', left: L.left, top: L.kickerTop, opacity: kIn, transform: `translateX(${(1 - kIn) * -24}px)`}}>
				<Label size={28} color={C.green}>STEP {n} OF 5</Label>
			</div>
			<div style={{position: 'absolute', left: L.left, right: 120, top: L.headTop, height: 160}}>
				{line(text, hIn, sOut)}
				{swap && sIn > 0 && line(swap.text, sIn, 0)}
			</div>
		</>
	);
};

/** One checklist row (hook + ending share it so the system reads as one object). */
export const ChecklistRow: React.FC<{
	n: number;
	label?: string;
	placeholderW?: number;
	checkAt?: number;
	focus?: number;
	dim?: number;
	w?: number;
	h?: number;
	fontSize?: number;
	style?: React.CSSProperties;
}> = ({n, label, placeholderW = 360, checkAt, focus = 0, dim = 0, w = L.width, h = 128, fontSize = 40, style}) => (
	<div
		style={{
			position: 'absolute',
			width: w,
			height: h,
			borderRadius: 26,
			background: focus > 0 ? `rgba(27,30,35,${0.9 + 0.1 * focus})` : 'rgba(21,23,27,0.92)',
			border: `3px solid ${focus > 0.01 ? `rgba(44,212,122,${focus})` : C.line}`,
			boxShadow: focus > 0 ? `0 18px 50px rgba(0,0,0,${0.5 * focus})` : undefined,
			display: 'flex',
			alignItems: 'center',
			gap: 26,
			padding: '0 30px 0 24px',
			boxSizing: 'border-box',
			opacity: 1 - dim * 0.6,
			...style,
		}}
	>
		<div
			style={{
				width: 76,
				height: 76,
				borderRadius: 18,
				background: '#0F1114',
				border: `2px solid ${C.line}`,
				color: C.green,
				fontSize: 44,
				fontWeight: 900,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
			}}
		>
			{n}
		</div>
		<div style={{flex: 1, minWidth: 0}}>
			{label ? (
				<div style={{fontSize, fontWeight: 800, color: C.white, lineHeight: 1.12, letterSpacing: -0.3}}>{label}</div>
			) : (
				<div style={{width: placeholderW, height: 22, borderRadius: 11, background: '#262A31'}} />
			)}
		</div>
		<CheckBox size={58} at={checkAt} />
	</div>
);

/** Generic rounded panel. */
export const Panel: React.FC<{children?: React.ReactNode; style?: React.CSSProperties; border?: string}> = ({children, style, border = C.line}) => (
	<div style={{position: 'absolute', borderRadius: 28, background: C.panel2, border: `3px solid ${border}`, boxSizing: 'border-box', boxShadow: '0 22px 60px rgba(0,0,0,0.45)', ...style}}>{children}</div>
);

/**
 * Persistent five-step progress indicator (top-left, below the platform's top UI).
 * Pill states: upcoming (dark) → current (white outline) → done (green + check).
 */
export const ProgressOverlay: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const showAt = cue('L2', 'before', 0.15);
	const show = sp(frame, fps, showAt, 'smooth');
	if (frame < showAt) return null;
	const starts = STEP_START.map((l) => cue(l, undefined, -0.12));
	const dones = STEP_DONE.map(([l, w, o]) => cue(l, w, o));
	return (
		<div style={{position: 'absolute', left: L.left, top: L.progTop, display: 'flex', gap: 10, opacity: show, transform: `translateY(${(1 - show) * -16}px)`, fontFamily: font}}>
			{[0, 1, 2, 3, 4].map((i) => {
				const cur = sp(frame, fps, starts[i], 'snappy');
				const done = sp(frame, fps, dones[i], 'snappy');
				const draw = prog(frame, dones[i] + 3, 9);
				const isDone = frame >= dones[i];
				const isCur = frame >= starts[i];
				return (
					<div
						key={i}
						style={{
							width: 58,
							height: 40,
							borderRadius: 12,
							boxSizing: 'border-box',
							background: isDone ? C.green : isCur ? 'rgba(255,255,255,0.06)' : '#16181C',
							border: `3px solid ${isDone ? C.green : isCur ? `rgba(245,242,234,${0.35 + 0.65 * cur})` : C.line}`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 24,
							fontWeight: 900,
							color: isCur ? C.white : C.muted,
							transform: `scale(${1 + 0.14 * Math.sin(Math.min(1, done) * Math.PI)})`,
						}}
					>
						{isDone ? <CheckGlyph size={30} p={draw} /> : i + 1}
					</div>
				);
			})}
		</div>
	);
};
