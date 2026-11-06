import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, NewsBg} from '../ui';

const Panel: React.FC<{x: number; w: number; color: string; lines: string[]; up: boolean; p: number; pulse: number}> = ({x, w, color, lines, up, p, pulse}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: 380,
			width: w,
			height: 760,
			borderRadius: 36,
			background: `linear-gradient(180deg, ${color}26 0%, ${color}0D 100%)`,
			border: `4px solid ${color}`,
			opacity: Math.min(1, p * 1.4),
			transform: `translateY(${(1 - p) * 70}px) scale(${1 + 0.03 * pulse})`,
			boxShadow: `0 0 ${60 * pulse}px ${color}66`,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			padding: up ? '0 50px 0 34px' : '0 26px 0 62px',
		}}
	>
		<svg width={110} height={74} viewBox="0 0 120 80" style={{marginBottom: 34}}>
			<path d={up ? 'M10 70 L60 14 L110 70' : 'M10 10 L60 66 L110 10'} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
		{lines.map((l) => (
			<div key={l} style={{fontSize: 76, fontWeight: 900, lineHeight: 1.02, color: l.endsWith('?') ? color : C.ink, letterSpacing: -1}}>
				{l}
			</div>
		))}
	</div>
);

/**
 * DEBATE — "So what do you think? / Is this a buying opportunity, or is the market about to get even worse?"
 * Split screen holds to the last frame (no logo outro).
 */
export const DebateScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSo = cue('L15');
	const tBuy = cue('L16', 'buying');
	const tOr = cue('L16', 'or');
	const tWorse = cue('L16', 'worse?');
	const left = sp(frame, fps, tBuy - 4, 'bouncy');
	const right = sp(frame, fps, tOr - 2, 'bouncy');
	const lp = kf(frame, [tBuy, tBuy + 6, tBuy + 24], [0, 1, 0]);
	const rp = kf(frame, [tWorse, tWorse + 6, tWorse + 24], [0, 1, 0]);
	const vs = sp(frame, fps, tOr + 4, 'snappy');
	const W = (story.width - story.safe.left * 2 - 24) / 2;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg lightY={800} light={0.8} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 236}}>
				<KineticText text="WHAT DO YOU THINK?" at={tSo - 2} fontSize={74} color={C.ink} />
			</div>
			<Panel x={story.safe.left} w={W} color={C.green} lines={['BUY', 'THE DIP?']} up p={left} pulse={lp} />
			<Panel x={story.safe.left + W + 24} w={W} color={C.red} lines={['WAIT', 'FOR', 'LOWER?']} up={false} p={right} pulse={rp} />
			<div
				style={{
					position: 'absolute',
					left: story.safe.left + W + 12 - 50,
					top: 710,
					width: 100,
					height: 100,
					borderRadius: 50,
					background: C.bg,
					border: `3px solid ${C.line}`,
					color: C.ink,
					fontSize: 36,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${vs})`,
				}}
			>
				VS
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 1180, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: kf(frame, [tOr, tOr + 12], [0, 1])}}>
				<div style={{fontSize: 34, fontWeight: 900, letterSpacing: 3, color: C.ink}}>COMMENT YOUR PICK ↓</div>
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 1352, fontSize: 24, fontWeight: 700, letterSpacing: 2.5, color: C.muted}}>NOT FINANCIAL ADVICE</div>
			<Sfx at={tBuy - 4} name="pop" volume={0.22} />
			<Sfx at={tOr - 2} name="pop" volume={0.22} />
		</AbsoluteFill>
	);
};
