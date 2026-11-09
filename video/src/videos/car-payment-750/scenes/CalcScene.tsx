import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, FONT} from '../look';

/** Where the total lands when the calculator collapses (shared with RevealScene for the match cut). */
export const TOTAL_POS = {cx: 540, cy: 900, size: 170};

const Row: React.FC<{label: string; value: number; sign?: string; color: string; o: number; y: number; flash?: number}> = ({label, value, sign = '', color, o, y, flash = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: 56,
			right: 56,
			top: y,
			height: 120,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			fontFamily: FONT,
			opacity: o,
			transform: `translateX(${(1 - o) * 60}px)`,
			borderRadius: 18,
			background: `rgba(255,90,78,${0.1 * flash})`,
			padding: '0 18px',
		}}
	>
		<div style={{fontWeight: 800, fontSize: 38, letterSpacing: 4, color: '#3A3E44'}}>{label}</div>
		<div style={{fontWeight: 900, fontSize: 84, letterSpacing: -2, color, fontVariantNumeric: 'tabular-nums'}}>
			{sign}${value}
		</div>
	</div>
);

export const CalcScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIns = cue('L6', 'two');
	const tGas = cue('L6', 11); // the second "two" ("another two hundred dollars for gas")
	const tEnd = cue('L6', 'gas', 0.2);

	const card = sp(frame, fps, 0, 'smooth');
	const ins = sp(frame, fps, tIns - 2, 'snappy');
	const gas = sp(frame, fps, tGas - 2, 'snappy');
	// running total rolls up as each line lands
	const insRoll = kf(frame, [tIns, tIns + 16], [0, 1], E.out);
	const gasRoll = kf(frame, [tGas, tGas + 16], [0, 1], E.out);
	const total = FACTS.payment.value + FACTS.insurance.value * insRoll + FACTS.gas.value * gasRoll;
	const settled = gasRoll >= 1;
	const fold = prog(frame, tEnd - 4, 12, E.inOut);

	const cardTop = 330;
	const totalY = cardTop + 560; // centre of total row inside the card
	// collapse: total moves to the shared centre point and grows; everything else folds away
	const tx = mix(0, TOTAL_POS.cx - 640, fold);
	const ty = mix(0, TOTAL_POS.cy - totalY, fold);
	const ts = mix(1, TOTAL_POS.size / 110, fold);

	const bar = (v: number) => (v / FACTS.monthly.value) * 820;

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #FFFFFF 0%, #F3F2EE 55%, #E4E3DE 100%)'}} />
			{/* calculator card */}
			<div
				style={{
					position: 'absolute',
					left: 70,
					right: 70,
					top: cardTop,
					height: 740,
					borderRadius: 40,
					background: '#FFFFFF',
					boxShadow: '0 40px 90px rgba(16,16,16,0.12), 0 2px 0 rgba(16,16,16,0.04)',
					opacity: card * (1 - fold),
					transform: `translateY(${(1 - card) * 50 + fold * -30}px) scale(${1 - fold * 0.06})`,
				}}
			>
				<div style={{position: 'absolute', left: 74, top: 46, fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#6B7078'}}>MONTHLY COST</div>
				<ExampleTag dark={false} style={{position: 'absolute', right: 56, top: 36}} />
				<Row label="CAR PAYMENT" value={FACTS.payment.value} color={C.ink} o={1} y={110} />
				<Row label="INSURANCE" value={FACTS.insurance.value} sign="+" color={C.redDeep} o={ins} y={240} flash={kf(frame, [tIns, tIns + 4, tIns + 20], [0, 1, 0])} />
				<Row label="GAS" value={FACTS.gas.value} sign="+" color={C.redDeep} o={gas} y={370} flash={kf(frame, [tGas, tGas + 4, tGas + 20], [0, 1, 0])} />
				<div style={{position: 'absolute', left: 74, right: 74, top: 510, height: 4, borderRadius: 2, background: '#101010'}} />
				{/* stacked bar = running total */}
				<div style={{position: 'absolute', left: 74, top: 660, width: 820, height: 20, borderRadius: 10, background: '#ECECE8', overflow: 'hidden', display: 'flex'}}>
					<div style={{width: bar(FACTS.payment.value), background: '#2A2D31'}} />
					<div style={{width: bar(FACTS.insurance.value) * insRoll, background: C.red}} />
					<div style={{width: bar(FACTS.gas.value) * gasRoll, background: '#FF8A6E'}} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 144, top: cardTop + 560 - 28, fontFamily: FONT, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: '#3A3E44', opacity: card * (1 - fold)}}>TOTAL</div>
			{/* the total — travels out of the card on the collapse */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: totalY - 60,
					width: 1280,
					textAlign: 'center',
					transform: `translate(${tx}px, ${ty}px) scale(${ts})`,
					transformOrigin: '640px 60px',
					opacity: card,
				}}
			>
				<div style={{display: 'inline-block', transform: `translateX(${mix(190, 0, fold)}px)`}}>
					<NumberCounter value={total} fontSize={110} color={settled ? C.greenDeep : C.ink} roll style={{fontFamily: FONT, letterSpacing: -2}} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
