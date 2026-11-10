import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Thermostat} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, wobble} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {AMBER} from './shared';

/**
 * L13 — "you're cooked. In Florida. With no AC." Hard cut to the dead
 * thermostat and dead vent in amber heat. No text, no SFX: the delivery
 * carries the joke. Only a slow push and a little heat shimmer.
 */
export const CookedScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tCooked = cue('L13', 'cooked,');
	const tEnd = cue('L13', undefined, 0, 'end');
	const haze = wobble(frame, 5, 1.6, 1);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm lightX={540} lightY={700} light={1.6} />
			<AbsoluteFill style={{background: 'radial-gradient(1100px 1300px at 540px 760px, rgba(255,150,50,0.32) 0%, rgba(110,50,10,0.22) 55%, rgba(0,0,0,0) 100%)'}} />
			<Camera keys={[{at: 0, zoom: 1.0, y: 780}, {at: tCooked, zoom: 1.05, y: 800, ease: E.soft}, {at: tEnd + 10, zoom: 1.12, y: 820, ease: E.soft}]} handheld={0.8}>
				<div style={{filter: `blur(${Math.abs(haze) * 0.6}px)`, transform: `skewX(${haze * 0.4}deg)`}}>
					<div style={{position: 'absolute', left: 190, top: 300, width: 700, height: 110, borderRadius: 18, background: '#1B1E23', border: '3px solid #2A2E35', overflow: 'hidden'}}>
						{Array.from({length: 7}, (_, i) => (
							<div key={i} style={{position: 'absolute', left: 24, right: 24, top: 14 + i * 13, height: 6, borderRadius: 3, background: '#0B0C0E'}} />
						))}
					</div>
					<Thermostat w={560} power={0} glow={AMBER} style={{left: 540, top: 860}} />
				</div>
			</Camera>
		</AbsoluteFill>
	);
};
