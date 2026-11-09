import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {C, FONT, Label, StudioBg} from '../look';
import {Road} from './Road';

const PROMPTS = ['$300?', '$500?', '$750+?'];

/** Split-screen debate: luxury in the studio vs. the everyday sedan in daylight. */
export const AskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCurious = cue('L15', 'curious');
	const tMost = cue('L15', 'most');

	const push = kf(frame, [0, 130], [1, 1.06], E.soft);
	const head = sp(frame, fps, tCurious - 4, 'smooth');
	const split = sp(frame, fps, 0, 'smooth');
	const TOP_H = 600;
	const BAND = [600, 1110];

	return (
		<AbsoluteFill style={{background: C.black}}>
			{/* top: luxury */}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: TOP_H, overflow: 'hidden', transform: `translateX(${(1 - split) * -80}px)`}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 460px'}}>
					<StudioBg floorY={560} />
					<Car id="askLux" variant="luxury" paint={PAINTS.gunmetal} x={540} y={560} w={860} lights={1} beam={0.5} sheen={kf(frame, [0, 90], [-0.2, 1.2])} sheenAmt={0.55} reflection={0.2} />
				</div>
			</div>
			{/* bottom: everyday sedan */}
			<div style={{position: 'absolute', left: 0, top: BAND[1], width: 1080, height: 1920 - BAND[1], overflow: 'hidden', transform: `translateX(${(1 - split) * 80}px)`}}>
				<div style={{position: 'absolute', left: 0, top: -760, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 950px'}}>
					<Road frame={frame + 400} mood="day" speed={0} horizon={900} />
					<Car id="askSedan" variant="sedan" paint={PAINTS.pearl} x={540} y={1040} w={780} lights={0.1} sheen={0.55} sheenAmt={0.45} reflection={0.05} rim={0.6} />
				</div>
			</div>
			{/* the question */}
			<div style={{position: 'absolute', left: 0, right: 0, top: BAND[0], height: BAND[1] - BAND[0], background: C.black, borderTop: '2px solid rgba(255,255,255,0.08)', borderBottom: '2px solid rgba(255,255,255,0.08)'}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', opacity: prog(frame, 2, 10)}}>
					<Label size={26} color={C.gray}>Luxury vs. everyday</Label>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 60,
						right: 60,
						top: 96,
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: 900,
						fontSize: 100,
						lineHeight: 1,
						letterSpacing: -3,
						color: C.white,
						opacity: frame < tCurious - 4 ? 0 : prog(frame, tCurious - 4, 8),
						transform: `translateY(${(1 - head) * 30}px)`,
					}}
				>
					WHAT&rsquo;S YOUR CAR PAYMENT <span style={{color: C.green}}>LIMIT?</span>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 336, display: 'flex', justifyContent: 'center', gap: 26}}>
					{PROMPTS.map((p, i) => {
						const at = tMost - 4 + i * 5;
						const s = sp(frame, fps, at, 'bouncy');
						return (
							<div
								key={p}
								style={{
									padding: '18px 34px',
									borderRadius: 999,
									background: i === 2 ? 'rgba(255,90,78,0.14)' : 'rgba(255,255,255,0.08)',
									border: `3px solid ${i === 2 ? 'rgba(255,90,78,0.7)' : 'rgba(255,255,255,0.28)'}`,
									fontFamily: FONT,
									fontWeight: 900,
									fontSize: 60,
									color: i === 2 ? C.red : C.white,
									opacity: frame < at ? 0 : prog(frame, at, 5),
									transform: `translateY(${(1 - s) * 30}px) scale(${0.85 + 0.15 * s})`,
								}}
							>
								{p}
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
