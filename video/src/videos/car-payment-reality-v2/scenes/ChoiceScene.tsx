import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {CarKey, CX, M} from '../parts';

/*
 * L11–L14: from cost to personal choice, on matte black.
 *   L11–L12  the lit "nice car" (same car as the hook). Breathe. "GO FOR IT." on "go for it"
 *   L13      "But me personally": the key comes back; the nice car rolls out and the
 *            silver everyday sedan rolls in → RELIABLE USED CAR
 *   L14      "driving a nice car": Gio's pick moves up, the nice car returns below; on
 *            "stressed about money" an illustrative paycheck bar drains (no figures),
 *            "every single month" → ↻ EVERY MONTH
 */

const GROUND = 1010;

/** Soft studio pool of light so dark paint reads on a phone. */
const Pool: React.FC<{y: number; w?: number; o?: number}> = ({y, w = 1100, o = 1}) => (
	<>
		<div style={{position: 'absolute', left: CX - w / 2, width: w, top: y - 380, height: 480, background: 'radial-gradient(ellipse 50% 50% at 50% 70%, rgba(150,160,172,0.28) 0%, rgba(80,88,98,0.10) 45%, rgba(0,0,0,0) 75%)', opacity: o}} />
		<div style={{position: 'absolute', left: 60, right: 60, top: y - 2, height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 18%, rgba(255,255,255,0.16) 82%, transparent)', opacity: o}} />
	</>
);

/** Illustrative paycheck shares — no amounts, not anyone's real paycheck. */
const SEGS = [
	{label: 'CAR PAYMENT', w: 0.4, word: 'stressed', shade: '#2A2D31'},
	{label: 'INSURANCE', w: 0.12, word: 'about', shade: '#3D4147'},
	{label: 'GAS', w: 0.12, word: 'money', shade: '#52575E'},
];

export const ChoiceScene: React.FC = () => {
	const f = useCurrentFrame();
	const {cue, fps} = useCues();

	const tIf = cue('L12');
	const tGo = cue('L12', 'go');
	const tBut = cue('L13');
	const tMe = cue('L13', 'me');
	const tRather = cue('L13', "I'd");
	const tReliable = cue('L13', 'reliable');
	const tDriving = cue('L14', 'driving');
	const tIfYou = cue('L14', 'if');
	const tEvery = cue('L14', 'every');

	/* nice car: parked from the start, rolls out left on "But" */
	const niceIn = prog(f, 0, 24, E.out);
	const niceOut = prog(f, tBut + 2, 18, E.in);
	const niceX = mix(-120, 0, niceIn) - 1150 * niceOut;
	const sheen = kf(f, [0, 90], [-0.2, 1.1], E.soft);

	const affordIn = sp(f, fps, tIf + 4, 'snappy');
	const goIn = sp(f, fps, tGo - 2, 'bouncy');
	const textOut = prog(f, tBut, 8, E.in);

	/* key returns on "me personally" */
	const keyT = prog(f, tMe - 6, 16, E.in);
	const keySettle = sp(f, fps, tMe + 10, 'bouncy');
	const keyXY = arc(keyT, [1260, 80], [842, 452], 140);
	const keyRot = mix(140, -18, keyT) + (1 - keySettle) * 8;

	/* silver everyday sedan rolls in */
	const used = sp(f, fps, tRather - 4, 'heavy');
	const usedX = mix(1150, 0, used);
	const relIn = sp(f, fps, tReliable - 2, 'snappy');

	/* L14 */
	const up = prog(f, tDriving - 6, 18, E.inOut);
	const nice2 = sp(f, fps, tDriving - 2, 'heavy');
	const card = sp(f, fps, tIfYou - 4, 'smooth');
	const BAR = 760;
	let usedShare = 0;
	const segs = SEGS.map((s) => {
		const at = cue('L14', s.word) - 2;
		const p = kf(f, [at, at + 12], [0, 1], E.out);
		const left = usedShare;
		usedShare += s.w * p;
		return {...s, at, p, left};
	});
	const loop = sp(f, fps, tEvery - 2, 'snappy');

	return (
		<AbsoluteFill style={{background: M.bg}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 40% at 50% 55%, #17191D 0%, #0B0C0E 72%)'}} />

			{/* ── part 1: the nice car, breathing room ── */}
			{niceOut < 1 && (
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${niceX}px)`}}>
					<Pool y={GROUND} o={1 - niceOut} />
					<Car id="nicecar" variant="luxury" paint={PAINTS.gunmetal} x={CX} y={GROUND} w={900} lights={1} beam={0.4} rim={1} sheen={sheen} sheenAmt={0.6} reflection={0.2} spin={-niceOut * 540} />
				</div>
			)}
			{affordIn > 0 && textOut < 1 && (
				<div style={{position: 'absolute', left: 72, right: 120, top: 330, textAlign: 'center', fontFamily: M.font, fontWeight: 900, opacity: 1 - textOut}}>
					<div style={{fontSize: 58, color: M.ink, letterSpacing: 1, opacity: Math.min(1, affordIn), transform: `translateY(${(1 - affordIn) * 20}px)`}}>CAN COMFORTABLY AFFORD IT?</div>
					<div style={{fontSize: 118, color: M.green, letterSpacing: -2, marginTop: 14, opacity: Math.min(1, goIn * 1.5), transform: `scale(${mix(0.8, 1, goIn)})`}}>GO FOR IT.</div>
				</div>
			)}

			{/* ── part 2: Gio's pick (moves up on L14) ── */}
			{f >= tMe - 8 && (
				<div style={{position: 'absolute', inset: 0, transformOrigin: `${CX}px 300px`, transform: `translateY(${mix(0, -150, up)}px) scale(${mix(1, 0.6, up)})`}}>
					{used > 0.001 && (
						<div style={{position: 'absolute', inset: 0, transform: `translateX(${usedX}px)`}}>
							<Pool y={GROUND} o={Math.min(1, used * 2)} />
							<Car id="usedcar" variant="sedan" paint={PAINTS.silver} x={CX} y={GROUND} w={840} lights={0.15} spin={-(1 - used) * 400} sheen={0.55} sheenAmt={0.45} reflection={0.12} rim={0.6} />
						</div>
					)}
					{relIn > 0 && (
						<div style={{position: 'absolute', left: 110, top: 330, fontFamily: M.font, fontWeight: 900, lineHeight: 1, opacity: Math.min(1, relIn * 1.5), transform: `translateX(${(1 - relIn) * -40}px)`}}>
							<div style={{fontSize: 104, color: M.green, letterSpacing: -2}}>RELIABLE</div>
							<div style={{fontSize: 104, color: M.ink, letterSpacing: -2, marginTop: 6}}>USED CAR</div>
						</div>
					)}
					<CarKey x={keyXY[0]} y={keyXY[1]} rot={keyRot} scale={0.9} />
				</div>
			)}

			{/* ── part 3: the nice car + a paycheck that drains every month ── */}
			{nice2 > 0.001 && (
				<>
					<div style={{position: 'absolute', left: 90, right: 150, top: 636, height: 2, background: M.line, opacity: up}} />
					<div style={{position: 'absolute', inset: 0, transform: `translateX(${mix(-1000, 0, nice2)}px)`}}>
						<Pool y={912} w={900} />
						<Car id="nicecar2" variant="luxury" paint={PAINTS.gunmetal} x={CX} y={912} w={620} lights={0.8} rim={1} sheen={0.6} sheenAmt={0.5} reflection={0.12} spin={-(1 - nice2) * 400} />
					</div>
				</>
			)}
			{card > 0.001 && (
				<div
					style={{
						position: 'absolute',
						left: 80,
						width: 860,
						top: 966,
						height: 300,
						borderRadius: 30,
						background: 'rgba(255,255,255,0.05)',
						border: '2px solid rgba(255,255,255,0.12)',
						boxSizing: 'border-box',
						opacity: card,
						transform: `translateY(${(1 - card) * 40}px)`,
						fontFamily: M.font,
					}}
				>
					<div style={{position: 'absolute', left: 50, top: 30, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: M.ink}}>PAYCHECK</div>
					<div style={{position: 'absolute', right: 50, top: 24, fontWeight: 900, fontSize: 26, letterSpacing: 5, color: M.paperInk, background: M.ink, borderRadius: 10, padding: '6px 16px'}}>EXAMPLE</div>
					<div style={{position: 'absolute', left: 50, top: 100, width: BAR, height: 72, borderRadius: 18, overflow: 'hidden', background: M.green}}>
						{segs.map((s) => (
							<div key={s.label} style={{position: 'absolute', left: s.left * BAR, top: 0, bottom: 0, width: s.w * s.p * BAR, background: s.shade, borderRight: s.p > 0.02 ? '3px solid rgba(255,255,255,0.45)' : undefined}} />
						))}
					</div>
					<div style={{position: 'absolute', left: 50, top: 194, display: 'flex', gap: 22}}>
						{segs.map((s) => (
							<div key={s.label} style={{fontWeight: 800, fontSize: 26, letterSpacing: 2, color: M.ink, opacity: f < s.at ? 0 : prog(f, s.at, 5), transform: `translateY(${(1 - prog(f, s.at, 10)) * 10}px)`}}>
								− {s.label}
							</div>
						))}
					</div>
					<div style={{position: 'absolute', right: 50 + 22, top: 100, height: 72, display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 24, letterSpacing: 3, color: M.paperInk, opacity: prog(f, segs[2].at + 8, 8)}}>LEFT OVER</div>
					<div style={{position: 'absolute', right: 50, top: 238, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: M.ink, opacity: Math.min(1, loop * 1.5), transform: `translateY(${(1 - loop) * 12}px)`}}>
						<span style={{display: 'inline-block', transform: `rotate(${(1 - loop) * -180}deg)`, color: M.green}}>↻</span> EVERY MONTH
					</div>
				</div>
			)}

			<Sfx at={tMe - 6} name="whoosh-soft" volume={0.25} />
			<Sfx at={tMe + 9} name="click" volume={0.35} />
			<Sfx at={tBut + 2} name="whoosh" volume={0.2} />
			{segs.map((s) => (
				<Sfx key={s.label} at={s.at} name="tick" volume={0.2} />
			))}
		</AbsoluteFill>
	);
};
