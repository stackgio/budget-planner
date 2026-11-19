import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import '../../fonts';
import {cinematic, story} from '../../story/theme';
import {BEATS, BG_SRC, BG_START_SEC, FPS, type Beat} from './script';

const W = story.width;
const H = story.height;
const SAFE = story.safe; // top 170, right 120, bottom 330, left 72
const GREEN = cinematic.accent;
const CHARCOAL = '17,18,21'; // #111215

/** Text block: centred in the horizontal safe band, slightly above the vertical midpoint. */
const BLOCK_CX = (SAFE.left + (W - SAFE.right)) / 2; // 516
const BLOCK_CY = 830;
const BLOCK_W = W - SAFE.left - SAFE.right; // 888

const SETUP_SIZE = 68;
const PAYOFF_SIZE = 104;

const sec = (s: number) => Math.round(s * FPS);
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const easeIn = Easing.bezier(0.55, 0, 0.75, 0.3);

// ---------- background: one continuous shot ----------
const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const total = sec(10);
	// Slow push-in across the whole shot (on top of the footage's own forward travel).
	const scale = interpolate(frame, [0, total], [1, 1.04]);
	// Near-black open; light lifts as "1 good day" lands (5.6 s) and keeps easing up.
	const lift = interpolate(frame, [0, sec(5.3), sec(5.6), sec(7.4), total], [0, 0.12, 0.22, 0.72, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateRight: 'clamp',
	});
	const brightness = 0.32 + lift * 0.34; // 0.32 → 0.66
	const overlay = 0.62 - lift * 0.18; // charcoal 62% → 44%
	return (
		<AbsoluteFill style={{backgroundColor: '#050506', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 68%'}}>
				<OffthreadVideo
					src={staticFile(BG_SRC)}
					muted
					trimBefore={BG_START_SEC * FPS}
					style={{width: W, height: H, objectFit: 'cover', filter: `brightness(${brightness}) saturate(0.82) contrast(1.06)`}}
				/>
			</AbsoluteFill>
			{/* charcoal overlay */}
			<AbsoluteFill style={{backgroundColor: `rgba(${CHARCOAL},${overlay})`}} />
			{/* extra density behind the type block, falling off toward the horizon glow */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 760px 420px at ${BLOCK_CX}px ${BLOCK_CY}px, rgba(${CHARCOAL},0.42), rgba(${CHARCOAL},0) 100%)`,
				}}
			/>
			{/* top + bottom vignettes keep the platform UI zones calm */}
			<AbsoluteFill
				style={{
					background: `linear-gradient(to bottom, rgba(${CHARCOAL},0.55) 0%, rgba(${CHARCOAL},0) 22%, rgba(${CHARCOAL},0) 78%, rgba(${CHARCOAL},0.5) 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

// ---------- type ----------
const Payoff: React.FC<{text: string; fullGreen?: boolean}> = ({text, fullGreen}) => {
	const words = text.split(' ');
	if (fullGreen) {
		const body = text.replace(/\.$/, '');
		return (
			<>
				<span style={{color: GREEN}}>{body}</span>
				{text.endsWith('.') ? '.' : ''}
			</>
		);
	}
	return (
		<>
			{words.map((w, i) => (
				<React.Fragment key={i}>
					{i > 0 ? ' ' : ''}
					{w === '1' ? <span style={{color: GREEN}}>1</span> : w}
				</React.Fragment>
			))}
		</>
	);
};

/** One line inside a clipping mask: rises in from below, exits upward. */
const MaskedLine: React.FC<{
	children: React.ReactNode;
	size: number;
	weight: number;
	inAt: number; // frame
	inDur: number;
	outAt: number | null; // frame the exit finishes (null = hold)
	outDur: number;
	color?: string;
}> = ({children, size, weight, inAt, inDur, outAt, outDur, color = '#F5F2EA'}) => {
	const frame = useCurrentFrame();
	const lineH = size * 1.18;
	const pIn = inDur === 0 ? (frame >= inAt ? 1 : 0) : interpolate(frame, [inAt, inAt + inDur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
	const pOut = outAt === null ? 0 : interpolate(frame, [outAt - outDur, outAt], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const y = (1 - pIn) * lineH * 0.9 - pOut * lineH * 0.9;
	const opacity = Math.min(interpolate(pIn, [0, 0.35], [0, 1], {extrapolateRight: 'clamp'}), 1 - interpolate(pOut, [0.5, 1], [0, 1], {extrapolateLeft: 'clamp'}));
	return (
		<div style={{height: lineH, overflow: 'hidden', paddingInline: 8}}>
			<div
				style={{
					transform: `translateY(${y}px)`,
					opacity,
					fontSize: size,
					fontWeight: weight,
					lineHeight: `${lineH}px`,
					letterSpacing: size >= 90 ? -2.5 : -1,
					color,
					whiteSpace: 'nowrap',
					textShadow: '0 2px 18px rgba(0,0,0,0.45)',
				}}
			>
				{children}
			</div>
		</div>
	);
};

const BeatBlock: React.FC<{beat: Beat; index: number}> = ({beat, index}) => {
	const frame = useCurrentFrame();
	const start = sec(beat.start);
	const end = sec(beat.end);
	const isFirst = index === 0;
	const isLast = index === BEATS.length - 1;
	const OUT = 6; // quick exit, finishing exactly on the beat boundary
	if (frame < start || frame >= end) return null;
	const outAt = isLast ? null : end;
	const lines: React.ReactNode[] = [];
	if (beat.setup) {
		lines.push(
			<MaskedLine key="s" size={SETUP_SIZE} weight={700} inAt={start} inDur={isFirst ? 0 : 9} outAt={outAt} outDur={OUT}>
				{beat.setup}
			</MaskedLine>,
		);
	}
	const payoffIn = start + (beat.payoffDelay ? sec(beat.payoffDelay) : beat.setup && !isFirst ? 3 : 0);
	lines.push(
		<MaskedLine key="p" size={PAYOFF_SIZE} weight={900} inAt={payoffIn} inDur={isFirst ? 0 : beat.payoffDelay ? 12 : 9} outAt={outAt} outDur={OUT}>
			<Payoff text={beat.payoff} fullGreen={beat.fullGreen} />
		</MaskedLine>,
	);
	return (
		<div
			style={{
				position: 'absolute',
				left: BLOCK_CX - BLOCK_W / 2,
				width: BLOCK_W,
				top: BLOCK_CY,
				transform: 'translateY(-50%)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 6,
				textAlign: 'center',
				fontFamily: story.font,
			}}
		>
			{lines}
		</div>
	);
};

export const OneGoodDay: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#050506'}}>
		<Background />
		{BEATS.map((b, i) => (
			<BeatBlock key={b.id} beat={b} index={i} />
		))}
	</AbsoluteFill>
);
