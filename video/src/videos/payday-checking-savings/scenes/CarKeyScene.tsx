import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {CarKey} from '../../../story/components/CarKey';
import {Sfx} from '../../../story/components/Chrome';
import {QuestionBubble} from '../../../story/components/QuestionBubble';
import {useCues} from '../../../story/lib/cues';
import {kf, shake} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {MatteBg, P} from '../look';

/** Hard cut: close-up of a car key swinging; on "breaks down" it jolts and a warning light comes on. */
export const CarKeyScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBreak = cue('F2', 'breaks', -0.04);
	// damped pendulum from the cut, re-kicked on "breaks down"
	const t1 = frame / fps;
	const swing1 = 11 * Math.exp(-t1 * 1.1) * Math.cos(t1 * 4.2);
	const t2 = Math.max(0, (frame - tBreak) / fps);
	const swing2 = frame >= tBreak ? -9 * Math.exp(-t2 * 1.6) * Math.sin(t2 * 7.5) : 0;
	const sh = shake(frame, tBreak, 10, 12);
	const warn = frame >= tBreak ? kf(frame, [tBreak, tBreak + 3], [0, 1]) * (0.75 + 0.25 * Math.cos((frame - tBreak) * 0.45)) : 0;
	const shine = kf(frame, [0, 40], [0.05, 0.75]);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<MatteBg y={660} lift={0.085} />
			<Camera keys={[{at: 0, zoom: 1.0, y: 820}, {at: tBreak + 30, zoom: 1.05, y: 820}]} shakeX={sh.x} shakeY={sh.y}>
				<div style={{position: 'absolute', left: 540 - 190, top: 262}}>
					<CarKey w={380} rot={swing1 + swing2 - 6} shine={shine} />
				</div>
				{/* check-engine style warning light (amber = warning) */}
				<div style={{position: 'absolute', left: 760, top: 530, opacity: warn, transform: `scale(${0.8 + 0.2 * warn})`}}>
					<svg width={150} height={110} viewBox="0 0 150 110" style={{filter: `drop-shadow(0 0 ${18 * warn}px ${P.gold})`}}>
						<path
							d="M28 30 H54 V20 H90 V30 H104 L112 40 H124 V30 H134 V80 H124 V70 H112 L100 88 H46 L34 76 H22 V86 H12 V44 H22 V36 Z"
							fill={P.gold}
						/>
						<circle cx="74" cy="56" r="11" fill="#0A0A0B" />
					</svg>
				</div>
				<QuestionBubble lineId="F2" at={cue('F2', undefined, -0.25)} x={92} y={1110} w={868} fontSize={68} colors={{breaks: P.accentDeep, 'down?': P.accentDeep}} />
			</Camera>
			<Sfx at={1} name="coin" volume={0.25} />
			<Sfx at={tBreak} name="thud" volume={0.45} />
		</AbsoluteFill>
	);
};
