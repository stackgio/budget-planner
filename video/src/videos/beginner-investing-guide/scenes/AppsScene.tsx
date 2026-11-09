import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, CW, FONT, L, P, Pill, StepTag} from '../ui';

/**
 * 01 · INVESTING APP — three accurately labelled cards (no logos: official
 * logo files were not supplied). Robinhood lights up on "I personally use".
 */
export const AppsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const apps = [
		{name: 'Fidelity', at: cue('L5', 'Fidelity', -0.1)},
		{name: 'Charles Schwab', at: cue('L5', 'Charles', -0.1)},
		{name: 'Robinhood', at: cue('L5', 'Robinhood', -0.1)},
	];
	const tUse = cue('L6', 'use');
	const tShow = cue('L6', 'show');
	const pick = sp(frame, fps, tUse, 'heavy');
	const exit = kf(frame, [tShow + 6, tShow + 22], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={760} glow={0.8 + pick * 0.6} />
			<StepTag n="01" label="INVESTING APP" at={2} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: L, top: 310, right: 120}}>
				<KineticText text="PICK AN INVESTING APP" at={4} fontSize={92} color={P.ink} colors={{app: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: L, top: 560, width: CW, display: 'flex', flexDirection: 'column', gap: 30}}>
				{apps.map((a, i) => {
					const p = sp(frame, fps, a.at, 'bouncy');
					const me = i === 2;
					const dim = me ? 0 : pick;
					const lift = me ? pick : 0;
					return (
						<div
							key={a.name}
							style={{
								height: 190,
								borderRadius: 34,
								background: me ? `rgba(57,255,20,${0.04 + 0.08 * pick})` : P.paper,
								border: `3px solid ${me ? (pick > 0.05 ? P.accent : P.line) : P.line}`,
								boxShadow: me ? `0 0 ${60 * pick}px rgba(57,255,20,${0.25 * pick})` : 'none',
								display: 'flex',
								alignItems: 'center',
								padding: '0 44px',
								gap: 30,
								opacity: Math.min(1, p * 1.4) * (1 - 0.6 * dim),
								transform: `translateX(${(1 - p) * 160 + (me ? 0 : exit * -40)}px) scale(${1 + 0.04 * lift})`,
							}}
						>
							<div style={{width: 74, height: 74, borderRadius: 22, background: me && pick > 0.5 ? P.accent : 'rgba(255,255,255,0.08)', color: me && pick > 0.5 ? P.bg : P.body, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900}}>
								{i + 1}
							</div>
							<div style={{fontSize: 64, fontWeight: 900, color: P.ink, letterSpacing: -1.5, flex: 1}}>{a.name}</div>
							{me && (
								<div style={{opacity: pick, transform: `scale(${0.6 + 0.4 * pick})`}}>
									<Pill tone="accent" size={24}>
										What I use
									</Pill>
								</div>
							)}
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: L, top: 1240, width: CW, textAlign: 'center', fontSize: 28, fontWeight: 700, color: P.muted, opacity: kf(frame, [apps[2].at + 10, apps[2].at + 24], [0, 1])}}>
				Popular options — compare fees &amp; features yourself
			</div>
			{apps.map((a) => (
				<Sfx key={a.name} at={a.at} name="tick" volume={0.25} />
			))}
			<Sfx at={tUse} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
