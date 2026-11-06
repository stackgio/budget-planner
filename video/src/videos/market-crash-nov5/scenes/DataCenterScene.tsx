import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {SRC} from '../facts';
import {DataCenter} from '../art';
import {C, Kicker, NewsBg, SourceTag} from '../ui';

export const DC = {w: 940, top: 360};

const Step: React.FC<{label: string[]; p: number; x: number; tone: string}> = ({label, p, x, tone}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: 1046,
			width: 250,
			height: 150,
			borderRadius: 24,
			border: `3px solid ${tone}`,
			background: 'rgba(21,25,23,0.92)',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			fontSize: 31,
			fontWeight: 900,
			letterSpacing: 0.5,
			lineHeight: 1.12,
			color: C.ink,
			textAlign: 'center',
			opacity: p,
			transform: `translateY(${(1 - p) * 30}px) scale(${0.92 + 0.08 * p})`,
		}}
	>
		{label.map((l) => (
			<div key={l}>{l}</div>
		))}
	</div>
);

/**
 * DATA CENTERS — "and now investors are worried that tougher AI regulations could slow down
 * the massive expansion of AI data centers."
 * Layered build site; when "slow down" is said the crane stalls and the site tints red.
 * Labelled as investor FEARS / scenario — no regulation has been enacted.
 */
export const DataCenterScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWorried = cue('L5b', 'worried');
	const tTough = cue('L5b', 'tougher');
	const tSlow = cue('L5b', 'slow');
	const tData = cue('L5b', 'data');
	const s1 = sp(frame, fps, tTough, 'snappy');
	const s2 = sp(frame, fps, tSlow, 'snappy');
	const s3 = sp(frame, fps, tData - 4, 'snappy');
	const run = 1 - kf(frame, [tSlow, tSlow + 24], [0, 1], E.out);
	const stall = kf(frame, [tSlow + 4, tSlow + 20], [0, 1]);
	const px = kf(frame, [0, tData + 30], [36, -36], E.inOut);
	const arrow = (p: number) => ({opacity: p, transform: `translateX(${(1 - p) * -16}px)`});
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg lightX={540} lightY={720} tint={stall > 0.5 ? 'red' : 'none'} light={0.6 + 0.4 * stall} />
			<Kicker style={{left: story.safe.left, top: 250, opacity: kf(frame, [tWorried - 6, tWorried + 4], [0, 1])}} color={C.ink}>
				WHAT INVESTORS FEAR
			</Kicker>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 302,
					padding: '6px 16px',
					borderRadius: 999,
					border: `2px solid ${C.red}`,
					color: C.red,
					fontSize: 24,
					fontWeight: 800,
					letterSpacing: 3,
					opacity: kf(frame, [tTough, tTough + 8], [0, 1]),
				}}
			>
				POSSIBLE SCENARIO · NOT ENACTED
			</div>
			<div style={{position: 'absolute', left: (story.width - DC.w) / 2, top: DC.top}}>
				<DataCenter w={DC.w} frame={frame} px={px} craneRun={run} stall={stall} />
			</div>
			<Step label={['POTENTIAL', 'RULES']} p={s1} x={72} tone={C.muted} />
			<div style={{position: 'absolute', left: 337, top: 1094, fontSize: 44, color: C.muted, ...arrow(s2)}}>→</div>
			<Step label={['SLOWER', 'BUILDOUT?']} p={s2} x={391} tone={C.red} />
			<div style={{position: 'absolute', left: 656, top: 1094, fontSize: 44, color: C.muted, ...arrow(s3)}}>→</div>
			<Step label={['AI', 'UNCERTAINTY']} p={s3} x={710} tone={C.red} />
			<SourceTag text={SRC.reg} />
			<Sfx at={tTough} name="click" volume={0.25} />
			<Sfx at={tSlow} name="click" volume={0.25} />
			<Sfx at={tData - 4} name="click" volume={0.25} />
		</AbsoluteFill>
	);
};
