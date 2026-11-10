import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx, SfxContext} from '../../../story/components/Chrome';
import {Thermostat} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {kf, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {COOL, fmtUSD} from './shared';

/**
 * L1 — second hook. Close-up of a running thermostat with cool air; the AC hum
 * cuts dead on "boom", then "$5,000 / NEW AC" hits on "five thousand dollars".
 * Feel: the gut-drop of a surprise bill.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const {enabled} = React.useContext(SfxContext);
	const tBoom = cue('L1', 'boom');
	const tFive = cue('L1', 'five');
	const tAC = cue('L1', 'new AC.');
	const alive = frame < tBoom;
	const flicker = alive ? 1 : kf(frame, [tBoom, tBoom + 2, tBoom + 3, tBoom + 5], [1, 0.15, 0.5, 0]);
	const hit = sp(frame, fps, tFive, 'heavy');
	const sub = sp(frame, fps, tAC - 4, 'snappy');
	const sh = shake(frame, tBoom, 16, 12);
	const sh2 = shake(frame, tFive, 10, 10);
	const dim = kf(frame, [tFive - 2, tFive + 10], [1, 0.28]);
	// cool air wisps while the AC runs
	const wisps = [0, 1, 2, 3, 4];
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm={false} lightX={540} lightY={760} light={alive ? 1.3 : 0.5} />
			<AbsoluteFill style={{background: `radial-gradient(700px 700px at 540px 760px, rgba(143,211,255,${0.12 * flicker}) 0%, rgba(0,0,0,0) 70%)`}} />
			<Camera keys={[{at: 0, zoom: 1.08, y: 800}, {at: tBoom, zoom: 1.0, y: 820}, {at: tFive + 30, zoom: 0.96, y: 860}]} shakeX={sh.x + sh2.x} shakeY={sh.y + sh2.y}>
				<div style={{opacity: dim}}>
					{wisps.map((i) => {
						const t = ((frame * 0.9 + i * 22) % 110) / 110;
						const o = alive ? Math.sin(t * Math.PI) * 0.5 : Math.max(0, Math.sin(t * Math.PI) * 0.5 * (1 - (frame - tBoom) / 6));
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: 230 + i * 150,
									top: 360 + t * 120,
									width: 8,
									height: 120,
									borderRadius: 8,
									background: `linear-gradient(180deg, rgba(143,211,255,0), rgba(143,211,255,${o}))`,
								}}
							/>
						);
					})}
					{/* ceiling vent */}
					<div style={{position: 'absolute', left: 190, top: 240, width: 700, height: 110, borderRadius: 18, background: '#1B1E23', border: '3px solid #2A2E35', overflow: 'hidden'}}>
						{Array.from({length: 7}, (_, i) => (
							<div key={i} style={{position: 'absolute', left: 24, right: 24, top: 14 + i * 13, height: 6, borderRadius: 3, background: '#0B0C0E'}} />
						))}
					</div>
					<Thermostat w={560} temp={72} power={flicker} glow={COOL} style={{left: 540, top: 820}} />
				</div>
			</Camera>
			{frame >= tFive - 1 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', transform: `scale(${1 + (1 - hit) * 0.6})`, opacity: Math.min(1, hit * 2.5), filter: hit < 0.5 ? `blur(${(0.5 - hit) * 16}px)` : undefined}}>
					<div style={{fontSize: 250, fontWeight: 900, color: P.ink, letterSpacing: -8, lineHeight: 1, textShadow: '0 20px 60px rgba(0,0,0,0.6)'}}>{fmtUSD(FACTS.acRepair.value)}</div>
				</div>
			)}
			<div style={{position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 30}px)`}}>
				<span style={{fontSize: 92, fontWeight: 900, color: P.bg, background: P.accent, padding: '6px 34px', borderRadius: 18, letterSpacing: 4}}>NEW AC</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1100, textAlign: 'center', opacity: interpolate(sub, [0, 1], [0, 0.9]), fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted}}>
				EXAMPLE
			</div>
			{enabled && (
				<Sequence durationInFrames={Math.max(1, tBoom)} name="ac-hum">
					<Html5Audio src={staticFile('motion/rent-vs-buy/assets/ac-hum.wav')} volume={(f) => 0.55 * interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'})} />
				</Sequence>
			)}
			<Sfx at={tBoom} name="thud" volume={0.45} />
			<Sfx at={tFive} name="thud" volume={0.2} />
		</AbsoluteFill>
	);
};
