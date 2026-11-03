import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Coin} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {sp, wobble} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';

export const SLOT = {y: 610, w: 268, h: 290, gap: 28};
export const slotX = (i: number) => story.safe.left + i * (SLOT.w + SLOT.gap);

/**
 * HOOK — "These are three banks I'd personally think twice about trusting with my money."
 * Frame 0: headline + three face-down ranking cards (#3 #2 #1). Marcus weighs a coin.
 * Card #3 is where the next scene's iris opens from.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tThink = cue('L1', 'think');
	const tTrust = cue('L1', 'trusting');
	const tMoney = cue('L1', 'money');
	const tEnd = cue('L1', undefined, 0, 'end');

	const cards = [0, 1, 2].map((i) => sp(frame, fps, -12 + i * 3, 'bouncy'));
	const focus3 = sp(frame, fps, tEnd - 8, 'smooth');
	const coinUp = sp(frame, fps, tMoney - 4, 'bouncy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} light={0.9} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tThink, zoom: 1}, {at: tThink + 30, zoom: 1.05, x: 540, y: 900}, {at: tEnd, zoom: 1.05, x: 540, y: 900}]}>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>RANKED · WITH RECEIPTS</div>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 60, right: story.safe.right}}>
					<KineticText text="3 BANKS I'D" at={-16} fontSize={112} color={P.ink} colors={{'3': P.accent}} />
					<KineticText text="THINK TWICE" at={-14} fontSize={112} color={P.ink} colors={{TWICE: P.accent}} />
					<KineticText text="ABOUT" at={-12} fontSize={112} color={P.ink} />
				</div>

				{[0, 1, 2].map((i) => {
					const p = cards[i];
					const n = 3 - i;
					const lift = i === 0 ? -18 * focus3 : 10 * focus3;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: slotX(i),
								top: SLOT.y + (1 - p) * 120 + lift + wobble(frame, i + 2, 0.05, 3),
								width: SLOT.w,
								height: SLOT.h,
								borderRadius: 30,
								background: i === 0 ? '#FFFDF8' : P.paper,
								border: `3px solid ${i === 0 ? P.accent : P.line}`,
								boxShadow: `0 30px 60px ${P.shadow}`,
								opacity: Math.min(1, p * 1.4) * (i === 0 ? 1 : 1 - 0.45 * focus3),
								transform: `rotate(${(i - 1) * 3 * (1 - focus3)}deg)`,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 6,
							}}
						>
							<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: i === 0 ? '#857D6E' : P.muted}}>NUMBER</div>
							<div style={{fontSize: 150, fontWeight: 900, lineHeight: 1, color: i === 0 ? '#121316' : P.ink, letterSpacing: -6}}>{n}</div>
							<div style={{fontSize: 60, fontWeight: 900, color: P.accent}}>?</div>
						</div>
					);
				})}

				<Coin size={86} spin={frame * 0.12} style={{left: 860, top: 1260 - 120 * coinUp, opacity: coinUp}} />
				<Marcus
					x={860}
					y={story.ground}
					scale={0.86}
					facing={-1}
					onDark
					seed={4}
					track={[
						{at: 0, pose: 'think', face: 'curious'},
						{at: tTrust, pose: 'shrug', face: 'worried', spring: 'bouncy'},
						{at: tMoney, pose: ['present', {head: -6}], face: 'focused'},
					]}
				/>
			</Camera>
			<Sfx at={tThink} name="whoosh-soft" volume={0.3} />
			<Sfx at={tMoney - 2} name="coin" volume={0.35} />
		</AbsoluteFill>
	);
};

export const HOOK_CARD3 = {x: slotX(0) + SLOT.w / 2, y: SLOT.y + SLOT.h / 2};
