import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {BAL_AFTER_EXTRA, FACTS} from '../facts';
import {C, Check, DepositChip, ExampleTag, GoalBar, L, VaultBg, fmt} from '../ui';

export const BIG = {counterY: 330, counterFs: 190, barY: 720, barH: 44};
const STEP = FACTS.extraSave.value; // each deposit is an example $100

/** Frames at which each $100 deposit lands, and the balance at any frame. */
export const usePayoffTimeline = () => {
	const {cue} = useCues();
	const slow = [cue('L19', 'remember', 0.15), cue('L19', "isn't"), cue('L19', 'one', 0.1)];
	const tBuilt = cue('L20', 'built');
	const tEvery = cue('L20', 'every', 0.15);
	const slowEnd = BAL_AFTER_EXTRA + slow.length * STEP;
	const fastCount = (FACTS.goal.value - slowEnd) / STEP; // 72
	const fastAt = (f: number) => Math.floor(kf(f, [tBuilt, tEvery], [0, fastCount], E.inOut) + 1e-6);
	const deposits: number[] = [...slow];
	let prev = 0;
	for (let f = tBuilt; f <= tEvery + 1; f++) {
		const n = fastAt(f);
		while (prev < n) {
			deposits.push(f);
			prev++;
		}
	}
	const balanceAt = (f: number) => BAL_AFTER_EXTRA + deposits.filter((d) => d <= f).length * STEP;
	const tDone = deposits[deposits.length - 1];
	return {slow, tBuilt, tEvery, deposits, balanceAt, tDone};
};

/**
 * PAYOFF — "And remember, your first $10,000 isn't built in one paycheck. It's built by
 * what you consistently do with every paycheck."
 * The goal bar from the hook, big. A few slow $100 deposits (one paycheck barely moves it),
 * then a steady accelerating rhythm fills it to $10,000 → restrained completion + check.
 */
export const PayoffScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const {slow, tBuilt, deposits, balanceAt, tDone} = usePayoffTimeline();
	const tCons = cue('L20', 'consistently');
	const tOne = cue('L19', 'one');

	const bal = balanceAt(frame);
	const done = sp(frame, fps, tDone + 1, 'snappy');
	const isDone = frame > tDone;
	const intro = sp(frame, fps, 0, 'smooth');
	const l1 = sp(frame, fps, tCons, 'snappy');
	const l2 = sp(frame, fps, tDone + 2, 'bouncy');
	const oneTag = kf(frame, [tOne, tOne + 8, tBuilt - 4, tBuilt + 4], [0, 1, 1, 0], E.out);
	const push = kf(frame, [tBuilt, tDone, tDone + 24], [1, 1.035, 1], E.inOut);
	const ring = kf(frame, [tDone + 1, tDone + 26], [0, 1], E.out);

	const fillX = (b: number) => L.x + L.w * (b / FACTS.goal.value);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.7 + 0.9 * done} gy={BIG.barY} />
			<div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: `${L.cx}px ${BIG.barY}px`}}>
				<div style={{position: 'absolute', left: L.x, width: L.w, top: 250, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center', opacity: intro}}>
					<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 6, color: C.gray}}>SAVED</div>
					<ExampleTag style={{position: 'relative'}} />
				</div>
				<div style={{position: 'absolute', left: L.x, width: L.w, top: BIG.counterY, display: 'flex', justifyContent: 'center'}}>
					<NumberCounter value={bal} fontSize={BIG.counterFs} color={isDone ? C.green : C.white} roll={false} style={{letterSpacing: -5, textShadow: isDone ? `0 0 ${60 * done}px rgba(57,255,136,0.35)` : 'none'}} />
				</div>

				<GoalBar y={BIG.barY} h={BIG.barH} fill={bal / FACTS.goal.value} mile={1} segments done={done} />
				{/* completion ring around the bar end: restrained, one pulse */}
				{ring > 0 && ring < 1 && (
					<div style={{position: 'absolute', left: L.x + L.w - 40 * (1 + ring), top: BIG.barY + BIG.barH / 2 - 40 * (1 + ring), width: 80 * (1 + ring), height: 80 * (1 + ring), borderRadius: '50%', border: `3px solid rgba(57,255,136,${0.8 * (1 - ring)})`}} />
				)}

				{/* deposits dropping into the bar */}
				{deposits.map((d, i) => {
					const age = frame - d + 12;
					const isSlow = i < slow.length;
					if (age < 0 || age > 14) return null;
					if (!isSlow && i % 3 !== 0) return null;
					const t = Math.min(1, age / 12);
					const x = fillX(BAL_AFTER_EXTRA + (i + 1) * STEP);
					const y = 560 + (BIG.barY - 560) * E.in(t);
					return (
						<DepositChip
							key={i}
							text={`+${fmt(STEP)}`}
							style={{left: Math.min(x, L.x + L.w - 60), top: y, transform: `translate(-50%,-50%) scale(${isSlow ? 1 : 0.8})`, opacity: age > 12 ? 0 : 1}}
						/>
					);
				})}
				<div style={{position: 'absolute', left: fillX(BAL_AFTER_EXTRA + 3 * STEP) - 110, width: 220, top: BIG.barY + BIG.barH + 64, textAlign: 'center', opacity: oneTag, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: C.white}}>
					1 PAYCHECK
				</div>

				<div style={{position: 'absolute', left: L.x, width: L.w, top: 900, textAlign: 'center', lineHeight: 1.04}}>
					<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -3, color: C.white, opacity: l1, transform: `translateY(${(1 - l1) * 24}px)`}}>SMALL DEPOSITS.</div>
					<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -3, color: C.green, opacity: l2, transform: `translateY(${(1 - l2) * 24}px) scale(${0.94 + 0.06 * l2})`}}>BIG PROGRESS.</div>
				</div>
				<div style={{position: 'absolute', left: L.cx - 60, top: 1140, opacity: done}}>
					<Check size={120} p={kf(frame, [tDone + 1, tDone + 20], [0, 1], E.out)} />
				</div>
			</div>

			{slow.map((d, i) => (
				<Sfx key={i} at={d - 1} name="coin" volume={0.25} />
			))}
			<Sfx at={tBuilt} name="whoosh-soft" volume={0.22} />
			<Sfx at={tDone + 2} name="chime" volume={0.4} />
		</AbsoluteFill>
	);
};
