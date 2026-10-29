import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {easeIn, easeIO, easeOut, lerp, tw} from '../debt-story/anim';
import {C, FONT} from '../debt-story/theme';
import {PHRASES, s} from '../debt-payoff-3/timing';

/**
 * Cinematic building blocks for V2: graded footage shots with camera moves and transitions,
 * film grain, editorial type and a selective caption track. Everything reads the global frame.
 */

export const stock = (id: string, ext = 'mp4') => staticFile(`debt-payoff-3-v2/stock/${id}.${ext}`);

export type Enter = 'cut' | 'whip' | 'fade' | 'flash';
export const T_IN = {cut: 0, whip: 7, fade: 12, flash: 6} as const;

type Move = {z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number; fx?: number; fy?: number};

/** Common grade: lifted contrast, muted colour, pulled-down exposure; type sits on dark gradients. */
const GRADE = 'contrast(1.12) saturate(0.82) brightness(0.86)';

const useShot = (from: number, to: number, enter: Enter, move: Move) => {
	const f = useCurrentFrame();
	const lead = T_IN[enter];
	const t = tw(f, from - lead, to, 0, 1, (x) => x);
	const z = lerp(move.z0 ?? 1.04, move.z1 ?? 1.12, easeIO(t));
	const x = lerp(move.x0 ?? 0, move.x1 ?? 0, easeIO(t));
	const y = lerp(move.y0 ?? 0, move.y1 ?? 0, easeIO(t));
	const i = lead > 0 ? tw(f, from - lead, from, 0, 1, easeOut) : 1;
	let op = 1;
	let tx = 0;
	let blur = 0;
	if (enter === 'fade') op = i;
	if (enter === 'whip') {
		tx = (1 - i) * 520;
		blur = (1 - i) * 26;
		op = Math.min(1, i * 3);
	}
	return {f, lead, z, x: x + tx, y, op, blur};
};

const Frame: React.FC<{
	children: React.ReactNode;
	z: number;
	x: number;
	y: number;
	op: number;
	blur: number;
	fx?: number;
	fy?: number;
	grade?: string;
	dim?: number;
}> = ({children, z, x, y, op, blur, fx = 540, fy = 960, grade = GRADE, dim = 0}) => (
	<AbsoluteFill style={{opacity: op, overflow: 'hidden'}}>
		<AbsoluteFill
			style={{
				transformOrigin: `${fx}px ${fy}px`,
				transform: `translate(${x}px, ${y}px) scale(${z})`,
				filter: `${grade}${blur > 0.3 ? ` blur(${blur}px)` : ''}`,
			}}
		>
			{children}
		</AbsoluteFill>
		{dim > 0 ? <AbsoluteFill style={{background: '#000', opacity: dim}} /> : null}
	</AbsoluteFill>
);

/** A footage shot on [from, to). `at` = source second to start from. */
export const Shot: React.FC<{
	id: string;
	from: number;
	to: number;
	at?: number;
	enter?: Enter;
	move?: Move;
	grade?: string;
	dim?: number | ((f: number) => number);
	rate?: number;
}> = ({id, from, to, at = 0, enter = 'cut', move = {}, grade, dim = 0, rate = 1}) => {
	const sh = useShot(from, to, enter, move);
	if (sh.f < from - sh.lead || sh.f >= to) return null;
	const d = typeof dim === 'function' ? dim(sh.f) : dim;
	return (
		<Frame {...sh} fx={move.fx} fy={move.fy} grade={grade} dim={d}>
			<Sequence from={from - sh.lead} durationInFrames={to - from + sh.lead} layout="none">
				<OffthreadVideo src={stock(id)} trimBefore={Math.round(at * 30)} playbackRate={rate} muted style={{width: 1080, height: 1920, objectFit: 'cover'}} />
			</Sequence>
		</Frame>
	);
};

/** A still with a Ken Burns move (source image is a 9:16 crop). */
export const StillShot: React.FC<{src: string; from: number; to: number; enter?: Enter; move?: Move; grade?: string; dim?: number}> = ({
	src,
	from,
	to,
	enter = 'cut',
	move = {},
	grade,
	dim = 0,
}) => {
	const sh = useShot(from, to, enter, move);
	if (sh.f < from - sh.lead || sh.f >= to) return null;
	return (
		<Frame {...sh} fx={move.fx} fy={move.fy} grade={grade} dim={dim}>
			<Img src={src} style={{width: 1080, height: 1920, objectFit: 'cover'}} />
		</Frame>
	);
};

/** White flash on a cut (used sparingly: chapter changes). */
export const Flash: React.FC<{at: number}> = ({at}) => {
	const f = useCurrentFrame();
	const o = tw(f, at - 2, at, 0, 1) * tw(f, at, at + 6, 1, 0, easeOut);
	return o > 0 ? <AbsoluteFill style={{background: '#F5F7F5', opacity: o * 0.45}} /> : null;
};

/** Dip to black around a frame. */
export const Dip: React.FC<{at: number; len?: number}> = ({at, len = 8}) => {
	const f = useCurrentFrame();
	const o = Math.min(tw(f, at - len, at, 0, 1, easeIn), tw(f, at, at + len, 1, 0, easeOut));
	return o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null;
};

