import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {PhoneSavings} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd0, usd2} from '../facts';
import {MARCUS, PHONE} from '../layout';
import {Ladder} from './Ladder';

/**
 * HYSA — "A high-yield savings account pays 4.5%. Same money, same three years:
 * seven hundred and five dollars. For doing nothing."
 * Same ladder framing as the big bank, but the stacks grow. Viewer learns the
 * difference at a glance and feels the payoff.
 */
export const HysaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRate = cue('L6', '4.5%');
	const tThree = cue('L7', 'three');
	const tSeven = cue('L7', 'seven');
	const tDollars = cue('L7', 'dollars', 0, 'end');
	const tNothing = cue('L7', 'nothing');

	const phoneIn = sp(frame, fps, -4, 'smooth');
	const grow = kf(frame, [tThree, tSeven + 10], [0, 1], E.inOut);
	const earned = sp(frame, fps, tSeven + 2, 'heavy');
	const count = kf(frame, [tSeven, tDollars], [0, FACTS.hysaEarned.value], E.out);
	const vs = sp(frame, fps, tNothing - 4, 'snappy');

	const hysaBalances = FACTS.hysaBalances.map((b) => Math.floor(b.value));
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} warm={false} light={0.6 + 0.6 * grow} />
			<ChapterTag n="02" label="HIGH-YIELD SAVINGS" at={-4} palette={P} style={{left: story.safe.left, top: story.safe.top}} />

			<div style={{position: 'absolute', left: story.safe.left, top: 300, right: story.safe.right}}>
				<KineticText text="4.5% A YEAR" at={tRate - 4} fontSize={110} color={P.ink} colors={{'45': P.accent}} exitAt={tSeven - 14} />
			</div>
			{earned > 0.01 && (
				<div style={{position: 'absolute', left: story.safe.left, top: 296}}>
					<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted, opacity: earned}}>YOU EARN, 3 YEARS</div>
					<div style={{transform: `scale(${1 + (1 - earned) * 0.4})`, transformOrigin: '0 50%', opacity: Math.min(1, earned * 2), filter: `drop-shadow(0 0 ${30 * grow}px rgba(44,212,122,0.35))`}}>
						<NumberCounter value={count} fontSize={150} color={P.accent} style={{letterSpacing: -5}} />
					</div>
				</div>
			)}
			{vs > 0.01 && (
				<div style={{position: 'absolute', right: story.safe.right, top: 330, textAlign: 'right', opacity: vs, transform: `translateX(${(1 - vs) * 40}px)`}}>
					<div style={{fontSize: 26, fontWeight: 900, letterSpacing: 3, color: P.muted}}>BIG BANK</div>
					<div style={{fontSize: 60, fontWeight: 900, color: P.danger, textDecoration: 'line-through', textDecorationThickness: 7}}>{usd2(FACTS.bigEarned.value)}</div>
				</div>
			)}

			<Ladder at={tThree} palette={P} counts={[5, 8, 11]} balances={hysaBalances} deposit={FACTS.deposit.value} countUp tone={P.accent} dark />

			<Camera keys={[{at: 0, zoom: 1}, {at: tNothing - 4, zoom: 1}, {at: tNothing + 16, zoom: 1.05, x: 600, y: 1100}]}>
				<div style={{position: 'absolute', left: PHONE.x, bottom: 1920 - story.ground, opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 60}px)`}}>
					<PhoneSavings w={PHONE.w} balance={usd0(Math.round(FACTS.deposit.value + count))} apy="4.5% APY" earned={grow > 0.95 ? `+${usd0(count)} earned` : undefined} grow={grow} dark />
				</div>
				<Marcus
					x={MARCUS.x}
					y={story.ground}
					scale={MARCUS.scale}
					facing={-1}
					seed={3}
					onDark
					track={[
						{at: 0, pose: 'idle', face: 'curious'},
						{at: tRate, pose: 'point', face: 'focused'},
						{at: tThree + 6, pose: 'present', face: 'happy'},
						{at: tSeven + 4, pose: 'fist', face: 'joy', spring: 'bouncy'},
						{at: tNothing, pose: 'celebrate', face: 'joy', cycle: 'cheer'},
					]}
				/>
			</Camera>
			<Sfx at={tRate} name="chime" volume={0.35} />
			<Sfx at={tThree + 2} name="cash" volume={0.3} />
			<Sfx at={tThree + 14} name="cash" volume={0.3} />
			<Sfx at={tNothing} name="coin" volume={0.4} />
		</AbsoluteFill>
	);
};
