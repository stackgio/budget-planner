import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {PhoneNotification} from '../../../story/components/PhoneNotification';
import {QuestionBubble} from '../../../story/components/QuestionBubble';
import {useCues} from '../../../story/lib/cues';
import {story} from '../../../story/theme';
import {MatteBg, P} from '../look';

/** HOOK — frame 0: a PAYDAY notification on a phone + the friend's question. Viewer feels: "that's me on payday". */
export const PaydayScene: React.FC = () => {
	const {cue} = useCues();
	// slow push toward the bubble, then hold
	const end = cue('F1', undefined, 0, 'end');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<MatteBg y={700} lift={0.06} />
			<Camera keys={[{at: 0, zoom: 1}, {at: end + 6, zoom: 1.045, x: 540, y: 900}]}>
				{/* phone */}
				<div
					style={{
						position: 'absolute',
						left: 190,
						top: 196,
						width: 700,
						height: 1180,
						borderRadius: 96,
						background: '#050506',
						border: '14px solid #1D1F23',
						boxShadow: '0 0 0 3px #2C2F34, 0 40px 90px rgba(0,0,0,0.7)',
					}}
				>
					<div style={{position: 'absolute', left: 260, top: 26, width: 152, height: 44, borderRadius: 22, background: '#000'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 112, textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 32, fontWeight: 700, letterSpacing: 2}}>
						Friday
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', color: 'rgba(255,255,255,0.92)', fontSize: 150, fontWeight: 800, letterSpacing: -4}}>
						9:41
					</div>
				</div>
				<PhoneNotification at={-18} pulseAt={2} x={222} y={556} w={636} title="PAYDAY" body="Your paycheck just landed." accent={P.accent} />
				<QuestionBubble
					lineId="F1"
					at={-12}
					x={92}
					y={850}
					w={868}
					fontSize={66}
					label="FRIEND"
					colors={{'checking?': P.accentDeep}}
				/>
			</Camera>
			<Sfx at={1} name="chime" volume={0.4} />
		</AbsoluteFill>
	);
};
