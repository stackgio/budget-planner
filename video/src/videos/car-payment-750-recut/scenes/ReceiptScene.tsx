import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {FONT, K} from '../look';

const usd = (v: number) => `$${v.toLocaleString('en-US')}`;

const Row: React.FC<{label: string; amount: string; at: number; bold?: boolean}> = ({label, amount, at, bold}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = sp(frame, fps, at, 'snappy');
	const o = frame < at ? 0 : prog(frame, at, 4);
	return (
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: 108, opacity: o, transform: `translateY(${(1 - s) * 24}px)`, fontFamily: FONT}}>
			<div style={{fontWeight: 800, fontSize: 40, letterSpacing: 4, color: '#3C3F44'}}>{label}</div>
			<div style={{fontWeight: 900, fontSize: bold ? 92 : 84, letterSpacing: -2, color: K.ink, fontVariantNumeric: 'tabular-nums'}}>{amount}</div>
		</div>
	);
};

/** White EXAMPLE receipt: lines land on their cues, then $1,150/month and a stable $13,800/year. */
export const ReceiptScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIns = cue('L2', 'extra', -0.05);
	const tGas = cue('L2', 'four', -0.05);
	const tTotal = cue('L2', 'goes', -0.05);
	const tYear = cue('L3', 'thirteen', -0.1);
	const tTires = cue('L3', 'tires', -0.1);

	const total = sp(frame, fps, tTotal, 'heavy');
	const year = sp(frame, fps, tYear, 'heavy');
	const rule = kf(frame, [tTotal - 6, tTotal + 4], [0, 1], E.out);
	const yearO = frame < tYear ? 0 : prog(frame, tYear, 4);
	const foot = frame < tTires ? 0 : prog(frame, tTires, 6);

	return (
		<AbsoluteFill style={{background: K.black}}>
			{/* the receipt */}
			<div
				style={{
					position: 'absolute',
					left: 70,
					right: 70,
					top: 180,
					height: 1030,
					background: '#FFFFFF',
					borderRadius: '28px 28px 0 0',
					boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
					padding: '44px 60px 0',
					boxSizing: 'border-box',
					clipPath: 'polygon(0 0, 100% 0, 100% 98%, 95% 100%, 90% 98%, 85% 100%, 80% 98%, 75% 100%, 70% 98%, 65% 100%, 60% 98%, 55% 100%, 50% 98%, 45% 100%, 40% 98%, 35% 100%, 30% 98%, 25% 100%, 20% 98%, 15% 100%, 10% 98%, 5% 100%, 0 98%)',
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26}}>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: '#3C3F44'}}>MONTHLY CAR COST</div>
					<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: K.white, background: K.ink, borderRadius: 12, padding: '10px 20px'}}>EXAMPLE</div>
				</div>
				<div style={{height: 3, background: 'repeating-linear-gradient(90deg, #0F0F10 0 14px, transparent 14px 24px)', marginBottom: 18}} />
				<Row label="PAYMENT" amount={usd(FACTS.payment.value)} at={0} />
				<Row label="INSURANCE" amount={`+${usd(FACTS.insurance.value)}`} at={tIns} />
				<Row label="GAS" amount={`+${usd(FACTS.gas.value)}`} at={tGas} />
				<div style={{height: 6, background: K.ink, width: `${rule * 100}%`, margin: '14px 0 24px', borderRadius: 3}} />
				{/* $1,150 / month — snaps in, no rolling digits */}
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: frame < tTotal ? 0 : prog(frame, tTotal, 4), transform: `scale(${1.08 - 0.08 * total})`, transformOrigin: '100% 50%', fontFamily: FONT}}>
					<div style={{fontWeight: 900, fontSize: 40, letterSpacing: 4, color: K.ink}}>PER MONTH</div>
					<div style={{fontWeight: 900, fontSize: 124, letterSpacing: -4, color: K.greenInk}}>{usd(FACTS.monthly.value)}</div>
				</div>
				{/* $13,800 / year — stable */}
				<div
					style={{
						marginTop: 34,
						padding: '26px 30px',
						borderRadius: 22,
						background: K.ink,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						opacity: yearO,
						transform: `translateY(${(1 - year) * 30}px)`,
						fontFamily: FONT,
					}}
				>
					<div>
						<div style={{fontWeight: 900, fontSize: 38, letterSpacing: 4, color: K.white}}>PER YEAR</div>
						<div style={{fontWeight: 700, fontSize: 28, letterSpacing: 3, color: K.gray, marginTop: 6}}>{usd(FACTS.monthly.value)} × 12</div>
					</div>
					<div style={{fontWeight: 900, fontSize: 116, letterSpacing: -4, color: K.green}}>{usd(FACTS.yearly.value)}</div>
				</div>
				<div style={{marginTop: 22, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: '#3C3F44', opacity: foot}}>
					BEFORE TIRES OR REPAIRS
				</div>
			</div>
		</AbsoluteFill>
	);
};
