import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandLogo, Sfx} from '../../../story/components/Chrome';
import {DrawCheck} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, L, R} from '../kit';

/** Exact checklist text (approved). */
const ROWS = [
	'Set aside bills due before payday',
	'Budget for gas + groceries',
	'Move money into savings',
	'Pay card minimums, then target the highest rate',
	'Set a fun-money limit',
];

/**
 * ENDING — the screenshot-worthy checklist, revealed on "Save this" and held
 * steady through the CTA plus ~1 s. One CTA. Everything sits inside the
 * safe area, clear of platform controls.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSave = cue('L16', 'Save');
	const title = sp(frame, fps, tSave - 4, 'snappy');
	const row = (i: number) => sp(frame, fps, tSave + i * 3, 'snappy');
	const cta = sp(frame, fps, tSave + 18, 'snappy');

	return (
		<AbsoluteFill style={{background: C.black, fontFamily: story.font}}>
			<div style={{position: 'absolute', left: L, top: 200, width: R - L, opacity: Math.min(1, title * 2), transform: `translateY(${(1 - title) * 16}px)`}}>
				<div style={{fontSize: 74, fontWeight: 900, color: C.white, lineHeight: 1.02, letterSpacing: -1.5}}>
					<span style={{color: C.green}}>5</span> THINGS TO DO
					<br />
					WHEN YOU GET PAID
				</div>
				<div style={{height: 6, width: 120, background: C.green, borderRadius: 3, marginTop: 30}} />
			</div>

			<div style={{position: 'absolute', left: L, top: 470, width: R - L, display: 'flex', flexDirection: 'column', gap: 48}}>
				{ROWS.map((t, i) => {
					const p = row(i);
					return (
						<div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 26, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -24}px)`}}>
							<DrawCheck size={58} progress={p} style={{marginTop: 2}} />
							<div style={{fontSize: 46, fontWeight: 800, color: C.white, lineHeight: 1.16, letterSpacing: -0.5, maxWidth: R - L - 90}}>{t}</div>
						</div>
					);
				})}
			</div>

			<div
				style={{
					position: 'absolute',
					left: L,
					top: 1185,
					width: R - L,
					height: 108,
					borderRadius: 24,
					background: C.green,
					color: C.black,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 50,
					fontWeight: 900,
					letterSpacing: 2,
					opacity: Math.min(1, cta * 2),
					transform: `scale(${0.92 + 0.08 * cta})`,
				}}
			>
				SAVE FOR NEXT PAYDAY
			</div>

			<div style={{position: 'absolute', left: L, top: 1325, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6}}>
				<BrandLogo ink={C.white} accent={C.green} size={28} />
				<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 3, color: C.grey}}>STACK WITH GIO</div>
			</div>
			<Sfx at={tSave + 18} name="tick" volume={0.2} />
		</AbsoluteFill>
	);
};
