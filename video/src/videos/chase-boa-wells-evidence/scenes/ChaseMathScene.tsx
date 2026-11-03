import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {SourceLabel} from '../../../story/components/Evidence';
import {Marcus} from '../../../story/components/Marcus';
import {Coin} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {arc, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CHASE_NOTE} from '../assets';
import {ACCESSED, CHASE_YEARLY, FACTS} from '../facts';

/**
 * "That's $180 a year if you can't avoid the fee. I'd rather keep that money."
 * The $15 lifts out of Chase's own footnote ("Otherwise a $15 Monthly Service Fee will apply.")
 * into $15 × 12 = $180. Clearly labelled as a POTENTIAL cost, not one everyone pays.
 */
export const ChaseMathScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tThats = cue('L4', "That's");
	const t180 = cue('L4', '$180');
	const tYear = cue('L4', 'year');
	const tAvoid = cue('L4', 'avoid');
	const tKeep = cue('L5', 'keep');

	const strip = sp(frame, fps, -8, 'smooth');
	const markP = sp(frame, fps, 2, 'snappy');
	const fly = sp(frame, fps, tThats - 6, {damping: 18, stiffness: 90, mass: 0.9});
	const times = sp(frame, fps, tThats + 4, 'bouncy');
	const eq = sp(frame, fps, t180 - 4, 'heavy');
	const pot = sp(frame, fps, tYear + 4, 'snappy');
	const waive = sp(frame, fps, tAvoid, 'snappy');
	const coin = sp(frame, fps, tKeep - 6, 'bouncy');

	const W = 880;
	const [fx, fy] = arc(fly, [760, 380], [story.safe.left, 640], 120);
	const fs = 60 + (150 - 60) * fly;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<Screenshot
				src={CHASE_NOTE.src}
				natural={CHASE_NOTE.natural}
				w={W}
				viewportH={150}
				frame="card"
				palette={P}
				zoomTo={CHASE_NOTE.view}
				focus={1}
				marks={[
					{r: CHASE_NOTE.phrase, t: markP},
					{r: CHASE_NOTE.apply, t: markP},
				]}
				style={{left: (1080 - W - 20) / 2, top: story.safe.top + 20 + (1 - strip) * -40, opacity: strip}}
			/>
			<SourceLabel source="Chase.com — Total Checking, footnote 1" date={ACCESSED} palette={P} opacity={strip} style={{left: story.safe.left, top: story.safe.top + 200}} />

			{/* $15 lifted from the footnote */}
			<div style={{position: 'absolute', left: fx, top: fy, fontSize: fs, fontWeight: 900, color: P.ink, letterSpacing: -4, lineHeight: 1, opacity: Math.min(1, fly * 3)}}>
				${FACTS.chaseFee.value}
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left + 330,
					top: 640,
					fontSize: 150,
					fontWeight: 900,
					color: P.muted,
					lineHeight: 1,
					letterSpacing: -4,
					opacity: times,
					transform: `translateX(${(1 - times) * 60}px)`,
				}}
			>
				× {FACTS.months.value}
			</div>
			<div style={{position: 'absolute', left: story.safe.left + 610, top: 668, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted, opacity: times}}>
				MONTHS
			</div>

			<div style={{position: 'absolute', left: story.safe.left, top: 820, display: 'flex', alignItems: 'baseline', gap: 20, opacity: Math.min(1, eq * 1.5), transform: `scale(${0.9 + 0.1 * eq})`, transformOrigin: '0 50%'}}>
				<span style={{fontSize: 150, fontWeight: 900, color: P.muted}}>=</span>
				<NumberCounter value={eq > 0.02 ? CHASE_YEARLY * Math.min(1, eq * 1.1) : 0} prefix="$" fontSize={210} color={P.danger} style={{letterSpacing: -8}} />
				<span style={{fontSize: 56, fontWeight: 900, color: P.danger}}>/yr</span>
			</div>

			<div style={{position: 'absolute', left: story.safe.left, top: 1090, opacity: pot, transform: `translateY(${(1 - pot) * 20}px)`}}>
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.ink}}>POTENTIAL COST</div>
				<div style={{fontSize: 30, fontWeight: 800, color: P.muted, marginTop: 6}}>if charged all 12 months</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 1210,
					padding: '10px 18px',
					borderRadius: 12,
					background: P.accentSoft,
					color: P.accentDeep,
					fontSize: 30,
					fontWeight: 900,
					letterSpacing: 1,
					opacity: waive,
					transform: `scale(${0.9 + 0.1 * waive})`,
					transformOrigin: '0 50%',
				}}
			>
				Not everyone pays it
			</div>

			<Coin size={70} spin={frame * 0.1} style={{left: 960, top: 1120 + 90 * coin, opacity: coin * (1 - Math.max(0, coin - 0.95) * 20)}} />
			<Marcus
				x={955}
				y={story.ground}
				scale={0.82}
				facing={-1}
				seed={7}
				track={[
					{at: 0, pose: 'think', face: 'curious'},
					{at: t180, pose: 'shock', face: 'shock', spring: 'bouncy'},
					{at: tKeep - 4, pose: 'hold', face: 'smug'},
				]}
			/>

			<Sfx at={tThats - 4} name="whoosh-soft" volume={0.3} />
			<Sfx at={t180 + 8} name="cash" volume={0.3} />
			<Sfx at={tKeep} name="coin" volume={0.35} />
		</AbsoluteFill>
	);
};
