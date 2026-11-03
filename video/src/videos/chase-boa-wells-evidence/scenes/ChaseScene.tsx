import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {LogoChip, SourceLabel, StatusTag} from '../../../story/components/Evidence';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {mix, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CHASE_HEAD, LOGO} from '../assets';
import {ACCESSED, CHASE_YEARLY, FACTS} from '../facts';

/**
 * #3 CHASE — "Number three: Chase. Their Total Checking account can charge $15 a month
 * unless you meet certain criteria."
 * Logo → Chase.com's own "$15 or $0 Monthly Service Fee" heading (highlight on "$15")
 * → $15 × 12 = $180/yr (potential) → "$0 FEE IF YOU QUALIFY" with the real example criterion.
 */
export const ChaseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tChase = cue('L2', 'Chase');
	const tTotal = cue('L3', 'Total', -0.15);
	const tFee = cue('L3', '$15');
	const tMonth = cue('L3', 'month');
	const tUnless = cue('L3', 'unless');

	const logoIn = sp(frame, fps, tChase - 8, 'bouncy');
	const dock = sp(frame, fps, tTotal - 4, 'smooth');
	const cardIn = sp(frame, fps, tTotal, 'heavy');
	const mFee = sp(frame, fps, tFee - 1, 'snappy');
	const mAvoid = sp(frame, fps, tUnless + 2, 'snappy');
	const x12 = sp(frame, fps, tFee + 6, 'bouncy');
	const eq = sp(frame, fps, tMonth - 2, 'heavy');
	const waive = sp(frame, fps, tUnless, 'bouncy');
	const tag = sp(frame, fps, tTotal + 8, 'snappy');

	const logoW = (LOGO.chase.natural.w / LOGO.chase.natural.h) * 110 + 68;
	const W = 880;
	const H = (CHASE_HEAD.natural.h / CHASE_HEAD.natural.w) * W;
	const cardTop = 392;
	const calcY = cardTop + H + 120;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F5F0" />
			<ChapterTag n="3" label="CHASE · CHECKING FEE" at={-8} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<LogoChip
				src={LOGO.chase.src}
				natural={LOGO.chase.natural}
				h={mix(110, 46, dock)}
				padX={mix(34, 18, dock)}
				padY={mix(26, 12, dock)}
				style={{left: mix((1080 - logoW) / 2, story.safe.left, dock), top: mix(620, 292, dock), opacity: Math.min(1, logoIn * 1.4), transform: `scale(${0.8 + 0.2 * logoIn})`, transformOrigin: '0 0'}}
			/>
			<StatusTag kind="current" text="CURRENT · NOV 2026" t={tag} style={{left: 330, top: 296}} />

			{cardIn > 0.001 && (
				<Screenshot
					src={CHASE_HEAD.src}
					natural={CHASE_HEAD.natural}
					w={W}
					frame="card"
					palette={{...P, paper: '#FFFFFF'}}
					marks={[
						{r: CHASE_HEAD.heading, t: mFee},
						{r: CHASE_HEAD.avoid, t: mAvoid},
					]}
					style={{left: (1080 - W - 20) / 2, top: cardTop + (1 - cardIn) * 240, opacity: Math.min(1, cardIn * 1.6)}}
				/>
			)}
			<SourceLabel source="Chase.com — Total Checking" date={ACCESSED} palette={P} opacity={cardIn} style={{left: story.safe.left, top: cardTop + H + 40}} />

			{/* $15 × 12 = $180 (potential) */}
			<div style={{position: 'absolute', left: story.safe.left, top: calcY, display: 'flex', alignItems: 'baseline', gap: 18, fontWeight: 900, lineHeight: 1}}>
				<span style={{fontSize: 104, color: P.ink, opacity: mFee, letterSpacing: -3}}>${FACTS.chaseFee.value}</span>
				<span style={{fontSize: 84, color: P.muted, opacity: x12, transform: `translateX(${(1 - x12) * 40}px)`}}>× {FACTS.months.value}</span>
				<span style={{fontSize: 84, color: P.muted, opacity: eq}}>=</span>
				<span style={{opacity: Math.min(1, eq * 1.5)}}>
					<NumberCounter value={CHASE_YEARLY * Math.min(1, eq * 1.08)} prefix="$" fontSize={104} color={P.danger} style={{letterSpacing: -3}} />
				</span>
			</div>
			<div style={{position: 'absolute', left: story.safe.left + 4, top: calcY + 124, fontSize: 28, fontWeight: 800, color: P.muted, opacity: eq}}>per year, only if charged every month</div>

			{/* who avoids it */}
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: calcY + 186,
					width: 690,
					padding: '18px 24px',
					borderRadius: 20,
					background: P.accent,
					color: '#fff',
					boxShadow: `0 18px 34px ${P.shadow}`,
					opacity: Math.min(1, waive * 1.5),
					transform: `translateY(${(1 - waive) * 30}px) scale(${0.94 + 0.06 * waive})`,
					transformOrigin: '0 50%',
				}}
			>
				<div style={{fontSize: 50, fontWeight: 900, lineHeight: 1.05}}>$0 FEE IF YOU QUALIFY</div>
				<div style={{fontSize: 27, fontWeight: 800, marginTop: 8, opacity: 0.92}}>e.g. $500+ in qualifying electronic deposits</div>
			</div>

			<Marcus
				x={950}
				y={story.ground}
				scale={0.74}
				facing={-1}
				seed={5}
				track={[
					{at: 0, pose: 'idle', face: 'curious'},
					{at: tMonth, pose: 'flinch', face: 'worried', spring: 'bouncy'},
					{at: tUnless + 4, pose: 'celebrate', face: 'happy'},
				]}
			/>

			<Sfx at={tChase - 6} name="pop" volume={0.35} />
			<Sfx at={tTotal} name="paper" volume={0.35} />
			<Sfx at={tMonth} name="cash" volume={0.28} />
			<Sfx at={tUnless + 2} name="chime" volume={0.28} />
		</AbsoluteFill>
	);
};
