import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, Kicker, NewsBg} from '../ui';

const Chevron: React.FC<{x: number; y: number; up: boolean; color: string; o: number; s?: number}> = ({x, y, up, color, o, s = 1}) => (
	<svg width={120 * s} height={80 * s} viewBox="0 0 120 80" style={{position: 'absolute', left: x, top: y, opacity: o}}>
		<path d={up ? 'M10 70 L60 14 L110 70' : 'M10 10 L60 66 L110 10'} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * PIVOT — "But while some investors are panic selling, I'm doing the complete opposite. / I'm still buying the dip."
 * Red panic state → a green panel rises on "opposite" and resets the whole frame to calm green.
 * No pause added: the reset happens on the word.
 */
export const PivotScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSome = cue('L9', 'some');
	const tPanic = cue('L9', 'panic');
	const tOpp = cue('L9', 'complete');
	const tStill = cue('L10');
	const tDip = cue('L10', 'dip.');
	const sweep = kf(frame, [tOpp - 2, tOpp + 14], [0, 1], E.inOut);
	const redOut = kf(frame, [tOpp - 2, tOpp + 8], [0, 1], E.in);
	const panicIn = sp(frame, fps, tPanic - 2, 'heavy');
	const greenIn = sp(frame, fps, tOpp + 6, 'smooth');
	const fall = (k: number) => ((frame * 3 + k * 140) % 700) - 100;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			{/* red phase */}
			<AbsoluteFill style={{opacity: 1 - redOut * 0.0}}>
				<NewsBg tint="red" lightY={760} light={0.6 + 0.6 * panicIn} />
				{[0, 1, 2, 3, 4].map((k) => (
					<Chevron key={k} x={110 + k * 190} y={330 + fall(k)} up={false} color={C.red} o={0.18 * (0.45 + 0.55 * panicIn) * (1 - redOut)} />
				))}
				<div style={{opacity: 1 - redOut, transform: `translateY(${-redOut * 80}px)`}}>
					<Kicker style={{left: story.safe.left, top: 560, opacity: kf(frame, [0, 8, tSome, tSome + 6], [0.5, 0.5, 0.5, 1])}}>SOME INVESTORS</Kicker>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 620}}>
						<KineticText text="PANIC SELLING" mode="slam" slamScale={0.25} at={tPanic - 2} fontSize={132} color={C.red} />
					</div>
				</div>
			</AbsoluteFill>
			{/* green reset: panel rises from below on "opposite" */}
			<AbsoluteFill style={{clipPath: `inset(${(1 - sweep) * 100}% 0 0 0)`}}>
				<NewsBg tint="green" lightY={900} light={1.2} />
				<div style={{position: 'absolute', left: 0, right: 0, top: `${(1 - sweep) * 100}%`, height: 6, background: C.green, boxShadow: `0 0 40px ${C.green}`, opacity: sweep < 1 ? 1 : 0}} />
				<Kicker style={{left: story.safe.left, top: 470, opacity: greenIn}} color={C.green}>
					ME? THE OPPOSITE.
				</Kicker>
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 540}}>
					<KineticText text="STILL BUYING" at={tStill - 2} fontSize={134} color={C.ink} />
					<KineticText text="THE DIP." at={tDip - 6} fontSize={134} color={C.green} />
				</div>
				<Chevron x={story.safe.left} y={900} up color={C.green} o={kf(frame, [tDip, tDip + 10], [0, 0.9])} s={1.2} />
			</AbsoluteFill>
			<Sfx at={tPanic - 2} name="thud" volume={0.2} />
			<Sfx at={tOpp - 2} name="whoosh" volume={0.24} />
			<Sfx at={tDip} name="chime" volume={0.24} />
		</AbsoluteFill>
	);
};