/** Top/bottom darkening so type reads over any footage, plus a vignette. */
export const Scrims: React.FC<{top?: number; bottom?: number}> = ({top = 0.55, bottom = 0.7}) => (
	<>
		<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,${bottom}) 100%)`}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 820px 1200px at 540px 900px, transparent 58%, rgba(0,0,0,0.6) 100%)'}} />
	</>
);

/** Fine animated film grain (SVG turbulence, reseeded every 2 frames). */
export const Grain: React.FC<{amt?: number}> = ({amt = 0.07}) => {
	const f = useCurrentFrame();
	const seed = Math.floor(f / 2) % 50;
	return (
		<AbsoluteFill style={{opacity: amt, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width={1080} height={1920}>
				<filter id={`g${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={1080} height={1920} filter={`url(#g${seed})`} />
			</svg>
		</AbsoluteFill>
	);
};

// ---------- type ----------

export type Line = {t: string; c?: string; size: number; w?: number; ls?: number; outline?: boolean};

/** Lines rise out of their own masks, one after another, and leave together. */
export const Type: React.FC<{
	lines: Line[];
	from: number;
	to: number;
	x?: number;
	y: number;
	align?: 'left' | 'center' | 'right';
	width?: number;
	stagger?: number;
	lh?: number;
	shadow?: boolean;
	exit?: 'rise' | 'fade' | 'none';
}> = ({lines, from, to, x = 80, y, align = 'left', width = 920, stagger = 4, lh = 0.98, shadow = true, exit = 'fade'}) => {
	const f = useCurrentFrame();
	if (f < from || f >= to) return null;
	const out = exit === 'none' ? 0 : tw(f, to - 6, to, 0, 1, easeIn);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width,
				textAlign: align,
				fontFamily: FONT,
				opacity: 1 - out,
				transform: exit === 'rise' ? `translateY(${-out * 40}px)` : undefined,
			}}
		>
			{lines.map((l, i) => {
				const p = tw(f, from + i * stagger, from + i * stagger + 11, 0, 1, easeOut);
				return (
					<div key={i} style={{overflow: 'hidden', lineHeight: lh, paddingBottom: '0.04em'}}>
						<div
							style={{
								display: 'inline-block',
								fontSize: l.size,
								fontWeight: l.w ?? 900,
								letterSpacing: l.ls ?? -l.size * 0.035,
								color: l.outline ? 'transparent' : l.c ?? C.white,
								WebkitTextStroke: l.outline ? `${Math.max(2, l.size / 60)}px ${l.c ?? C.white}` : undefined,
								transform: `translateY(${(1 - p) * 105}%)`,
								textShadow: shadow && !l.outline ? '0 6px 40px rgba(0,0,0,0.55)' : undefined,
								whiteSpace: 'nowrap',
							}}
						>
							{l.t}
						</div>
					</div>
				);
			})}
		</div>
	);
};

/** Small lower-third label: green rule + caps. */
export const Label: React.FC<{text: string; from: number; to: number; x?: number; y?: number; color?: string}> = ({text, from, to, x = 80, y = 1220, color = C.green}) => {
	const f = useCurrentFrame();
	if (f < from || f >= to) return null;
	const p = tw(f, from, from + 9, 0, 1, easeOut);
	const out = tw(f, to - 5, to, 0, 1, easeIn);
	return (
		<div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, opacity: 1 - out}}>
			<div style={{width: 64 * p, height: 6, background: color, borderRadius: 3}} />
			<div style={{overflow: 'hidden'}}>
				<div style={{fontWeight: 900, fontSize: 46, letterSpacing: 2, color: C.white, transform: `translateX(${(1 - p) * -40}px)`, opacity: p, whiteSpace: 'nowrap', textShadow: '0 4px 24px rgba(0,0,0,0.7)'}}>
					{text}
				</div>
			</div>
		</div>
	);
};

export const Kick: React.FC<{text: string; from: number; to: number; x?: number; y: number; color?: string; align?: 'left' | 'center'}> = ({
	text,
	from,
	to,
	x = 80,
	y,
	color = C.green,
	align = 'left',
}) => {
	const f = useCurrentFrame();
	if (f < from || f >= to) return null;
	const o = Math.min(tw(f, from, from + 8), tw(f, to - 6, to, 1, 0));
	return (
		<div
			style={{
				position: 'absolute',
				left: align === 'center' ? 0 : x,
				right: align === 'center' ? 0 : undefined,
				top: y,
				textAlign: align,
				fontFamily: FONT,
				fontWeight: 800,
				fontSize: 30,
				letterSpacing: 6,
				color,
				opacity: o,
				textShadow: '0 3px 18px rgba(0,0,0,0.7)',
			}}
		>
			{text}
		</div>
	);
};

// ---------- selective captions ----------

/** Narration captions only on phrases that have no matching headline on screen. */
export const SparseCaptions: React.FC<{ids: string[]}> = ({ids}) => {
	const f = useCurrentFrame();
	const p = PHRASES.find((x) => ids.includes(x.id) && f >= s(x.start) && f < s(x.end) + 8);
	if (!p) return null;
	const a = s(p.start);
	const b = s(p.end) + 8;
	const o = Math.min(tw(f, a, a + 4), tw(f, b - 4, b, 1, 0));
	const parts = p.text.split(/(\*[^*]+\*)/).filter(Boolean);
	return (
		<div style={{position: 'absolute', left: 110, right: 150, top: 1360, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 50, lineHeight: 1.25, color: C.white, opacity: o, textShadow: '0 2px 14px rgba(0,0,0,0.95)'}}>
			{parts.map((x, i) => (x.startsWith('*') ? <span key={i} style={{color: C.green, fontWeight: 900}}>{x.slice(1, -1)}</span> : <span key={i}>{x}</span>))}
		</div>
	);
};
