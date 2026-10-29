import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeIO, easeOut, pop, tw} from '../debt-story/anim';
import {C, FONT} from '../debt-story/theme';
import {PHRASES, s, SCENES, XF, type SceneId} from './timing';

export const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** Count from a→b over [f0, f1]; settles exactly on b. */
export const count = (f: number, f0: number, f1: number, a: number, b: number) => (f >= f1 ? b : Math.round(tw(f, f0, f1, a, b, easeOut)));

/**
 * A scene's lifetime, with its transition in and out. Content keeps reading the global frame so
 * every anchor in timing.ts can be used directly. `drift` is the slow camera push across the scene.
 */
export const SceneWin: React.FC<{
	id: SceneId;
	children: React.ReactNode;
	enter?: 'push' | 'rise' | 'fade' | 'none';
	exit?: 'push' | 'zoom' | 'fade' | 'none';
	drift?: number;
	fx?: number;
	fy?: number;
}> = ({id, children, enter = 'push', exit = 'push', drift = 0.03, fx = 540, fy = 860}) => {
	const f = useCurrentFrame();
	const [from, to] = SCENES[id];
	if (f < from || f >= to) return null;
	const i = tw(f, from, from + XF, 0, 1, easeOut);
	const o = tw(f, to - XF, to, 0, 1, easeIn);
	let x = 0;
	let y = 0;
	let sc = 1 + drift * tw(f, from, to, 0, 1, easeIO);
	let op = 1;
	let blur = 0;
	if (enter === 'push') {
		y += (1 - i) * 140;
		op *= i;
		blur += (1 - i) * 10;
	} else if (enter === 'rise') {
		sc *= 1 - (1 - i) * 0.06;
		op *= i;
	} else if (enter === 'fade') op *= i;
	if (exit === 'push') {
		y -= o * 140;
		op *= 1 - o;
		blur += o * 10;
	} else if (exit === 'zoom') {
		sc *= 1 + o * 0.35;
		op *= 1 - o;
		blur += o * 14;
	} else if (exit === 'fade') op *= 1 - o;
	return (
		<AbsoluteFill
			style={{
				opacity: op,
				filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
				transformOrigin: `${fx}px ${fy}px`,
				transform: `translate(${x}px, ${y}px) scale(${sc})`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

// ---------- captions ----------

/** One caption group per narration phrase; a group holds until the next when the pause is short. */
const CUES = PHRASES.map((p, i) => {
	const next = PHRASES[i + 1];
	const hold = next && next.start - p.end < 0.6 ? next.start : p.end + 0.3;
	return {from: s(p.start), to: s(hold), text: p.text};
});

export const CaptionTrack: React.FC = () => {
	const f = useCurrentFrame();
	const cur = CUES.find((x) => f >= x.from && f < x.to);
	if (!cur) return null;
	const inT = tw(f, cur.from, cur.from + 4, 0, 1, easeOut);
	const outT = tw(f, cur.to - 3, cur.to, 1, 0);
	const parts = cur.text.split(/(\*[^*]+\*)/).filter(Boolean);
	return (
		<div
			style={{
				position: 'absolute',
				left: 120,
				right: 140,
				top: 1310,
				height: 170,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				textAlign: 'center',
				opacity: Math.min(inT, outT),
				transform: `translateY(${(1 - inT) * 8}px)`,
			}}
		>
			<div
				style={{
					fontFamily: FONT,
					fontWeight: 800,
					fontSize: 62,
					lineHeight: 1.22,
					letterSpacing: -0.5,
					textTransform: 'uppercase',
					color: C.white,
					textWrap: 'balance',
				} as React.CSSProperties}
			>
				<span style={{background: 'rgba(11,13,12,0.78)', padding: '2px 18px', borderRadius: 16, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
					{parts.flatMap((p, i) => {
						const hl = p.startsWith('*');
						const txt = hl ? p.slice(1, -1) : p;
						return txt.split(/(\s+)/).map((w, k) =>
							/^\s+$/.test(w) ? ' ' : w ? <span key={`${i}-${k}`} style={{whiteSpace: 'nowrap', color: hl ? C.green : undefined}}>{w}</span> : null,
						);
					})}
				</span>
			</div>
		</div>
	);
};

// ---------- text ----------

/** Words rise out of a mask one after another, starting at `start`. */
export const Rise: React.FC<{text: string; start: number; color?: string; stagger?: number; hl?: string}> = ({text, start, color = C.white, stagger = 2.5, hl = C.green}) => {
	const f = useCurrentFrame();
	const segs = text.split(/(\*[^*]+\*)/).filter(Boolean);
	let k = 0;
	return (
		<>
			{segs.flatMap((sg) => {
				const isHl = sg.startsWith('*');
				return (isHl ? sg.slice(1, -1) : sg).split(/(\s+)/).filter(Boolean).map((w) => {
					if (/^\s+$/.test(w)) return <span key={`s${k++}`}> </span>;
					const t = tw(f, start + k * stagger, start + k * stagger + 10, 0, 1, easeOut);
					k++;
					return (
						<span key={`w${k}`} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.06em'}}>
							<span style={{display: 'inline-block', color: isHl ? hl : color, transform: `translateY(${(1 - t) * 110}%)`}}>{w}</span>
						</span>
					);
				});
			})}
		</>
	);
};

export const STEPS = [
	{n: 1, short: 'EMERGENCY FUND', long: 'BUILD AN EMERGENCY FUND'},
	{n: 2, short: 'EXTRA INCOME', long: 'BRING IN EXTRA MONEY'},
	{n: 3, short: 'NO NEW DEBT', long: 'STOP ADDING NEW DEBT'},
] as const;

/** Big numbered step header under the tracker: number tile slams in, label rises beside it. */
export const StepHeader: React.FC<{step: 0 | 1 | 2; start: number; end: number}> = ({step, start, end}) => {
	const f = useCurrentFrame();
	if (f < start - 1 || f >= end) return null;
	const p = pop(f, start, 12, 210, 0.7);
	const out = tw(f, end - 8, end, 0, 1, easeIn);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 262,
				height: 130,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: 28,
				fontFamily: FONT,
				opacity: 1 - out,
				transform: `translateY(${-out * 30}px)`,
			}}
		>
			<div
				style={{
					width: 118,
					height: 118,
					borderRadius: 28,
					background: C.green,
					color: C.bg,
					fontWeight: 900,
					fontSize: 88,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${0.3 + 0.7 * p}) rotate(${(1 - p) * -12}deg)`,
					opacity: Math.min(1, p * 2),
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				{STEPS[step].n}
			</div>
			<div style={{fontWeight: 900, fontSize: 70, letterSpacing: -1.5, color: C.white, whiteSpace: 'nowrap'}}>
				<Rise text={STEPS[step].short} start={start + 4} stagger={3} />
			</div>
		</div>
	);
};

/** Small footnote for illustrative numbers. */
export const Footnote: React.FC<{text: string; top?: number; start: number; end?: number}> = ({text, top = 1250, start, end = 1e9}) => {
	const f = useCurrentFrame();
	const o = Math.min(tw(f, start, start + 8), tw(f, end - 6, end, 1, 0));
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 120, right: 140, top, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 26, color: '#A3ABA8', opacity: o, letterSpacing: 0.2}}>
			{text}
		</div>
	);
};

/** Matte panel used for every explainer card. */
export const panel = (extra: React.CSSProperties = {}): React.CSSProperties => ({
	position: 'absolute',
	boxSizing: 'border-box',
	borderRadius: 30,
	background: 'linear-gradient(165deg, #1A201E 0%, #131816 100%)',
	border: '2px solid #27302D',
	boxShadow: '0 26px 60px rgba(0,0,0,0.55)',
	fontFamily: FONT,
	...extra,
});

export const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.gray, style}) => (
	<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: 3, color, ...style}}>{children}</div>
);
