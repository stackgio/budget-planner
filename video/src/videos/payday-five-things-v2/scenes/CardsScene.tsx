import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, DrawCheck, deskShadow, PenPath} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, G, StepHeader} from '../kit';

const CW = 560;
const CH = 350;
// different positions on the desk
const A = {x: 80, y: 380, rot: -4, label: 'LOWER RATE'};
const B = {x: 300, y: 830, rot: 3, label: 'HIGHEST INTEREST RATE'};

/** Generic card: matte, no issuer, no number. */
const PlainCard: React.FC<{x: number; y: number; rot: number; tone: string; label: string; strong: number; children?: React.ReactNode}> = ({x, y, rot, tone, label, strong, children}) => (
	<div style={{position: 'absolute', left: x, top: y, width: CW, height: CH, transform: `rotate(${rot}deg)`}}>
		<div style={{position: 'absolute', inset: 0, borderRadius: 30, background: tone, boxShadow: deskShadow(0)}}>
			<div style={{position: 'absolute', left: 44, top: 120, width: 78, height: 58, borderRadius: 10, background: 'linear-gradient(135deg,#BFB9A8,#8E897B)'}} />
			<div style={{position: 'absolute', left: 44, bottom: 50, display: 'flex', gap: 22}}>
				{[0, 1, 2, 3].map((g) => (
					<div key={g} style={{display: 'flex', gap: 6}}>
						{[0, 1, 2, 3].map((d) => (
							<div key={d} style={{width: 11, height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.35)'}} />
						))}
					</div>
				))}
			</div>
		</div>
		{/* rate label */}
		<div
			style={{
				position: 'absolute',
				left: 30,
				top: -30,
				background: strong > 0.5 ? C.green : C.white,
				color: C.black,
				fontSize: 30,
				fontWeight: 900,
				letterSpacing: 2.5,
				padding: '10px 18px',
				borderRadius: 12,
				boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</div>
		{children}
	</div>
);

const MinPaid: React.FC<{p: number}> = ({p}) => (
	<div
		style={{
			position: 'absolute',
			right: -24,
			bottom: 34,
			display: 'flex',
			alignItems: 'center',
			gap: 12,
			background: C.black,
			color: C.white,
			padding: '12px 20px 12px 14px',
			borderRadius: 16,
			fontSize: 28,
			fontWeight: 900,
			letterSpacing: 2,
			opacity: Math.min(1, p * 2),
			transform: `scale(${0.7 + 0.3 * Math.min(1, p)})`,
			boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
			whiteSpace: 'nowrap',
		}}
	>
		<DrawCheck size={40} progress={p} />
		MINIMUM PAID
	</div>
);

/**
 * 4 · CREDIT CARDS — payment order, in two reveals.
 * Reveal 1: MINIMUM PAID checks on both cards (and they stay).
 * Reveal 2: header flips to EXTRA → HIGHEST INTEREST RATE and one EXTRA
 * PAYMENT marker travels to the card labelled HIGHEST INTEREST RATE.
 */
export const CardsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFour = cue('L11', 'Four');
	const tMin = cue('L11', 'minimum');
	const tEvery = cue('L11', 'every');
	const tThen = cue('L12', 'Then');
	const tExtra = cue('L12', 'extra');
	const tToward = cue('L12', 'toward');
	const tMost = cue('L13', 'most');

	const cardsIn = kf(frame, [0, 10], [0, 1], E.out);
	const minA = kf(frame, [tMin, tMin + 14], [0, 1], E.out);
	const minB = kf(frame, [tEvery, tEvery + 14], [0, 1], E.out);
	const extra = sp(frame, fps, tExtra - 2, 'bouncy');
	const travel = kf(frame, [tToward, tToward + 26], [0, 1], E.inOut);
	const docked = sp(frame, fps, tToward + 24, 'bouncy');
	const underline = kf(frame, [tMost, tMost + 12], [0, 1], E.out);

	const from: [number, number] = [700, 640];
	const to: [number, number] = [B.x + 300, B.y + 150];
	const [mx, my] = arc(travel, from, to, 80);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />
			<div style={{position: 'absolute', inset: 0, opacity: cardsIn, transform: `translateY(${(1 - cardsIn) * 12}px)`}}>
				<PlainCard {...A} tone="linear-gradient(150deg,#3B4048,#262A30)" strong={0}>
					<MinPaid p={minA} />
				</PlainCard>
				<PlainCard {...B} tone="linear-gradient(150deg,#2E3238,#17191D)" strong={docked}>
					<MinPaid p={minB} />
					{/* "the one charging you the most" */}
					<PenPath d="M 34 34 C 160 44, 330 26, 420 36" progress={underline} color={C.green} stroke={7} />
				</PlainCard>
			</div>

			{/* the single EXTRA PAYMENT marker */}
			{extra > 0.01 && (
				<div
					style={{
						position: 'absolute',
						left: mx,
						top: my,
						transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * extra) * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, docked)))}) rotate(${travel * B.rot}deg)`,
						opacity: Math.min(1, extra * 2),
						background: C.green,
						color: C.black,
						fontSize: 38,
						fontWeight: 900,
						letterSpacing: 2,
						padding: '16px 26px',
						borderRadius: 18,
						boxShadow: travel > 0 && travel < 1 ? '14px 26px 34px rgba(0,0,0,0.35)' : '0 10px 24px rgba(0,0,0,0.3)',
						whiteSpace: 'nowrap',
					}}
				>
					+ EXTRA PAYMENT
				</div>
			)}

			<StepHeader
				n={4}
				text={
					<>
						MINIMUMS <G>FIRST</G>
					</>
				}
				at={tFour}
				swap={
					<>
						EXTRA <G>→</G> HIGHEST
						<br />
						INTEREST RATE
					</>
				}
				swapAt={tThen}
			/>
			<Sfx at={tMin + 2} name="tick" volume={0.25} />
			<Sfx at={tEvery + 2} name="tick" volume={0.25} />
			<Sfx at={tToward + 24} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
