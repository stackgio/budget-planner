import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, FONT} from '../look';

const usd = (v: number) => `$${v.toLocaleString('en-US')}`;
const INK = '#0F0F10';
const GREEN_ON_WHITE = '#0E9F4E';

/** Neutral white stage (kept for the montage scene, which imports it). */
export const SunBg: React.FC<{sun?: number}> = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F3 60%, #E9E9E6 100%)'}} />
);

/**
 * Phase timing (local frames), all keyed to "half":
 *   0 … tSplit        $13,800/YR on one full bar — no "HALF" anywhere
 *   tSplit … tGone    the bar splits into two equal halves; $13,800/YR fades out completely
 *   tLabel …          "HALF = $6,900" fades in as ONE locked element (never a counter)
 * tLabel > tGone, so "HALF" can never share a frame with $13,800.
 */
export const halfPhases = (tHalf: number) => {
	const tSplit = tHalf - 4;
	const tGone = tSplit + 10;
	const tLabel = tGone + 1;
	return {tSplit, tGone, tLabel};
};

export const HalfScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHalf = cue('L9', 'half');
	const {tSplit, tGone, tLabel} = halfPhases(tHalf);

	const intro = sp(frame, fps, 2, 'smooth');
	const split = sp(frame, fps, tSplit, 'smooth');
	const yearO = frame >= tGone ? 0 : 1 - prog(frame, tSplit, tGone - tSplit, E.inOut);
	const labelO = frame < tLabel ? 0 : prog(frame, tLabel, 6);
	const label = sp(frame, fps, tLabel, 'heavy');
	const W = 900;
	const gap = 40 * split;
	const halfW = (W - gap) / 2;

	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F3 60%, #E9E9E6 100%)'}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', opacity: intro}}>
				<ExampleTag dark={false} text="Example annual cost" />
			</div>
			{/* $13,800/YR — shown first, gone before HALF appears */}
			{yearO > 0 && (
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 360,
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: 900,
						fontSize: 190,
						lineHeight: 1,
						letterSpacing: -7,
						color: INK,
						opacity: yearO * intro,
						transform: `translateY(${(1 - intro) * 30 - (1 - yearO) * 30}px)`,
					}}
				>
					{usd(FACTS.yearly.value)}
					<span style={{fontSize: 70, letterSpacing: 0}}>/YR</span>
				</div>
			)}
			{/* one bar → two equal halves */}
			<div style={{position: 'absolute', left: (1080 - W) / 2, top: 620, width: W, height: 96}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: halfW, height: 96, borderRadius: split > 0.02 ? 48 : '48px 0 0 48px', background: INK, opacity: mix(1, 0.18, split)}} />
				<div style={{position: 'absolute', left: halfW + gap, top: -18 * split, width: halfW, height: 96, borderRadius: split > 0.02 ? 48 : '0 48px 48px 0', background: split > 0.5 ? GREEN_ON_WHITE : INK, boxShadow: `0 16px 40px rgba(14,159,78,${0.3 * split})`}} />
				{/* centre divider drawn just before the split */}
				<div style={{position: 'absolute', left: W / 2 - 3, top: -20, width: 6, height: 136, borderRadius: 3, background: C.green, opacity: kf(frame, [tSplit - 10, tSplit - 2, tSplit + 6], [0, 1, 0])}} />
				<div style={{position: 'absolute', left: 0, top: 112, width: halfW, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: '#8A8F96', opacity: labelO}}>½</div>
				<div style={{position: 'absolute', left: halfW + gap, top: 112 - 18, width: halfW, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: GREEN_ON_WHITE, opacity: labelO}}>½</div>
			</div>
			{/* HALF = $6,900 — a single, locked label */}
			{labelO > 0 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: FONT, opacity: labelO, transform: `scale(${1.1 - 0.1 * label})`}}>
					<div style={{fontWeight: 900, fontSize: 120, lineHeight: 1, letterSpacing: -4, color: INK}}>
						HALF = <span style={{color: GREEN_ON_WHITE}}>{usd(FACTS.half.value)}</span>
					</div>
					<div style={{marginTop: 26, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: '#3C3F44'}}>HALF OF THE EXAMPLE ANNUAL COST</div>
					<div style={{marginTop: 8, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: '#8A8F96'}}>HYPOTHETICAL</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
