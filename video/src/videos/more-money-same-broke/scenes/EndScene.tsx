import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {SavingsJar} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {kf, mix, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {NiceCar, ShopBag} from '../props';
import {FACTS, usd} from '../facts';

const TOP = 420;
const BOTTOM = 1300;
const GAP = 20;
const W = (1080 - story.safe.left - story.safe.right - GAP) / 2;

/**
 * ENDING — "Be real. Are you saving that raise or upgrading your lifestyle?"
 * Clean split screen: SAVE THE RAISE (green, jar) vs UPGRADE MY LIFESTYLE
 * (ink, car + bags). Each side lifts on the word that names it; Marcus looks
 * from one to the other. Ends on both options, equal weight.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBe = cue('L16', 'Be');
	const tAre = cue('L17', 'Are');
	const tSaving = cue('L17', 'saving');
	const tOr = cue('L17', 'or');
	const tUpgrading = cue('L17', 'upgrading');
	const tEnd = cue('L17', undefined, 0, 'end');

	const left = sp(frame, fps, tAre - 10, 'smooth');
	const right = sp(frame, fps, tAre - 6, 'smooth');
	const focusL = kf(frame, [tSaving - 2, tSaving + 8, tOr, tOr + 8], [0, 1, 1, 0]);
	const focusR = kf(frame, [tUpgrading - 2, tUpgrading + 8, tEnd + 6, tEnd + 16], [0, 1, 1, 0]);
	const brand = kf(frame, [tEnd, tEnd + 14], [0, 1]);

	const panel = (side: 0 | 1, p: number, focus: number, other: number, bg: string, children: React.ReactNode) => (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left + side * (W + GAP),
				top: TOP,
				width: W,
				height: BOTTOM - TOP,
				borderRadius: 36,
				background: bg,
				overflow: 'hidden',
				boxShadow: `0 ${20 + 20 * focus}px ${40 + 30 * focus}px ${P.shadow}`,
				transform: `translateX(${(1 - p) * (side ? 600 : -600)}px) scale(${1 + 0.035 * focus - 0.02 * other})`,
				opacity: 1 - 0.3 * other,
			}}
		>
			{children}
		</div>
	);

	const label = (lines: string[], color: string) => (
		<div style={{position: 'absolute', left: 32, right: 24, top: 40, fontSize: 60, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.02, color}}>
			{lines.map((l) => (
				<div key={l}>{l}</div>
			))}
		</div>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: story.safe.top + 30}}>
				<KineticText text="BE REAL." at={tBe - 4} mode="slam" slamScale={0.3} fontSize={story.type.display} color={P.ink} colors={{REAL: P.accent}} />
			</div>

			{panel(
				0,
				left,
				focusL,
				focusR,
				P.accent,
				<>
					{label(['SAVE', 'THE RAISE'], '#fff')}
					<SavingsJar w={260} level={mix(0.35, 0.8, sp(frame, fps, tSaving, 'smooth'))} label="SAVINGS" amount={`+${usd(FACTS.savePerMonth.value)}`} style={{left: W / 2, top: 820}} />
				</>,
			)}
			{panel(
				1,
				right,
				focusR,
				focusL,
				P.ink,
				<>
					{label(['UPGRADE', 'MY', 'LIFESTYLE'], '#F5F2EA')}
					<NiceCar w={360} style={{left: W / 2 - 180 + 40 * (1 - right), top: 340, transform: 'scaleX(-1)'}} />
					<ShopBag w={130} color={P.gold} style={{left: 200, top: 580}} />
					<ShopBag w={110} color={P.danger} style={{left: 310, top: 603}} />
				</>,
			)}

			<Marcus
				x={540}
				y={story.ground}
				scale={0.9}
				facing={frame < tUpgrading - 2 ? -1 : 1}
				seed={9}
				track={[
					{at: 0, pose: 'idle', face: 'neutral'},
					{at: tBe, pose: ['think', {head: 4}], face: 'curious'},
					{at: tSaving - 2, pose: ['point', {fs: 100, head: -8}], face: {lookX: -1}},
					{at: tUpgrading - 2, pose: ['point', {fs: 100, head: -8}], face: {lookX: 1}},
					{at: tEnd + 4, pose: 'shrug', face: 'smug'},
				]}
			/>
			<BrandBug palette={P} opacity={0.75 * brand} style={{left: story.safe.left, top: 1330}} />
			<Sfx at={tBe - 2} name="thud" volume={0.4} />
			<Sfx at={tAre - 8} name="whoosh" volume={0.35} />
			<Sfx at={tSaving} name="pop" volume={0.3} />
			<Sfx at={tUpgrading} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
