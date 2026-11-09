import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, FONT, Label} from '../look';

/** Warm daylight arrives: $13,800 splits into two halves — what if you kept one? */
export const SunBg: React.FC<{sun?: number}> = ({sun = 1}) => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F3 60%, #E9E9E6 100%)'}}>
		<div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 88% 8%, rgba(57,255,136,${0.10 * sun}) 0%, rgba(57,255,136,0) 45%)`}} />
		<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 40% at 50% 100%, rgba(0,0,0,${0.04 * sun}) 0%, rgba(0,0,0,0) 70%)`}} />
	</AbsoluteFill>
);

export const HalfScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHalf = cue('L9', 'half');
	const tMoney = cue('L9', 'money');

	const sun = kf(frame, [0, 40], [0.2, 1], E.out);
	const intro = sp(frame, fps, 4, 'smooth');
	const split = sp(frame, fps, tHalf - 3, 'smooth');
	const roll = kf(frame, [tHalf - 2, tHalf + 18], [0, 1], E.out);
	const value = mix(FACTS.yearly.value, FACTS.half.value, roll);
	const gap = 34 * split;
	const barW = 900;

	return (
		<AbsoluteFill>
			<SunBg sun={sun} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', opacity: intro}}>
				<Label size={30} color="#5A5F66">Your example year</Label>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 420,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: mix(170, 110, split),
					letterSpacing: -4,
					color: mix(0, 1, split) > 0.5 ? '#8A8F96' : C.ink,
					transform: `translateY(${(1 - intro) * 30}px)`,
				}}
			>
				${FACTS.yearly.value.toLocaleString('en-US')}
				<span style={{fontSize: '0.36em', letterSpacing: 6, color: '#8A8F96'}}> / YEAR</span>
			</div>
			{/* the split bar */}
			<div style={{position: 'absolute', left: (1080 - barW) / 2, top: 700, width: barW, height: 64, display: 'flex', gap}}>
				<div style={{flex: 1, borderRadius: 32, background: mix(0, 1, split) > 0.5 ? 'rgba(16,16,16,0.12)' : '#1E1E1E', transition: 'none'}} />
				<div style={{flex: 1, borderRadius: 32, background: split > 0.5 ? C.greenDeep : '#1E1E1E', boxShadow: split > 0.5 ? `0 12px 40px rgba(20,184,90,${0.35 * split})` : 'none', transform: `translateY(${-14 * split}px)`}} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center', opacity: frame < tHalf - 3 ? 0 : prog(frame, tHalf - 3, 6)}}>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, letterSpacing: 10, color: C.ink}}>HALF =</div>
				<div style={{display: 'flex', justifyContent: 'center', marginTop: 6}}>
					<NumberCounter value={value} fontSize={240} color={C.greenDeep} style={{letterSpacing: -6, fontFamily: FONT}} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1140, textAlign: 'center', opacity: frame < tMoney - 4 ? 0 : prog(frame, tMoney - 4, 10)}}>
				<ExampleTag dark={false} text="Hypothetical · not guaranteed savings" />
			</div>
		</AbsoluteFill>
	);
};
