import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {CashStack} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {Label} from '../parts';

/**
 * HOOK — "At twenty-two, I said no to free money." / "And that wasn't even my worst mistake."
 * Viewer feels: disbelief (he literally pushes cash away), then the twist —
 * there's something worse coming.
 */
const HAND: [number, number] = [610, 1010]; // where Marcus's stop hand meets the cash

export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tNo = cue('L1', 'no');
	const tMoney = cue('L1', 'money');
	const tL2 = cue('L2');
	const tWorst = cue('L2', 'worst');

	// cash flies in from frame 0 (motion by 1 s), hits the hand on "money", tumbles away
	const inP = prog(frame, -6, Math.max(12, tMoney - 2 + 6), E.inOut);
	const [fx, fy] = arc(inP, [-160, 760], HAND, 160);
	const bounce = prog(frame, tMoney, 26, E.in);
	const [bx, by] = arc(bounce, HAND, [-260, 1500], 120);
	const hit = frame >= tMoney;
	const cx = hit ? bx : fx;
	const cy = hit ? by : fy;
	const rot = hit ? -30 * bounce - 8 : -10 + 10 * inP;
	const impact = shake(frame, tMoney, 9, 14);

	const headOut = tL2 - 4;
	const worst = sp(frame, fps, tWorst - 3, 'heavy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={620} lightY={760} />
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tWorst - 4, zoom: 1},
					{at: tWorst + 20, zoom: 1.08, x: 560, y: 900},
				]}
				shakeX={impact.x}
				shakeY={impact.y}
			>
				<Label color={P.muted} style={{left: story.safe.left, top: story.safe.top + 26, opacity: kf(frame, [headOut, headOut + 8], [1, 0])}}>
					AGE 22
				</Label>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 80, right: story.safe.right}}>
					<KineticText text="I SAID NO" at={-16} exitAt={headOut} fontSize={story.type.display} color={P.ink} />
					<KineticText text="TO FREE MONEY" at={-12} exitAt={headOut + 2} fontSize={story.type.display} color={P.ink} colors={{FREE: P.accent, MONEY: P.accent}} />
				</div>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 80, right: story.safe.right}}>
					<KineticText text="NOT EVEN" at={tL2 + 2} fontSize={story.type.display} color={P.ink} />
					<KineticText text="MY WORST" at={tWorst - 3} mode="slam" fontSize={story.type.display + 16} color={P.ink} colors={{WORST: P.danger}} />
				</div>
				{/* underline that grows under WORST */}
				<div style={{position: 'absolute', left: story.safe.left + 330, top: story.safe.top + 340, height: 12, borderRadius: 6, background: P.danger, width: 420 * worst, opacity: worst}} />

				{cy < 1700 && (
					<div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${cx}px, ${cy}px) rotate(${rot}deg)`}}>
						<CashStack w={230} count={5} style={{left: 0, top: 60}} />
					</div>
				)}

				<Marcus
					x={800}
					y={story.ground}
					scale={1.08}
					facing={-1}
					seed={3}
					onDark
					track={[
						{at: 0, pose: ['idle', {head: -8}], face: 'curious'},
						{at: tNo - 4, pose: 'stop', face: 'determined', spring: 'bouncy'},
						{at: tMoney + 14, pose: ['stop', {head: 6}], face: 'smug'},
						{at: tWorst - 6, pose: 'shrug', face: 'worried', spring: 'bouncy'},
					]}
				/>
			</Camera>
			<Sfx at={0} name="whoosh-soft" volume={0.35} />
			<Sfx at={tMoney} name="thud" volume={0.5} />
			<Sfx at={tWorst - 2} name="stamp" volume={0.4} />
		</AbsoluteFill>
	);
};
