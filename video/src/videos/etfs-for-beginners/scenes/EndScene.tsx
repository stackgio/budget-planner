import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {C, FONT} from './common';

export const RECAP: [string, string][] = [
	['VOO', 'Large U.S. companies'],
	['VTI', 'Broad U.S. market'],
	['VT', 'U.S. + international'],
	['VXUS', 'Outside the U.S.'],
	['SCHD', 'U.S. dividend stocks'],
];

/** ENDING — disclaimer on its own line, then "Save this" + the five-fund recap (held long enough to read). */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEdu = cue('L23', 'education', -0.2);
	const tSave = cue('L24', 'Save', -0.1);
	const dIn = sp(frame, fps, tEdu, 'snappy');
	const toFooter = kf(frame, [tSave - 2, tSave + 14], [0, 1], E.inOut);
	const title = sp(frame, fps, tSave, 'snappy');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={760} />
			{/* disclaimer: big with its voice line, then docks as a footer */}
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: mix(720, 1268, toFooter),
					textAlign: 'center',
					fontSize: mix(78, 30, toFooter),
					fontWeight: mix(900, 800, toFooter),
					letterSpacing: mix(-2, 0.5, toFooter),
					lineHeight: 1.1,
					color: toFooter > 0.5 ? C.muted : C.ink,
					opacity: dIn,
					transform: `translateY(${(1 - dIn) * 30}px)`,
				}}
			>
				For education only.{toFooter > 0.5 ? ' ' : <br />}
				<span style={{color: toFooter > 0.5 ? C.muted : C.accent}}>Not financial advice.</span>
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 200, opacity: title, transform: `translateY(${(1 - title) * 30}px)`}}>
				<div style={{fontSize: 74, fontWeight: 900, letterSpacing: -2, lineHeight: 1.04, color: C.ink}}>
					<span style={{color: C.accent}}>Save this</span> for your first ETF
				</div>
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 430, display: 'flex', flexDirection: 'column', gap: 18}}>
				{RECAP.map(([t, d], i) => {
					const e = sp(frame, fps, tSave + 6 + i * 4, 'snappy');
					return (
						<div
							key={t}
							style={{
								display: 'flex',
								alignItems: 'center',
								height: 136,
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
			<BrandBug palette={C} opacity={0.6 * prog(frame, tSave + 30, 15)} style={{left: 120, top: 1330}} />
		</AbsoluteFill>
	);
};
