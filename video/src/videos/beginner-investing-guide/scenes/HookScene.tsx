import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {recView, ScreenRecording} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, FONT, L, Label, P, REC, REC_MASKS, REC_ROI, useIn} from '../ui';

/**
 * HOOK — frame 0: the real Robinhood order screen with "$10" and the promise.
 * Second hook (~2.8 s): the 4-step roadmap the video will walk through.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tZero = cue('L1', 'zero');
	const tExact = cue('L1', 'exactly');
	const W = 900;
	const H = 760;
	const view = recView(frame, [
		{at: 0, v: {x: 20, y: 520, w: 1166, h: 985}},
		{at: tZero + 10, v: {x: 20, y: 520, w: 1166, h: 985}},
		{at: tExact, v: {x: 30, y: 640, w: 1140, h: 963}},
	]);
	const mark = 0.55 + 0.45 * kf(frame, [tZero - 4, tZero + 10], [0, 1], E.out);
	const pulse = sp(frame, fps, tZero, 'bouncy');
	const steps = ['App', 'Account', 'ETF', 'Buy'];
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={300} />
			{/* headline — readable on frame 0 */}
			<div style={{position: 'absolute', left: L, top: 178, right: 120}}>
				<div style={{fontSize: 92, fontWeight: 900, color: P.ink, letterSpacing: -2.5, lineHeight: 1}}>START INVESTING</div>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 6}}>
					<div style={{fontSize: 92, fontWeight: 900, color: P.ink, letterSpacing: -2.5}}>FROM</div>
					<div style={{fontSize: 168, fontWeight: 900, color: P.accent, letterSpacing: -6, lineHeight: 1, transform: `scale(${1 + 0.06 * Math.sin(Math.min(1, pulse) * Math.PI)})`, transformOrigin: '0% 70%'}}>$10</div>
				</div>
			</div>
			{/* the real order screen */}
			<div style={{position: 'absolute', left: (1080 - W) / 2, top: 520, width: W, height: H, borderRadius: 38, boxShadow: `0 0 0 2px ${P.line}, 0 40px 80px rgba(0,0,0,0.7)`}}>
				<ScreenRecording
					dir={REC.dir}
					count={REC.count}
					index={REC.at.sharesTyped}
					natural={REC.natural}
					w={W}
					h={H}
					view={view}
					masks={REC_MASKS}
					marks={[{rect: REC_ROI.estCost, p: mark, color: P.accent}]}
					radius={38}
				/>
				<div style={{position: 'absolute', right: 6, top: -44, ...inn(-20)}}>
					<Label color={P.muted} size={24}>
						<span style={{color: P.danger}}>●</span> My real Robinhood order
					</Label>
				</div>
			</div>
			{/* second hook: the roadmap */}
			<div style={{position: 'absolute', left: L, right: 120, top: 1300, display: 'flex', gap: 14, flexWrap: 'nowrap'}}>
				{steps.map((s, i) => {
					const p = sp(frame, fps, tExact + i * 4, 'bouncy');
					return (
						<div
							key={s}
							style={{
								flex: 1,
								height: 70,
								borderRadius: 18,
								background: i === 0 ? P.accent : 'rgba(255,255,255,0.06)',
								border: `2px solid ${i === 0 ? P.accent : 'rgba(255,255,255,0.14)'}`,
								color: i === 0 ? P.bg : P.ink,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
								fontSize: 26,
								fontWeight: 900,
								letterSpacing: 1.5,
								textTransform: 'uppercase',
								opacity: Math.min(1, p * 1.5),
								transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
							}}
						>
							<span style={{opacity: 0.6}}>{i + 1}</span>
							{s}
						</div>
					);
				})}
			</div>
			<Sfx at={tZero} name="pop" volume={0.3} />
			<Sfx at={tExact} name="whoosh-soft" volume={0.25} />
		</AbsoluteFill>
	);
};
