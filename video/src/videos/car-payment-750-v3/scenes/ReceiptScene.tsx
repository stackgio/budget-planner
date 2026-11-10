import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, FONT} from '../look';

const usd = (v: number) => `$${v.toLocaleString('en-US')}`;
const INK = '#0F0F10';
const GREEN_ON_WHITE = '#0E9F4E';

const Row: React.FC<{label: string; amount: string; at: number}> = ({label, amount, at}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = sp(frame, fps, at, 'snappy');
	const flash = kf(frame, [at, at + 3, at + 22], [0, 1, 0]);
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				height: 96,
				padding: '0 16px',
				margin: '0 -16px',
				borderRadius: 14,
				background: `rgba(57,255,136,${0.22 * flash})`,
				opacity: frame < at ? 0 : prog(frame, at, 4),
				transform: `translateY(${(1 - s) * 24}px)`,
				fontFamily: FONT,
			}}
		>
			<div style={{fontWeight: 800, fontSize: 40, letterSpacing: 4, color: '#3C3F44'}}>{label}</div>
			<div style={{fontWeight: 900, fontSize: 84, letterSpacing: -2, color: INK}}>{amount}</div>
		</div>
	);
};

/**
 * L6–L8 on one white EXAMPLE receipt: each $200 lands on its spoken "two",
 * $1,150/month on "one thousand", $13,800/year on "fourteen" — static, no rolling digits.
 */
export const ReceiptScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIns = cue('L6', 'two', -0.05);
	const tGas = cue('L6', 11, -0.05); // second "two" ("another two hundred dollars for gas")
	const tMonth = cue('L7', 'one', -0.05);
	const tYear = cue('L8', 'fourteen', -0.1);
	const tTires = cue('L8', 'tires', -0.1);

	const month = sp(frame, fps, tMonth, 'heavy');
	const year = sp(frame, fps, tYear, 'heavy');
	const rule = kf(frame, [tMonth - 6, tMonth + 4], [0, 1], E.out);
	const rowsO = kf(frame, [tMonth, tMonth + 10], [1, 0.4]);
	const yearK = kf(frame, [tYear, tYear + 10], [0, 1]);
	const monthO = 1 - 0.55 * yearK;
	const enter = sp(frame, fps, 0, 'smooth');

	return (
		<AbsoluteFill style={{background: C.black}}>
			<Camera
				keys={[
					{at: 0, zoom: 1.0, y: 960},
					{at: tMonth - 6, zoom: 1.0, y: 960},
					{at: tMonth + 14, zoom: 1.03, y: 1000, ease: E.inOut},
				]}
			>
				<div
					style={{
						position: 'absolute',
						left: 70,
						right: 70,
						top: 200,
						height: 1010,
						background: '#FFFFFF',
						borderRadius: '28px 28px 0 0',
						boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
						padding: '44px 60px 0',
						boxSizing: 'border-box',
						transform: `translateY(${(1 - enter) * 60}px)`,
						clipPath:
							'polygon(0 0, 100% 0, 100% 98%, 95% 100%, 90% 98%, 85% 100%, 80% 98%, 75% 100%, 70% 98%, 65% 100%, 60% 98%, 55% 100%, 50% 98%, 45% 100%, 40% 98%, 35% 100%, 30% 98%, 25% 100%, 20% 98%, 15% 100%, 10% 98%, 5% 100%, 0 98%)',
					}}
				>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
						<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: '#3C3F44'}}>MONTHLY CAR COST</div>
						<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 36, letterSpacing: 6, color: C.white, background: INK, borderRadius: 12, padding: '10px 22px'}}>EXAMPLE</div>
					</div>
					<div style={{height: 3, background: 'repeating-linear-gradient(90deg, #0F0F10 0 14px, transparent 14px 24px)', marginBottom: 16}} />
					{/* the line items step back once the total lands, so the total owns its beat */}
					<div style={{opacity: rowsO}}>
						<Row label="CAR PAYMENT" amount={usd(FACTS.payment.value)} at={-10} />
						<Row label="INSURANCE" amount={`+${usd(FACTS.insurance.value)}`} at={tIns} />
						<Row label="GAS" amount={`+${usd(FACTS.gas.value)}`} at={tGas} />
						<div style={{height: 6, background: INK, width: `${rule * 100}%`, margin: '10px 0 16px', borderRadius: 3}} />
					</div>
					{/* $1,150/MO — strongest number of the L7 beat */}
					<div
						style={{
							opacity: (frame < tMonth ? 0 : prog(frame, tMonth, 4)) * monthO,
							transform: `scale(${(1.1 - 0.1 * month) * (1 - 0.12 * yearK)})`,
							transformOrigin: '0% 50%',
							fontFamily: FONT,
						}}
					>
						<div style={{fontWeight: 900, fontSize: 34, letterSpacing: 5, color: INK}}>PER MONTH</div>
						<div style={{fontWeight: 900, fontSize: 168, lineHeight: 1, letterSpacing: -7, color: GREEN_ON_WHITE}}>
							{usd(FACTS.monthly.value)}
							<span style={{fontSize: 64, letterSpacing: 0, color: INK}}>/MO</span>
						</div>
					</div>
					{/* $13,800/YR — strongest number of the L8 beat */}
					<div
						style={{
							marginTop: 18,
							padding: '20px 30px 24px',
							borderRadius: 22,
							background: INK,
							opacity: frame < tYear ? 0 : prog(frame, tYear, 4),
							transform: `translateY(${(1 - year) * 30}px) scale(${1.06 - 0.06 * year})`,
							transformOrigin: '50% 0%',
							fontFamily: FONT,
						}}
					>
						<div style={{fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.white}}>
							PER YEAR <span style={{color: C.gray}}>· {usd(FACTS.monthly.value)} × 12</span>
						</div>
						<div style={{fontWeight: 900, fontSize: 168, lineHeight: 1, letterSpacing: -7, color: C.green}}>
							{usd(FACTS.yearly.value)}
							<span style={{fontSize: 64, letterSpacing: 0, color: C.white}}>/YR</span>
						</div>
					</div>
					<div style={{marginTop: 22, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: '#3C3F44', opacity: frame < tTires ? 0 : prog(frame, tTires, 6)}}>
						+ TIRES &amp; REPAIRS NOT INCLUDED
					</div>
				</div>
			</Camera>
		</AbsoluteFill>
	);
};
