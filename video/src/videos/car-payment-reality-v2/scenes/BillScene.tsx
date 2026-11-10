import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS, usd} from '../facts';
import {CarKey, M} from '../parts';

/*
 * One continuous shot, L1–L10.
 *   hook    green $750/MO + CAR PAYMENT on frame 0, key drops beside it; a lit
 *           side-profile car rises beneath by ~1 s while the number stays put
 *   L3      "And the worst part?": the white EXAMPLE receipt opens, $750 becomes row one
 *   L4      "just": JUST THE PAYMENT lands
 *   L5–L6   insurance / gas rows on their words; +$200s on their spoken "two"
 *   L7      PER MONTH $1,150 lands on "one thousand" — shown directly, held
 *   L8      PER YEAR $13,800/YR box becomes the focal point; before maintenance & repairs
 *   L9–L10  receipt folds, tears in half → $575/MO (half of this example), then uses
 */

// receipt geometry (canvas px)
const RL = 80;
const RW = 860;
const RT = 330;
const RB = 1236; // bottom of the zig-zag
const FOLD = Math.round((RT + RB) / 2);
const IN_L = RL + 52;
const IN_R = RL + RW - 52;
const ROW = {pay: 510, ins: 610, gas: 710, rule: 770, month: 862, yearTop: 952, yearH: 186, note: 1172};
const SOFT_INK = '#3C3F44';
const GREEN_ON_WHITE = '#0E9F4E';

const zig = (() => {
	const n = 22;
	const h = RB - RT;
	let d = `M0,0H${RW}V${h - 16}`;
	for (let i = n; i >= 0; i--) d += `L${((RW / n) * i).toFixed(1)},${i % 2 ? h : h - 16}`;
	return d + 'Z';
})();

const Bar: React.FC<{x: number; y: number; w: number; o: number; h?: number}> = ({x, y, w, o, h = 22}) =>
	o <= 0 ? null : <div style={{position: 'absolute', left: x, top: y - h / 2, width: w, height: h, borderRadius: h / 2, background: '#E7E8E5', opacity: o}} />;

/** Row highlight: a soft green wash behind the whole row (green = what matters now). */
const Wash: React.FC<{y: number; o: number}> = ({y, o}) =>
	o <= 0.001 ? null : <div style={{position: 'absolute', left: IN_L - 18, width: IN_R - IN_L + 36, top: y - 46, height: 92, borderRadius: 16, background: `rgba(44,224,127,${0.3 * o})`}} />;

const label: React.CSSProperties = {position: 'absolute', fontFamily: M.font, fontWeight: 800, letterSpacing: 4, color: SOFT_INK, whiteSpace: 'nowrap'};

