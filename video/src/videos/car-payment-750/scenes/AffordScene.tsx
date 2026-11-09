import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {C, FONT} from '../look';
import {Road} from './Road';

/** The fair beat: the luxury car looks genuinely great on a dusk drive. */
export const AffordScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIf = cue('L12', 'if');
	const tAfford = cue('L12', 'afford');
	const tGo = cue('L12', 'go');

	const head = sp(frame, fps, tIf - 3, 'smooth');
	const mark = kf(frame, [tAfford - 2, tAfford + 12], [0, 1], E.out);
	const go = prog(frame, tGo - 3, 8);
	const bob = Math.sin(frame * 0.5) * 1.2;

	return (
		<AbsoluteFill>
			<Camera keys={[{at: 0, zoom: 1.04, x: 560, y: 1100}, {at: 150, zoom: 1.02, x: 540, y: 1080, ease: E.soft}]} handheld={0.6}>
				<Road frame={frame} mood="dusk" speed={16} />
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${bob}px)`}}>
					<Car id="affordcar" variant="luxury" paint={PAINTS.dusk} x={540} y={1380} w={1040} lights={0.9} beam={0.45} spin={-frame * 22} sheen={0.62 + Math.sin(frame * 0.03) * 0.05} sheenAmt={0.5} reflection={0.12} />
				</div>
			</Camera>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: 'linear-gradient(180deg, rgba(10,12,24,0.55) 0%, rgba(10,12,24,0) 100%)'}} />
			<div
				style={{
					position: 'absolute',
					left: 80,
					right: 80,
					top: 340,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 112,
					lineHeight: 1.02,
					letterSpacing: -3,
					color: C.white,
					opacity: frame < tIf - 3 ? 0 : prog(frame, tIf - 3, 8),
					transform: `translateY(${(1 - head) * 40}px)`,
					textShadow: '0 10px 40px rgba(0,0,0,0.35)',
				}}
			>
				IF YOU CAN{' '}
				<span style={{position: 'relative', display: 'inline-block', color: C.green}}>
					AFFORD
					<span style={{position: 'absolute', left: 0, bottom: -6, height: 8, width: `${mark * 100}%`, borderRadius: 4, background: C.green}} />
				</span>{' '}
				IT.
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 610, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: 12, color: 'rgba(255,255,255,0.85)', opacity: frame < tGo - 3 ? 0 : go}}>
				GO FOR IT.
			</div>
		</AbsoluteFill>
	);
};
