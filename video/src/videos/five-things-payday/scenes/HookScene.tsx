import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {C, ChecklistRow, L, Label, Stage} from '../ui';

export const ROWS = {top: 446, step: 156, h: 130};
export const ROW1_LABEL = 'Bills due before payday';

/** Branded deposit card (no amount, no account details). */
export const DepositCard: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<div
		style={{
			position: 'absolute',
			width: 860,
			height: 270,
			borderRadius: 34,
			background: 'linear-gradient(160deg, #1D2026 0%, #14161A 100%)',
			border: '3px solid #2A2E35',
			boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
			boxSizing: 'border-box',
			padding: '0 40px',
			display: 'flex',
			alignItems: 'center',
			gap: 34,
			...style,
		}}
	>
		<div style={{width: 120, height: 120, borderRadius: 60, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
			<svg width={64} height={64} viewBox="0 0 24 24">
				<path d="M12 4v13M6 11.5l6 6 6-6M5 21h14" fill="none" stroke="#0B0C0E" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
		<div>
			<div style={{fontSize: 50, fontWeight: 900, color: C.white, letterSpacing: -1, lineHeight: 1}}>PAYCHECK</div>
			<div style={{fontSize: 50, fontWeight: 900, color: C.white, letterSpacing: -1, lineHeight: 1.08}}>DEPOSITED</div>
			<Label size={26} color={C.muted} style={{marginTop: 14}}>
				DIRECT DEPOSIT · TODAY
			</Label>
		</div>
	</div>
);

/**
 * HOOK — "Just got paid? Do these five things before that money starts disappearing."
 * Frame 0: headline readable, deposit card already sliding in. On "before" the
 * card shrinks into a chip and the five checklist rows rise; row 1 takes focus.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBefore = cue('L2', 'before');
	const tGone = cue('L2', 'disappearing');

	// deposit card: in motion on frame 0, settles ~0.5 s
	const slideIn = kf(frame, [-9, 15], [0, 1], E.out);
	const shrink = sp(frame, fps, tBefore, 'smooth');
	const cardX = mix(110 + (1 - slideIn) * 760, L.left, shrink);
	const cardY = mix(800, 252, shrink);
	const cardS = mix(1, 0.5, shrink);
	const cardR = (1 - slideIn) * 5;

	const headOut = kf(frame, [tBefore - 2, tBefore + 10], [0, 1], E.in);
	const headSettle = kf(frame, [0, 14], [1.025, 1], E.out);

	const focus = sp(frame, fps, tGone, 'smooth');

	return (
		<Stage lightY={760}>
			{/* headline — readable on frame 0 */}
			<div
				style={{
					position: 'absolute',
					left: L.left,
					top: 300,
					opacity: 1 - headOut,
					transform: `translateY(${-headOut * 60}px) scale(${headSettle})`,
					transformOrigin: '0 0',
				}}
			>
				<div style={{display: 'flex', alignItems: 'flex-end', gap: 26}}>
					<div style={{fontSize: 290, fontWeight: 900, color: C.green, lineHeight: 0.8, letterSpacing: -10}}>5</div>
					<div style={{fontSize: 86, fontWeight: 900, color: C.white, lineHeight: 0.92, letterSpacing: -2, paddingBottom: 4}}>THINGS TO DO</div>
				</div>
				<div style={{fontSize: 86, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: -2, marginTop: 20}}>WHEN YOU GET PAID</div>
			</div>

			{/* checklist rows rise as the card shrinks */}
			{[0, 1, 2, 3, 4].map((i) => {
				const p = sp(frame, fps, tBefore + 5 + i * 4, 'snappy');
				if (p <= 0.001) return null;
				return (
					<ChecklistRow
						key={i}
						n={i + 1}
						label={i === 0 ? ROW1_LABEL : undefined}
						placeholderW={[0, 380, 300, 420, 340][i]}
						focus={i === 0 ? focus : 0}
						dim={i === 0 ? 0 : focus}
						h={ROWS.h}
						style={{
							left: L.left,
							top: ROWS.top + i * ROWS.step,
							opacity: Math.min(1, p * 1.3) * (i === 0 ? 1 : 1 - focus * 0.55),
							transform: `translateY(${(1 - p) * 70}px) scale(${i === 0 ? 1 + 0.025 * focus : 1})`,
						}}
					/>
				);
			})}

			<DepositCard style={{left: cardX, top: cardY, transform: `scale(${cardS}) rotate(${cardR}deg)`, transformOrigin: '0 0'}} />

			<Sfx at={3} name="cash" volume={0.28} />
		</Stage>
	);
};
