import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {CreditCard} from '../../../story/components/CreditCard';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {C, CheckBox, Label, Stage, StepHeading} from '../ui';

const CW = 380;
const CH = CW * 0.63;
const ROWS = [590, 950];
const RX = 500; // right column

const MinChip: React.FC<{at: number; top: number; inP: number}> = ({at, top, inP}) => (
	<div style={{position: 'absolute', left: RX, top, display: 'flex', alignItems: 'center', gap: 20, opacity: inP, transform: `translateX(${(1 - inP) * 30}px)`}}>
		<CheckBox size={60} at={at} />
		<Label size={38} color={C.white} style={{fontWeight: 900, letterSpacing: 2}}>
			MINIMUM
		</Label>
	</div>
);

/**
 * STEP 4 — minimums on every card (two checks, one after the other), then a
 * single EXTRA PAYMENT marker lands on the HIGHEST INTEREST RATE card and the
 * headline becomes "EXTRA → HIGHEST INTEREST RATE". Both minimum checks stay.
 */
export const DebtScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCredit = cue('L11', 'credit');
	const tMinA = cue('L11', 'minimum', 0.1);
	const tMinB = cue('L11', 'every', 0.15);
	const tExtra = cue('L12', 'extra');
	const launch = tExtra + 5;
	const land = launch + 26;

	const cardIn = [sp(frame, fps, -10, 'snappy'), sp(frame, fps, -6, 'snappy')];
	const chipIn = [sp(frame, fps, tMinA - 8, 'snappy'), sp(frame, fps, tMinA - 4, 'snappy')];
	const tagIn = sp(frame, fps, tCredit + 6, 'snappy');
	const mk = sp(frame, fps, tExtra - 2, 'bouncy');
	const fly = prog(frame, launch, 26, E.inOut);
	const landed = sp(frame, fps, land, 'snappy');
	const others = kf(frame, [land, land + 10], [1, 0.55]);

	const [mx, my] = arc(fly, [740, 868], [72 + CW / 2, ROWS[1] + CH + 4], 110);

	const ring = (i: number, hi: number) => (
		<div
			style={{
				position: 'absolute',
				left: 72 - 8,
				top: ROWS[i] - 8,
				width: CW + 16,
				height: CH + 16,
				borderRadius: 30,
				boxSizing: 'border-box',
				border: `${hi > 0.02 ? 5 : 3}px solid ${hi > 0.02 ? `rgba(44,212,122,${hi})` : '#3A3F47'}`,
				opacity: cardIn[i],
			}}
		/>
	);

	return (
		<Stage>
			<StepHeading n={4} text="MINIMUMS FIRST" at={-12} swap={{text: 'EXTRA → HIGHEST INTEREST RATE', at: land}} />

			{[0, 1].map((i) => (
				<React.Fragment key={i}>
					<div style={{opacity: i === 0 ? others : 1}}>
						{ring(i, i === 1 ? landed : 0)}
						<CreditCard
							w={CW}
							variant="debt"
							issuer={i === 0 ? 'CARD A' : 'CARD B'}
							holder=""
							last4="••••"
							style={{left: 72, top: ROWS[i], opacity: cardIn[i], transform: `translateX(${(1 - cardIn[i]) * -60}px)`}}
						/>
					</div>
					<div>
						<MinChip at={i === 0 ? tMinA : tMinB} top={ROWS[i] + (i === 0 ? 88 : 150)} inP={chipIn[i]} />
					</div>
				</React.Fragment>
			))}

			{/* label on card B */}
			<div
				style={{
					position: 'absolute',
					left: RX,
					top: ROWS[1] + 20,
					padding: '12px 18px',
					borderRadius: 12,
					border: `3px solid ${landed > 0.02 ? C.white : '#4A4F57'}`,
					background: landed > 0.02 ? C.white : 'transparent',
					opacity: tagIn,
					transform: `scale(${1 + 0.06 * Math.sin(Math.min(1, landed) * Math.PI)})`,
					transformOrigin: '0 50%',
				}}
			>
				<Label size={28} color={landed > 0.02 ? '#0B0C0E' : C.soft} style={{fontWeight: 900, letterSpacing: 2.5}}>
					HIGHEST INTEREST RATE
				</Label>
			</div>

			{/* single EXTRA PAYMENT marker */}
			{mk > 0.001 && (
				<div
					style={{
						position: 'absolute',
						left: mx,
						top: my,
						transform: `translate(-50%, -50%) scale(${mk * (1 + 0.08 * Math.sin(Math.min(1, landed) * Math.PI))}) rotate(${(1 - fly) * 4 * (fly > 0 ? 1 : 0)}deg)`,
						background: C.green,
						color: '#0B0C0E',
						borderRadius: 18,
						padding: '16px 26px',
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
						whiteSpace: 'nowrap',
					}}
				>
					<svg width={30} height={30} viewBox="0 0 24 24">
						<path d="M12 4v16M4 12h16" stroke="#0B0C0E" strokeWidth={3.6} strokeLinecap="round" />
					</svg>
					<span style={{fontSize: 32, fontWeight: 900, letterSpacing: 2}}>EXTRA PAYMENT</span>
				</div>
			)}

			<Sfx at={land} name="card" volume={0.22} />
		</Stage>
	);
};
