import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {Thermostat} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, kf, shake, sp} from '../../../story/lib/motion';
import {cinematic as C, story} from '../../../story/theme';
import {ANCHOR} from './KeysScene';
import {AMBER, COOL} from './shared';

/**
 * L10 — match cut from the key turn to the thermostat dial clicking.
 * 6 MONTHS LATER → JULY • FLORIDA; the grade warms from cool to amber;
 * the display dies on "goes out" and the silence is held.
 */
export const JulyScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tJuly = cue('L10', 'July,');
	const tOut = cue('L10', 'goes out.');
	const tOutEnd = cue('L10', undefined, 0, 'end');
	const warm = kf(frame, [tJuly - 6, tOut + 4], [0, 1], E.inOut);
	const glow = interpolateColors(warm, [0, 1], [COOL, AMBER]);
	const dial = kf(frame, [0, 14], [58, 0], E.out);
	const power = frame < tOut + 2 ? 1 : kf(frame, [tOut + 2, tOut + 4, tOut + 5, tOut + 8], [1, 0.2, 0.6, 0]);
	const months = sp(frame, fps, 6, 'snappy');
	const july = sp(frame, fps, tJuly - 3, 'bouncy');
	const sh = shake(frame, tOut + 2, 10, 10);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm={false} lightX={ANCHOR.x} lightY={ANCHOR.y} light={1.4} />
			<AbsoluteFill style={{background: `radial-gradient(900px 1100px at 540px 820px, rgba(255,160,60,${0.28 * warm}) 0%, rgba(120,60,10,${0.18 * warm}) 55%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{background: `rgba(255,140,40,${0.07 * warm})`, mixBlendMode: 'screen'}} />
			<Camera keys={[{at: 0, zoom: 1.12, x: ANCHOR.x, y: ANCHOR.y}, {at: tJuly, zoom: 1.0, x: ANCHOR.x, y: ANCHOR.y + 40, ease: E.soft}, {at: tOutEnd + 20, zoom: 1.06, x: ANCHOR.x, y: ANCHOR.y}]} shakeX={sh.x} shakeY={sh.y}>
				<Thermostat w={560} temp={74} power={power} glow={glow} dial={dial} style={{left: ANCHOR.x, top: ANCHOR.y}} />
			</Camera>
			<div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: months * (1 - kf(frame, [tJuly - 6, tJuly], [0, 1]))}}>
				<span style={{fontSize: 34, fontWeight: 900, letterSpacing: 6, color: C.ink, border: `3px solid ${C.ink}`, borderRadius: 14, padding: '10px 22px'}}>6 MONTHS LATER</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center', opacity: july, transform: `translateY(${(1 - july) * 30}px)`}}>
				<span style={{fontSize: 88, fontWeight: 900, letterSpacing: 2, color: AMBER}}>JULY</span>
				<span style={{fontSize: 88, fontWeight: 900, color: C.ink, margin: '0 28px'}}>•</span>
				<span style={{fontSize: 88, fontWeight: 900, letterSpacing: 2, color: C.ink}}>FLORIDA</span>
			</div>
			<Sfx at={1} name="click" volume={0.5} />
			<Sfx at={tOut + 2} name="thud" volume={0.35} />
		</AbsoluteFill>
	);
};
