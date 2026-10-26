import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts, SAFE} from '../brand/theme';
import {clamp, ease, springAt, springs} from '../lib/motion';
import {poses} from './character/poses';
import {Stickman} from './character/Stickman';
import {KineticText, type KineticWord} from './KineticText';

type HookProps = {
	/** Small label above the hook line, e.g. "POV" or "1999 → 2024". */
	tag?: string;
	words: KineticWord[];
	exitAt?: number;
	fontSize?: number;
	/** Distance from the top safe edge. */
	offsetY?: number;
};

/** Opening line for the first 1–2 seconds. Sits in the upper safe area. */
export const HookTitle: React.FC<HookProps> = ({tag, words, exitAt, fontSize = 104, offsetY = 40}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const start = words[0]?.at ?? 0;
	const tagIn = springAt(frame, fps, start - 4, springs.soft, 12);
	return (
		<div style={{position: 'absolute', top: SAFE.top + offsetY, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
			{tag ? (
				<div
					style={{
						opacity: tagIn * (exitAt === undefined ? 1 : interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp)),
						translate: `0px ${(1 - tagIn) * 20}px`,
						padding: '10px 24px',
						borderRadius: 999,
						background: colors.green,
						color: colors.black,
						fontFamily: fonts.body,
						fontWeight: 800,
						fontSize: 34,
						letterSpacing: '0.08em',
					}}
				>
					{tag}
				</div>
			) : null}
			<KineticText words={words} style="slam" fontSize={fontSize} exitAt={exitAt} />
		</div>
	);
};

type EndProps = {
	startFrame: number;
	cta?: string;
	handle?: string;
	character?: boolean;
};

/** Brand outro: the stack mark builds, wordmark and CTA settle, Gio waves. */
export const EndCard: React.FC<EndProps> = ({startFrame, cta = 'Follow for more money stories', handle, character = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const f = frame - startFrame;
	if (f < 0) return null;
	const bg = interpolate(f, [0, 8], [0, 1], {...clamp, easing: ease.out});
	const bars = [0, 1, 2].map((i) => springAt(frame, fps, startFrame + 4 + i * 4, springs.pop));
	const word = springAt(frame, fps, startFrame + 14, springs.soft, 16);
	const ctaIn = springAt(frame, fps, startFrame + 20, springs.soft, 16);
	return (
		<AbsoluteFill style={{background: `rgba(10,10,11,${bg})`, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: -120}}>
				{[2, 1, 0].map((i) => (
					<div
						key={i}
						style={{
							width: 200 - i * 30,
							height: 34,
							borderRadius: 10,
							background: i === 2 ? colors.green : colors.white,
							opacity: Math.min(1, bars[i] * 1.4),
							translate: `0px ${(1 - bars[i]) * -80}px`,
							scale: interpolate(bars[i], [0, 1], [0.8, 1]),
						}}
					/>
				))}
				<div
					style={{
						marginTop: 30,
						fontFamily: fonts.display,
						fontWeight: 900,
						fontSize: 84,
						letterSpacing: '-0.02em',
						color: colors.white,
						opacity: word,
						translate: `0px ${(1 - word) * 30}px`,
					}}
				>
					Stack With <span style={{color: colors.green}}>Gio</span>
				</div>
				<div style={{fontFamily: fonts.body, fontWeight: 600, fontSize: 44, color: colors.muted, opacity: ctaIn, translate: `0px ${(1 - ctaIn) * 20}px`}}>
					{cta}
				</div>
				{handle ? <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 40, color: colors.green, opacity: ctaIn}}>{handle}</div> : null}
			</div>
			{character ? (
				<Stickman
					x={540}
					y={1470}
					height={300}
					keys={[
						{frame: startFrame, pose: 'idle', expression: 'happy'},
						// Hand swings at the elbow, arm held out to the side, clear of the face.
						{frame: startFrame + 10, pose: {...poses.wave, armNear: {s: 125, e: 30 + 28 * Math.sin((f - 10) / 3.2)}}, feel: 'pop'},
					]}
					style={{opacity: interpolate(f, [6, 14], [0, 1], clamp)}}
				/>
			) : null}
		</AbsoluteFill>
	);
};
