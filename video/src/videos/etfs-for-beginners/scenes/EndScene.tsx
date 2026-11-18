import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug} from '../../../story/components/Chrome';
import {mixColor} from '../../../story/components/FundCards';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {C, FONT} from './common';

export const RECAP: [string, string][] = [
	['VOO', 'Large U.S. companies'],
	['VTI', 'Broad U.S. market'],
	['VT', 'U.S. + international'],
	['VXUS', 'Outside the U.S.'],
	['SCHD', 'U.S. dividend stocks'],
];

/**
 * ENDING — the five-fund cheat sheet + disclaimer are on screen for the whole
 * closing narration. The disclaimer lights up on its line, "Save this" on the CTA,
 * and the card holds ~2 s after the last word (TAIL_SEC).
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEdu = cue('L23', 'education', -0.1);
	const tAdvice = cue('L23', 'advice', 0, 'end');
	const tSave = cue('L24', 'Save', -0.05);
	const title = sp(frame, fps, 2, 'snappy');
	const disc = kf(frame, [tEdu - 4, tEdu + 6, tAdvice + 6, tAdvice + 20], [0, 1, 1, 0.35], E.out);
	const save = kf(frame, [tSave - 2, tSave + 6, tSave + 26], [0, 1, 0.55], E.out);
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={760} />
			<div style={{position: 'absolute', left: 120, right: 120, top: 186, opacity: title, transform: `translateY(${(1 - title) * 24}px)`}}>
				<div style={{fontSize: 74, fontWeight: 900, letterSpacing: -2, lineHeight: 1.04, color: C.ink}}>
					<span style={{color: mixColor(C.accent, '#7DFFB4', save)}}>Save this</span> for
					<br />
					your first ETF
				</div>
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 400, display: 'flex', flexDirection: 'column', gap: 16}}>
				{RECAP.map(([t, d], i) => {
					const e = sp(frame, fps, 1 + i * 2, 'snappy');
					return (
						<div
							key={t}
							style={{
								display: 'flex',
								alignItems: 'center',
								height: 134,
								padding: '0 32px',
								borderRadius: 26,
								background: '#1B1E23',
								border: `2px solid ${C.line}`,
								opacity: e,
								transform: `translateX(${(1 - e) * -60}px)`,
							}}
						>
							<div style={{width: 230, fontSize: 72, fontWeight: 900, letterSpacing: -2, color: C.accent}}>{t}</div>
							<div style={{fontSize: 42, fontWeight: 800, color: C.ink, letterSpacing: -0.5}}>{d}</div>
						</div>
					);
				})}
			</div>
			{/* disclaimer: on screen with the cheat sheet, emphasised while it is spoken */}
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: 1194,
					padding: '18px 24px',
					borderRadius: 22,
					textAlign: 'center',
					fontSize: 40,
					fontWeight: 800,
					lineHeight: 1.18,
					color: mixColor(C.body, C.ink, disc),
					background: `rgba(44,212,122,${0.1 * disc})`,
					border: `2px solid ${mixColor('#2A2E35', C.accent, disc)}`,
					opacity: title,
				}}
			>
				For education only.
				<br />
				<span style={{color: mixColor(C.body, C.accent, disc)}}>Not financial advice.</span>
			</div>
			<BrandBug palette={C} opacity={0.55 * title} style={{left: 120, top: 1352, transform: 'scale(0.8)', transformOrigin: '0 50%'}} />
		</AbsoluteFill>
	);
};
