import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx, SfxContext} from '../../../story/components/Chrome';
import {Thermostat} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {kf, mix, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {COOL, fmtUSD} from './shared';

const THERMO = {x: 540, y: 1060, w: 440};

/**
 * L1 — HOOK. Frame 0 already reads "$5,000 AC BILL · EXAMPLE" above a
 * running thermostat. On "boom" the AC dies (hum cuts, display dies, AC OUT);
 * on "five thousand dollars" the camera punches in on the amount.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const {enabled} = React.useContext(SfxContext);
	const tBoom = cue('L1', 'boom');
	const tFive = cue('L1', 'five');
	const alive = frame < tBoom;
	const power = alive ? 1 : kf(frame, [tBoom, tBoom + 2, tBoom + 3, tBoom + 6], [1, 0.15, 0.55, 0]);
	const out = sp(frame, fps, tBoom + 4, 'bouncy');
	const punch = sp(frame, fps, tFive - 2, 'heavy');
	const sh = shake(frame, tBoom, 14, 12);
	const sh2 = shake(frame, tFive + 2, 12, 12);
	const dim = kf(frame, [tFive - 2, tFive + 10], [1, 0.3]);
	// headline: top of frame → punched-in centre
	const hy = mix(430, 740, punch);
	const hs = mix(1, 1.55, punch);
	const wisps = [0, 1, 2, 3, 4];
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm={false} lightX={540} lightY={THERMO.y} light={alive ? 1.3 : 0.55} />
			<AbsoluteFill style={{background: `radial-gradient(700px 700px at 540px ${THERMO.y}px, rgba(143,211,255,${0.12 * power}) 0%, rgba(0,0,0,0) 70%)`}} />
			<div style={{position: 'absolute', inset: 0, opacity: dim, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
				{/* ceiling vent + cool air */}
				<div style={{position: 'absolute', left: 240, top: 680, width: 600, height: 92, borderRadius: 16, background: '#1B1E23', border: '3px solid #2A2E35', overflow: 'hidden'}}>
					{Array.from({length: 6}, (_, i) => (
						<div key={i} style={{position: 'absolute', left: 22, right: 22, top: 12 + i * 12, height: 6, borderRadius: 3, background: '#0B0C0E'}} />
					))}
				</div>
				{wisps.map((i) => {
					const t = ((frame * 0.9 + i * 22) % 60) / 60;
					const o = (alive ? 1 : Math.max(0, 1 - (frame - tBoom) / 5)) * Math.sin(t * Math.PI) * 0.55;
					return <div key={i} style={{position: 'absolute', left: 300 + i * 120, top: 780 + t * 30, width: 7, height: 44, borderRadius: 7, background: `linear-gradient(180deg, rgba(143,211,255,0), rgba(143,211,255,${o}))`}} />;
				})}
				<Thermostat w={THERMO.w} temp={72} power={power} glow={COOL} style={{left: THERMO.x, top: THERMO.y}} />
				{!alive && (
					<div style={{position: 'absolute', left: 0, right: 0, top: THERMO.y + THERMO.w / 2 + 34, textAlign: 'center', opacity: out, transform: `scale(${0.6 + 0.4 * out})`}}>
						<span style={{fontSize: 44, fontWeight: 900, letterSpacing: 4, color: '#fff', background: P.danger, padding: '8px 22px', borderRadius: 12}}>AC OUT</span>
					</div>
				)}
			</div>
			{/* the bill: readable on frame 0, punched in on "five thousand dollars" */}
			<div style={{position: 'absolute', left: 0, right: 0, top: hy, textAlign: 'center', transform: `translate(${sh2.x}px, ${sh2.y}px) translateY(-50%) scale(${hs})`, transformOrigin: '50% 50%'}}>
				<div style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -5, lineHeight: 1, textShadow: '0 16px 50px rgba(0,0,0,0.6)'}}>{fmtUSD(FACTS.acRepair.value)}</div>
				<div style={{marginTop: 18}}>
					<span style={{fontSize: 64, fontWeight: 900, color: P.bg, background: P.accent, padding: '4px 26px', borderRadius: 14, letterSpacing: 3}}>AC BILL</span>
				</div>
				<div style={{marginTop: 16, fontSize: 26, fontWeight: 800, letterSpacing: 6, color: P.muted}}>EXAMPLE</div>
			</div>
			{enabled && (
				<Sequence durationInFrames={Math.max(1, tBoom)} name="ac-hum">
					<Html5Audio src={staticFile('motion/rent-vs-buy/assets/ac-hum.wav')} volume={(f) => 0.45 * interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'})} />
				</Sequence>
			)}
			<Sfx at={tBoom} name="thud" volume={0.45} />
			<Sfx at={tFive - 2} name="whoosh" volume={0.2} />
		</AbsoluteFill>
	);
};
