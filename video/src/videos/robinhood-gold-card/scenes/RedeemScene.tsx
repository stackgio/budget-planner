import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {CASHBACK} from '../assets';
import {FACTS, fmt$} from '../facts';

const SHOT_W = 888;
const SHOT_LEFT = 72;
const SHOT_TOP = 300;
const S = SHOT_W / CASHBACK.middle.w;
const SHOT_H = CASHBACK.middle.h * S;

const Pill: React.FC<{p: number; label: string; hot?: number}> = ({p, label, hot = 0}) => (
	<div
		style={{
			padding: '20px 28px',
			borderRadius: 999,
			fontSize: 40,
			fontWeight: 900,
			letterSpacing: -0.5,
			whiteSpace: 'nowrap',
			color: hot > 0.5 ? '#06130B' : P.ink,
			background: hot > 0 ? `rgba(44,212,122,${hot})` : P.paper,
			border: `3px solid ${hot > 0 ? P.accent : P.line}`,
			opacity: Math.min(1, p * 1.5),
			transform: `translateY(${(1 - p) * 30}px) scale(${(0.8 + 0.2 * p) * (1 + 0.06 * hot)})`,
		}}
	>
		{label}
	</div>
);

const Arrow: React.FC<{p: number}> = ({p}) => (
	<svg width={44} height={40} viewBox="0 0 44 40" style={{opacity: p, flex: 'none'}}>
		<path d="M4 20 H36 M24 8 L36 20 L24 32" fill="none" stroke={P.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * REDEMPTION — hard cut to the real Cash back screen (points side · arrow · Robinhood).
 * The screenshot's own 0 points / $0.00 stay untouched; the $10 is a separate,
 * always-labelled EXAMPLE chip that travels from the points side toward Robinhood.
 */
export const RedeemScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTurn = cue('L9', 'turn');
	const tCash = cue('L9', 'cash', 0, 'end');
	const tSend = cue('L9', 'send');
	const tRh = cue('L9', 'robinhood');
	const tL10 = cue('L10');
	const tEtf = cue('L10', 'etfs');
	const tMore = cue('L12', 'etfs');

	const shotIn = kf(frame, [0, 6], [0.96, 1], E.out);

	// EXAMPLE chip: one element, label and amount always together
	const chipIn = sp(frame, fps, tTurn - 2, 'bouncy');
	const chipOut = kf(frame, [tL10 - 6, tL10 + 4], [0, 1], E.in);
	const fly = kf(frame, [tTurn + 6, tCash], [0, 1], E.inOut);
	const [cx, cy] = arc(fly, [350, 960], [682, 960], 80);
	const landed = kf(frame, [tCash - 2, tCash + 6, tCash + 16], [0, 1, 0]);

	const p1 = sp(frame, fps, tSend - 2, 'snappy');
	const p2 = sp(frame, fps, tRh - 2, 'snappy');
	const p3 = sp(frame, fps, tEtf - 2, 'bouncy');
	const hot = Math.max(kf(frame, [tEtf + 4, tEtf + 14], [0, 0.35]), kf(frame, [tMore - 2, tMore + 8], [0, 1]));
	const dimShot = kf(frame, [tL10, tL10 + 12], [0, 1]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={600} light={0.6} warm={false} />
			<div style={{position: 'absolute', left: 0, right: 0, top: story.safe.top + 54, textAlign: 'center', fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>REWARDS TAB</div>
			<div
				style={{
					position: 'absolute',
					left: SHOT_LEFT,
					top: SHOT_TOP,
					width: SHOT_W,
					height: SHOT_H,
					borderRadius: 28,
					border: `2px solid ${P.line}`,
					overflow: 'hidden',
					transform: `scale(${shotIn})`,
					opacity: 1 - 0.4 * dimShot,
				}}
			>
				<ScreenshotCrop src={CASHBACK.src} natural={CASHBACK.natural} region={CASHBACK.middle} w={SHOT_W} />
			</div>

			{chipIn > 0.01 && chipOut < 1 && (
				<div
					style={{
						position: 'absolute',
						left: cx,
						top: cy,
						transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * chipIn) * (1 + 0.06 * landed) * (1 - 0.3 * chipOut)})`,
						opacity: Math.min(1, chipIn * 1.5) * (1 - chipOut),
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						padding: '16px 26px',
						borderRadius: 18,
						background: '#F5F2EA',
						color: '#0B0C0E',
						fontSize: 34,
						fontWeight: 800,
						whiteSpace: 'nowrap',
						boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 0 ${3 + 3 * landed}px ${P.accent}`,
					}}
				>
					<span style={{fontWeight: 900, letterSpacing: 2.5, fontSize: 30}}>EXAMPLE</span>
					<span>•</span>
					<span>
						<b style={{fontWeight: 900}}>{fmt$(FACTS.exampleRedemption.value)}</b> in cash back
					</span>
				</div>
			)}

			<div style={{position: 'absolute', left: 60, right: 60, top: 1170, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12}}>
				<Pill p={p1} label="Cash back" />
				<Arrow p={p2} />
				<Pill p={p2} label="Robinhood" />
				<Arrow p={p3} />
				<Pill p={p3} label="ETFs" hot={hot} />
			</div>
			<Sfx at={tTurn} name="pop" volume={0.28} />
			<Sfx at={tCash + 1} name="coin" volume={0.32} />
			<Sfx at={tEtf + 8} name="click" volume={0.3} />
			<Sfx at={tMore + 8} name="chime" volume={0.22} />
		</AbsoluteFill>
	);
};
