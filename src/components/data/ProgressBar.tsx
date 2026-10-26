import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts, SAFE_CENTER_WIDTH} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

type Props = {
	/** 0–1 at start and end of the fill. */
	from?: number;
	to: number;
	startFrame: number;
	endFrame: number;
	label?: string;
	/** Text on the right; receives the live 0–1 value. */
	valueText?: (v: number) => string;
	/** Tick marks (0–1) that light up as the fill passes them. */
	milestones?: number[];
	color?: string;
	width?: number;
	height?: number;
	/** Use the same easing as any counter showing the same number. */
	easing?: (t: number) => number;
};

/** Goal / payoff progress bar with a moving sheen and milestone ticks. */
export const ProgressBar: React.FC<Props> = ({
	from = 0,
	to,
	startFrame,
	endFrame,
	label,
	valueText = (v) => `${Math.round(v * 100)}%`,
	milestones = [],
	color = colors.green,
	width = SAFE_CENTER_WIDTH,
	height = 48,
	easing = ease.inOut,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const v = interpolate(frame, [startFrame, endFrame], [from, to], {...clamp, easing});
	const enter = springAt(frame, fps, startFrame - 10, springs.soft, 14);
	const done = springAt(frame, fps, endFrame, springs.pop);
	const sheen = ((frame - startFrame) % 45) / 45;
	return (
		<div style={{width, fontFamily: fonts.body, opacity: enter, translate: `0px ${(1 - enter) * 30}px`}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18}}>
				<span style={{fontSize: 40, fontWeight: 700, color: colors.white}}>{label}</span>
				<span
					style={{
						fontFamily: fonts.display,
						fontSize: 56,
						fontWeight: 900,
						color,
						fontVariantNumeric: 'tabular-nums',
						scale: 1 + interpolate(done, [0, 0.5, 1], [0, 0.12, 0], clamp),
					}}
				>
					{valueText(v)}
				</span>
			</div>
			<div style={{position: 'relative', height, borderRadius: height, background: colors.surface, border: `2px solid ${colors.line}`, overflow: 'hidden'}}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: `${v * 100}%`,
						borderRadius: height,
						background: `linear-gradient(90deg, ${color}AA, ${color})`,
						boxShadow: `0 0 24px ${color}66`,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							width: 120,
							left: `${sheen * 140 - 20}%`,
							background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
						}}
					/>
				</div>
				{milestones.map((m) => (
					<div
						key={m}
						style={{
							position: 'absolute',
							left: `${m * 100}%`,
							top: 8,
							bottom: 8,
							width: 4,
							borderRadius: 2,
							background: v >= m ? colors.black : colors.dim,
							opacity: 0.7,
						}}
					/>
				))}
			</div>
		</div>
	);
};