export const BillScene: React.FC = () => {
	const f = useCurrentFrame();
	const {cue, fps} = useCues();

	const tAnd = cue('L3'); // "And the worst part?"
	const tJust = cue('L4', 'just');
	const tIns = cue('L5', 'insurance');
	const tGas = cue('L5', 'gas');
	const tMaint = cue('L5', 'maintenance');
	const tIns200 = cue('L6', 4, -0.05); // "two" (hundred dollars for insurance)
	const tGas200 = cue('L6', 11, -0.05); // "two" (hundred dollars for gas)
	const tMonth = cue('L7', 'one', -0.05); // "one thousand one hundred and fifty"
	const tL8 = cue('L8');
	const tYear = cue('L8', 'fourteen', -0.1);
	const tFold = cue('L9');
	const tHalf = cue('L9', 'half');
	const tOpt = [cue('L10', 'saving'), cue('L10', 'investing'), cue('L10', 'traveling')];

	/* ── hook: car rises beneath the number, then gives way to the receipt ── */
	const carIn = prog(f, 3, 26, E.out); // visible by ~1 s
	const carOut = prog(f, tAnd - 2, 16, E.inOut);
	const sheen = kf(f, [6, 70], [-0.25, 1.2], E.soft);

	/* ── hook → receipt ── */
	const unroll = prog(f, tAnd, 20, E.out);
	const p = prog(f, tAnd + 3, 18, E.inOut); // $750 → row one

	/* ── key: drops beside $750, rests above the receipt next to JUST THE PAYMENT, leaves on the fold ── */
	const land = kf(f, [0, 12], [0.55, 1], E.in);
	const settle = sp(f, fps, 12, 'bouncy');
	const heroKey: [number, number] = arc(land, [1060, -120], [872, 650], 120);
	const heroRot = mix(-95, -14, land) + (1 - settle) * 6;
	const restKey: [number, number] = [852, 250];
	const kp = arc(p, heroKey, restKey, 60);
	const keyRot = mix(heroRot, -62, p);
	const keyScale = mix(0.95, 0.62, p);
	const keyOut = prog(f, tFold + 2, 16, E.in);
	const keyOutXY = arc(keyOut, kp, [1300, 80], 80);

	/* ── fold + tear ── */
	const fold = prog(f, tFold + 2, 16, E.inOut);
	const theta = fold * 180;
	const slipDrop = prog(f, tFold + 16, 14, E.out);
	const tear = prog(f, tHalf - 2, 16, E.inOut);

	/* ── $1,150 and $13,800 ── */
	const month = sp(f, fps, tMonth, 'heavy');
	const rule = kf(f, [tMonth - 8, tMonth + 2], [0, 1], E.out);
	const year = sp(f, fps, tYear, 'heavy');
	const focus = prog(f, tYear - 2, 14, E.inOut) * (1 - prog(f, tFold, 8)); // dim the rest, push to the year box

	const camKeys = [
		{at: 0, zoom: 1},
		{at: tYear - 2, zoom: 1, x: 540, y: 960},
		{at: tYear + 16, zoom: 1.1, x: 510, y: ROW.yearTop + ROW.yearH / 2 - 40, ease: E.out},
		{at: tFold, zoom: 1.1, x: 510, y: ROW.yearTop + ROW.yearH / 2 - 40},
		{at: tFold + 16, zoom: 1, x: 540, y: 960, ease: E.inOut},
	];

	const Contents: React.FC<{clip?: string}> = ({clip}) => (
		<div style={{position: 'absolute', inset: 0, clipPath: clip}}>
			<div style={{position: 'absolute', left: RL, top: RT, width: RW, height: RB - RT, clipPath: `inset(0 0 ${(1 - unroll) * 100}% 0)`}}>
				<svg width={RW} height={RB - RT} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.65))'}}>
					<path d={zig} fill="#FFFFFF" />
				</svg>
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: prog(f, tAnd + 2, 10)}}>
				{/* header */}
				<div style={{...label, left: IN_L, top: 384, fontSize: 30, letterSpacing: 6}}>MONTHLY CAR COST</div>
				<div style={{position: 'absolute', right: 1080 - IN_R, top: 372, fontFamily: M.font, fontWeight: 900, fontSize: 32, letterSpacing: 6, color: '#FFFFFF', background: M.paperInk, borderRadius: 12, padding: '8px 20px'}}>EXAMPLE</div>
				<div style={{position: 'absolute', left: IN_L, width: IN_R - IN_L, top: 450, height: 3, background: `repeating-linear-gradient(90deg, ${M.paperInk} 0 14px, transparent 14px 24px)`}} />
				{/* placeholders: there's more under the payment */}
				<Bar x={IN_L} y={ROW.ins} w={230} o={1 - prog(f, tIns - 2, 6)} />
				<Bar x={IN_R - 130} y={ROW.ins} w={130} o={1 - prog(f, tIns - 2, 6)} />
				<Bar x={IN_L} y={ROW.gas} w={140} o={1 - prog(f, tGas - 2, 6)} />
				<Bar x={IN_R - 130} y={ROW.gas} w={130} o={1 - prog(f, tGas - 2, 6)} />
				<Bar x={IN_L} y={ROW.month} w={250} h={30} o={1 - prog(f, tMonth, 4)} />
				<Bar x={IN_R - 300} y={ROW.month} w={300} h={44} o={1 - prog(f, tMonth, 4)} />
			</div>
			{/* row washes */}
			<Wash y={ROW.pay} o={prog(f, tJust, 5) * (1 - prog(f, tIns200 - 4, 6))} />
			<Wash y={ROW.ins} o={prog(f, tIns200, 4) * (1 - prog(f, tGas200 - 4, 6))} />
			<Wash y={ROW.gas} o={prog(f, tGas200, 4) * (1 - prog(f, tMonth - 4, 6))} />
			{/* insurance / gas */}
			{(
				[
					['INSURANCE', ROW.ins, tIns, tIns200, FACTS.insurance.value],
					['GAS', ROW.gas, tGas, tGas200, FACTS.gas.value],
				] as const
			).map(([name, y, tl, ta, v]) => {
				const a = prog(f, tl - 2, 8);
				const pop = sp(f, fps, ta, 'snappy');
				return (
					<React.Fragment key={name}>
						<div style={{...label, left: IN_L, top: y - 19, fontSize: 38, lineHeight: '38px', opacity: a, transform: `translateX(${(1 - a) * -24}px)`}}>{name}</div>
						<div style={{position: 'absolute', right: 1080 - IN_R, top: y - 42, fontFamily: M.font, fontSize: 80, lineHeight: '84px', fontWeight: 900, letterSpacing: -2, color: M.paperInk, whiteSpace: 'nowrap'}}>
							{f < ta ? (
								<span style={{color: '#B8BCC1', opacity: a, fontSize: 60}}>$ —</span>
							) : (
								<span style={{display: 'inline-block', opacity: prog(f, ta, 3), transform: `translateY(${(1 - pop) * 20}px) scale(${1.2 - 0.2 * pop})`, transformOrigin: 'right center'}}>+{usd(v)}</span>
							)}
						</div>
					</React.Fragment>
				);
			})}
			{/* sum rule + PER MONTH (hidden until "one thousand…") */}
			<div style={{position: 'absolute', left: IN_L, top: ROW.rule, width: (IN_R - IN_L) * rule, height: 6, borderRadius: 3, background: M.paperInk}} />
			{f >= tMonth && (
				<div style={{position: 'absolute', left: IN_L, width: IN_R - IN_L, top: ROW.month - 70, height: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: M.font, opacity: prog(f, tMonth, 3), transform: `scale(${1.1 - 0.1 * month})`, transformOrigin: '100% 50%'}}>
					<div style={{fontWeight: 900, fontSize: 42, letterSpacing: 4, color: M.paperInk}}>PER MONTH</div>
					<div style={{fontWeight: 900, fontSize: 128, letterSpacing: -4, color: GREEN_ON_WHITE}}>{usd(FACTS.monthly.value)}</div>
				</div>
			)}
			{/* focus: the rest of the receipt steps back while the year box is the point */}
			{focus > 0 && <div style={{position: 'absolute', left: RL, width: RW, top: RT, height: ROW.yearTop - RT - 14, background: `rgba(255,255,255,${0.62 * focus})`}} />}
			{/* PER YEAR focal box */}
			{f >= tYear && (
				<div
					style={{
						position: 'absolute',
						left: IN_L - 8,
						width: IN_R - IN_L + 16,
						top: ROW.yearTop,
						height: ROW.yearH,
						boxSizing: 'border-box',
						padding: '0 30px',
						borderRadius: 24,
						background: M.paperInk,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						fontFamily: M.font,
						opacity: prog(f, tYear, 3),
						transform: `translateY(${(1 - year) * 34}px) scale(${mix(0.94, 1, year)})`,
						boxShadow: `0 0 0 ${6 * focus}px rgba(44,224,127,${0.35 * focus})`,
					}}
				>
					<div>
						<div style={{fontWeight: 900, fontSize: 36, letterSpacing: 4, color: '#FFFFFF', whiteSpace: 'nowrap'}}>PER YEAR</div>
						<div style={{fontWeight: 700, fontSize: 28, letterSpacing: 1, color: '#A7ADB4', marginTop: 6, whiteSpace: 'nowrap'}}>{usd(FACTS.monthly.value)} × 12</div>
					</div>
					<div style={{display: 'flex', alignItems: 'baseline', color: M.green, fontWeight: 900}}>
						<span style={{fontSize: 106, letterSpacing: -4}}>{usd(FACTS.yearly.value)}</span>
						<span style={{fontSize: 40, marginLeft: 4}}>/YR</span>
					</div>
				</div>
			)}
			{/* note: maintenance stays outside the math */}
			{f >= tMaint - 2 && (
				<div style={{position: 'absolute', left: RL, width: RW, top: ROW.note - 16, textAlign: 'center', fontFamily: M.font, fontWeight: 800, fontSize: 27, letterSpacing: 3, color: f >= tYear ? M.paperInk : '#8A8F96', opacity: prog(f, tMaint - 2, 8)}}>
					{f >= tYear ? 'EXAMPLE · BEFORE MAINTENANCE & REPAIRS' : '+ MAINTENANCE NOT INCLUDED'}
				</div>
			)}
		</div>
	);

	const amountColor = interpolateColors(p, [0, 0.6], [M.green, M.paperInk]);
	const labelColor = interpolateColors(p, [0, 0.6], [M.ink, SOFT_INK]);
	const MorphRow: React.FC<{clip?: string}> = ({clip}) => (
		<div style={{position: 'absolute', inset: 0, clipPath: clip}}>
			<div
				style={{
					position: 'absolute',
					right: 1080 - mix(640, IN_R, p),
					top: mix(560, ROW.pay - 42, p),
					fontFamily: M.font,
					fontSize: mix(212, 80, p),
					lineHeight: `${mix(212, 84, p)}px`,
					fontWeight: 900,
					letterSpacing: mix(-8, -2, p),
					color: amountColor,
					whiteSpace: 'nowrap',
				}}
			>
				{usd(FACTS.carPayment.value)}
			</div>
			<div style={{position: 'absolute', left: 650, top: 678, fontFamily: M.font, fontSize: 84, lineHeight: '84px', fontWeight: 900, color: M.ink, opacity: 1 - prog(f, tAnd + 3, 6)}}>/MO</div>
			<div
				style={{
					...label,
					left: mix(118, IN_L, p),
					top: mix(792, ROW.pay - 19, p),
					fontSize: mix(48, 38, p),
					lineHeight: `${mix(48, 38, p)}px`,
					letterSpacing: mix(10, 4, p),
					color: labelColor,
				}}
			>
				CAR PAYMENT
			</div>
		</div>
	);

	const folding = theta > 0;
	const topClip = `inset(0 0 ${1920 - FOLD}px 0)`;
	const botClip = `inset(${FOLD}px 0 0 0)`;

	const tagIn = sp(f, fps, tJust - 1, 'snappy');
	const tagOut = prog(f, tIns - 4, 8, E.inOut);

	const half = sp(f, fps, tHalf, 'heavy');
	const optsIn = prog(f, tOpt[0] - 3, 8);
	const halfColor = interpolateColors(optsIn, [0, 1], [M.green, M.ink]);

	return (
		<AbsoluteFill style={{background: M.bg}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 50% 52%, #17191D 0%, #0B0C0E 70%)'}} />
			<Camera keys={camKeys}>
				{/* the car beneath the price: lit so it reads on a phone */}
				{carOut < 1 && (
					<div style={{position: 'absolute', inset: 0, opacity: carIn * (1 - carOut), transform: `translate(${(1 - carIn) * 140}px, ${carOut * 120}px)`}}>
						<div style={{position: 'absolute', left: -100, right: -100, top: 900, height: 520, background: 'radial-gradient(ellipse 55% 50% at 50% 70%, rgba(150,160,172,0.32) 0%, rgba(80,88,98,0.12) 45%, rgba(0,0,0,0) 75%)'}} />
						<div style={{position: 'absolute', left: 90, right: 90, top: 1328, height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.18) 80%, transparent)'}} />
						<Car id="hookcar" variant="luxury" paint={PAINTS.gunmetal} x={540} y={1330} w={1000} lights={1} beam={0.5} rim={1} sheen={sheen} sheenAmt={0.7} reflection={0.2} />
					</div>
				)}

				{/* receipt (and the morphing first row) */}
				<div style={{position: 'absolute', inset: 0, transformOrigin: `540px ${RT}px`, transform: `translateY(${260 * slipDrop}px) scale(${mix(1, 0.86, slipDrop)})`}}>
					{!folding ? (
						<>
							<Contents />
							<MorphRow />
						</>
					) : (
						<div style={{position: 'absolute', inset: 0, opacity: 1 - tear}}>
							<div style={{position: 'absolute', inset: 0, transform: `translateX(${-150 * tear}px) rotate(${-5 * tear}deg)`, clipPath: 'inset(0 540px 0 0)'}}>
								<FoldedReceipt theta={theta} Contents={Contents} MorphRow={MorphRow} topClip={topClip} botClip={botClip} />
							</div>
							<div style={{position: 'absolute', inset: 0, transform: `translateX(${150 * tear}px) rotate(${5 * tear}deg)`, clipPath: 'inset(0 0 0 540px)'}}>
								<FoldedReceipt theta={theta} Contents={Contents} MorphRow={MorphRow} topClip={topClip} botClip={botClip} />
							</div>
						</div>
					)}
				</div>
				{keyOut < 1 && <CarKey x={keyOut > 0 ? keyOutXY[0] : kp[0]} y={keyOut > 0 ? keyOutXY[1] : kp[1]} rot={keyRot + keyOut * 140} scale={keyScale} />}

				{/* JUST THE PAYMENT — lands on "just" */}
				{tagIn > 0 && tagOut < 1 && (
					<div
						style={{
							position: 'absolute',
							left: 96,
							top: 214,
							fontFamily: M.font,
							fontWeight: 900,
							fontSize: 58,
							letterSpacing: -1,
							color: M.ink,
							whiteSpace: 'nowrap',
							opacity: Math.min(1, tagIn) * (1 - tagOut),
							transform: `translateY(${-30 * tagOut}px) scale(${1.25 - 0.25 * tagIn})`,
							transformOrigin: 'left center',
						}}
					>
						<span style={{color: M.green}}>JUST</span> THE PAYMENT
					</div>
				)}

				{/* half of this example */}
				{f >= tHalf - 2 && (
					<>
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 540,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'baseline',
								fontFamily: M.font,
								fontWeight: 900,
								color: halfColor,
								opacity: Math.min(1, half * 1.4),
								transform: `translateY(${(1 - half) * 40}px) scale(${mix(0.86, 1, half)})`,
							}}
						>
							<span style={{fontSize: 224, lineHeight: '224px', letterSpacing: -8}}>{usd(FACTS.half.value)}</span>
							<span style={{fontSize: 84, marginLeft: 6}}>/MO</span>
						</div>
						<div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 40, color: M.muted, opacity: prog(f, tHalf + 6, 8)}}>
							Half of this example
						</div>
					</>
				)}

				{/* possible uses, one at a time */}
				{optsIn > 0 && (
					<div style={{position: 'absolute', left: 0, right: 0, top: 960, opacity: optsIn}}>
						<div style={{textAlign: 'center', fontFamily: M.font, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: M.muted}}>COULD GO TO</div>
						<div style={{position: 'relative', height: 140, marginTop: 18, overflow: 'hidden'}}>
							{['SAVING', 'INVESTING', 'TRAVELING'].map((w, i) => {
								const a = sp(f, fps, tOpt[i] - 2, 'snappy');
								const out = i < 2 ? sp(f, fps, tOpt[i + 1] - 2, 'snappy') : 0;
								if (a <= 0.001 || out >= 0.999) return null;
								return (
									<div
										key={w}
										style={{position: 'absolute', left: 0, right: 0, top: 10, textAlign: 'center', fontFamily: M.font, fontWeight: 900, fontSize: 112, lineHeight: '120px', letterSpacing: -2, color: M.green, transform: `translateY(${(1 - a) * 120 - out * 120}px)`}}
									>
										{w}
									</div>
								);
							})}
						</div>
						<div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 18}}>
							{[0, 1, 2].map((i) => (
								<div key={i} style={{width: 16, height: 16, borderRadius: 8, background: f >= tOpt[i] - 2 ? M.green : M.line}} />
							))}
						</div>
					</div>
				)}
			</Camera>

			<Sfx at={11} name="click" volume={0.3} />
			<Sfx at={tAnd} name="paper" volume={0.35} />
			<Sfx at={tIns - 1} name="tick" volume={0.25} />
			<Sfx at={tGas - 1} name="tick" volume={0.25} />
			<Sfx at={cue('L7', 'bro') + 4} name="whoosh-soft" volume={0.25} />
			<Sfx at={tFold + 1} name="paper" volume={0.4} />
			<Sfx at={tHalf - 3} name="paper" volume={0.3} />
			{tOpt.map((t, i) => (
				<Sfx key={i} at={t - 3} name="pop" volume={0.18} />
			))}
		</AbsoluteFill>
	);
};

