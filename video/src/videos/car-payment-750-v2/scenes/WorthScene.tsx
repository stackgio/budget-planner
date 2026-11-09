import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {C, ExampleTag, FONT, Label, StudioBg} from '../look';

/** Illustrative shares of a paycheck bar — no amounts, no real paycheck. */
const SEGS = [
	{label: 'CAR PAYMENT', w: 0.4, word: 'nice'},
	{label: 'INSURANCE', w: 0.12, word: 'if'},
	{label: 'GAS', w: 0.12, word: 'stressed'},
];

export const WorthScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tQ = cue('L14', 'money', -0.1);
	const tEvery = cue('L14', 'every');

	const card = sp(frame, fps, 4, 'smooth');
	const q = sp(frame, fps, tQ, 'heavy');
	const W = 880;
	let used = 0;
	const segs = SEGS.map((s) => {
		const at = cue('L14', s.word) - 2;
		const p = kf(frame, [at, at + 12], [0, 1], E.out);
		const left = used;
		used += s.w * p;
		return {...s, at, p, left};
	});
	const loop = prog(frame, tEvery - 2, 8);

	return (
		<AbsoluteFill>
			<StudioBg floorY={790} light={0.55} box={0.5} />
			<div style={{position: 'absolute', inset: 0, opacity: 0.85}}>
				<Car id="worthcar" variant="luxury" paint={PAINTS.gunmetal} x={540} y={790} w={700} lights={0.15} rim={0.5} sheen={kf(frame, [0, 120], [0.1, 0.5])} sheenAmt={0.25} reflection={0.18} />
			</div>
			{/* IS IT WORTH IT? */}
			<div
				style={{
					position: 'absolute',
					left: 60,
					right: 60,
					top: 230,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 132,
					letterSpacing: -4,
					lineHeight: 1,
					color: C.white,
					opacity: frame < tQ ? 0 : prog(frame, tQ, 4),
					transform: `scale(${1.3 - 0.3 * q})`,
					textShadow: '0 20px 60px rgba(0,0,0,0.6)',
				}}
			>
				IS IT
				<br />
				<span style={{color: C.green}}>WORTH</span> IT?
			</div>
			{/* paycheck card */}
			<div
				style={{
					position: 'absolute',
					left: 70,
					right: 70,
					top: 830,
					height: 400,
					borderRadius: 34,
					background: 'rgba(255,255,255,0.05)',
					border: '2px solid rgba(255,255,255,0.10)',
					opacity: card,
					transform: `translateY(${(1 - card) * 40}px)`,
				}}
			>
				<div style={{position: 'absolute', left: 30, top: 34, fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.white}}>PAYCHECK</div>
				<ExampleTag style={{position: 'absolute', right: 30, top: 24}} />
				<div style={{position: 'absolute', left: 30, top: 108, width: W, height: 74, borderRadius: 18, background: C.greenDeep, overflow: 'hidden'}}>
					<div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`, opacity: 0.8}} />
					{segs.map((s, i) => (
						<div
							key={s.label}
							style={{
								position: 'absolute',
								left: s.left * W,
								top: 0,
								bottom: 0,
								width: s.w * s.p * W,
								background: i === 0 ? '#2A2D31' : i === 1 ? '#45494F' : '#61666D',
								borderRight: '3px solid rgba(255,255,255,0.5)',
							}}
						/>
					))}
				</div>
				<div style={{position: 'absolute', right: 30, top: 196, fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: C.green, opacity: prog(frame, segs[2].at + 10, 8)}}>LEFT OVER</div>
				<div style={{position: 'absolute', left: 30, top: 200, display: 'flex', flexDirection: 'column', gap: 12}}>
					{segs.map((s) => (
						<div key={s.label} style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 3, color: C.red, opacity: frame < s.at ? 0 : prog(frame, s.at, 5), transform: `translateX(${(1 - prog(frame, s.at, 10)) * -20}px)`}}>
							− {s.label}
						</div>
					))}
				</div>
				<div style={{position: 'absolute', right: 30, top: 320, opacity: loop, transform: `translateY(${(1 - loop) * 12}px)`}}>
					<Label size={30} color={C.white}>↻ Every month</Label>
				</div>
			</div>
		</AbsoluteFill>
	);
};