/** The receipt mid-fold: top half stays, bottom half flips up; its back shows the monthly total. */
const FoldedReceipt: React.FC<{
	theta: number;
	Contents: React.FC<{clip?: string}>;
	MorphRow: React.FC<{clip?: string}>;
	topClip: string;
	botClip: string;
}> = ({theta, Contents, MorphRow, topClip, botClip}) => (
	<>
		<Contents clip={topClip} />
		<MorphRow clip={topClip} />
		<div style={{position: 'absolute', inset: 0, transformOrigin: `540px ${FOLD}px`, transform: `perspective(2200px) rotateX(${theta}deg)`, backfaceVisibility: 'hidden'}}>
			<Contents clip={botClip} />
		</div>
		<div
			style={{
				position: 'absolute',
				left: RL,
				top: RT,
				width: RW,
				height: FOLD - RT,
				background: '#FFFFFF',
				transformOrigin: '50% 100%',
				transform: `perspective(2200px) rotateX(${theta - 180}deg)`,
				backfaceVisibility: 'hidden',
				boxShadow: '0 24px 40px rgba(0,0,0,0.6)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: M.font,
				color: M.paperInk,
			}}
		>
			<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 6, color: '#8A8F96'}}>EXAMPLE · PER MONTH</div>
			<div style={{fontSize: 128, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05}}>{usd(FACTS.monthly.value)}</div>
		</div>
	</>
);
