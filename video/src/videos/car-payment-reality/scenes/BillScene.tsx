import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS, usd} from '../facts';
import {CarKey, M} from '../parts';

/*
 * One continuous shot, L1–L10.
 *   hook   $750/MO + CAR PAYMENT readable on frame 0, key lands beside it
 *   "just" the number shrinks into line one of an EXAMPLE receipt (rows below)
 *   L5–L6  insurance / gas / maintenance itemize on their words; $200s on theirs
 *   L7     total lands under the rows, camera gives $1,150/MO the screen
 *   L8     $1,150 × 12 → $13,800/YR, "Before tires and repairs"
 *   L9–10  receipt folds, tears in half → $575/MO, then saving / investing / traveling
 */

// receipt geometry (canvas px, before the L8 compaction)
const RL = 150;
const RW = 780;
const RT = 400;
const RB = 1080; // bottom of the zig-zag
const FOLD = 740; // fold line
const IN_L = 196;
const IN_R = 884;
const ROW = {pay: 570, ins: 660, gas: 750, total: 890, maint: 1018};

const zig = (() => {
	const n = 20;
	const h = RB - RT;
	let d = `M0,0H${RW}V${h - 16}`;
	for (let i = n; i >= 0; i--) d += `L${((RW / n) * i).toFixed(1)},${i % 2 ? h : h - 16}`;
	return d + 'Z';
})();

const Dash: React.FC<{y: number; o?: number}> = ({y, o = 1}) => (
	<div style={{position: 'absolute', left: IN_L - 6, width: IN_R - IN_L + 12, top: y, borderTop: `3px dashed ${M.paperLine}`, opacity: o}} />
);

const Skeleton: React.FC<{y: number; o: number; wl?: number}> = ({y, o, wl = 240}) =>
	o <= 0 ? null : (
		<>
			<div style={{position: 'absolute', left: IN_L, top: y - 11, width: wl, height: 22, borderRadius: 11, background: '#E6E8E4', opacity: o}} />
			<div style={{position: 'absolute', left: IN_R - 120, top: y - 11, width: 120, height: 22, borderRadius: 11, background: '#E6E8E4', opacity: o}} />
		</>
	);

const Pill: React.FC<{y: number; w: number; h: number; o: number}> = ({y, w, h, o}) =>
	o <= 0 ? null : (
		<div style={{position: 'absolute', left: IN_R + 14 - w, top: y - h / 2, width: w, height: h, borderRadius: 14, background: M.green, opacity: o, transform: `scaleX(${0.85 + 0.15 * o})`, transformOrigin: 'right center'}} />
	);

const label: React.CSSProperties = {position: 'absolute', fontFamily: M.font, fontWeight: 800, letterSpacing: 3, color: M.paperInk, whiteSpace: 'nowrap'};

export const BillScene: React.FC = () => {
	const f = useCurrentFrame();
	const {cue, fps} = useCues();

	const tJust = cue('L4', 'just');
	const tIns = cue('L5', 'insurance');
	const tGas = cue('L5', 'gas');
	const tMaint = cue('L5', 'maintenance');
	const tIns200 = cue('L6', 4); // "two" (hundred dollars for insurance)
	const tGas200 = cue('L6', 11); // "two" (hundred dollars for gas)
	const tTotal = cue('L7', 'one');
	const tDollars = cue('L7', 'dollars');
	const tL8 = cue('L8');
	const tAnnual = cue('L8', 'fourteen');
	const tTires = cue('L8', 'tires');
	const tFold = cue('L9');
	const tHalf = cue('L9', 'half');
	const tOpt = [cue('L10', 'saving'), cue('L10', 'investing'), cue('L10', 'traveling')];

	/* ── hook → receipt morph ── */
	const p = prog(f, tJust - 3, 16, E.inOut); // number → line one
	const unroll = prog(f, tJust - 1, 20, E.out);
	const compact = prog(f, tL8 - 2, 18, E.inOut); // make room for the annual math

	/* ── key: lands in the first half-second, rides on the receipt, leaves on the fold ── */
	const land = kf(f, [0, 12], [0.55, 1], E.in);
	const settle = sp(f, fps, 12, 'bouncy');
	const heroKey: [number, number] = arc(land, [1060, -120], [872, 772], 120);
	const heroRot = mix(-95, -14, land) + (1 - settle) * 6;
	const restKey: [number, number] = [796, 392];
	const kp = arc(p, heroKey, restKey, 60);
	const keyRot = mix(heroRot, -74, p);
	const keyScale = mix(0.95, 0.78, p);
	const keyOut = prog(f, tFold + 2, 16, E.in);
	const keyOutXY = arc(keyOut, kp, [1300, 120], 80);

	/* ── fold + tear ── */
	const fold = prog(f, tFold + 2, 16, E.inOut); // 0..1 → 0..180°
	const theta = fold * 180;
	const slipDrop = prog(f, tFold + 16, 14, E.out);
	const tear = prog(f, tHalf - 2, 16, E.inOut);
	const annualOut = prog(f, tFold, 10, E.inOut);

	/* ── camera: give $1,150/MO the screen, then settle for the annual math ── */
	const camKeys = [
		{at: 0, zoom: 1},
		{at: tDollars - 4, zoom: 1},
		{at: tDollars + 14, zoom: 1.3, x: 540, y: 905, ease: E.out},
		{at: tL8 - 3, zoom: 1.3, x: 540, y: 905},
		{at: tL8 + 14, zoom: 1, x: 540, y: 960, ease: E.inOut},
	];

	const total = kf(f, [tTotal - 2, tDollars + 3], [FACTS.carPayment.value, FACTS.monthly.value], E.out);
	const totalIn = prog(f, tTotal - 3, 8, E.out);

	/* receipt contents, in receipt/canvas coordinates */
	const Contents: React.FC<{clip?: string}> = ({clip}) => (
		<div style={{position: 'absolute', inset: 0, clipPath: clip}}>
			<div style={{position: 'absolute', left: RL, top: RT, width: RW, height: RB - RT, clipPath: `inset(0 0 ${(1 - unroll) * 100}% 0)`}}>
				<svg width={RW} height={RB - RT} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.6))'}}>
					<path d={zig} fill={M.paper} />
				</svg>
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: unroll}}>
				<div style={{...label, left: IN_L, top: 430, fontSize: 32, letterSpacing: 6, fontWeight: 900}}>EXAMPLE BILL</div>
				<Dash y={500} />
				<Dash y={812} />
				<Dash y={962} />
				{/* skeleton rows: there's more under the payment */}
				<Skeleton y={ROW.ins} o={1 - prog(f, tIns - 2, 6)} />
				<Skeleton y={ROW.gas} o={1 - prog(f, tGas - 2, 6)} wl={150} />
				<Skeleton y={ROW.maint} o={1 - prog(f, tMaint - 2, 6)} wl={300} />
				<div style={{...label, left: IN_L, top: ROW.total - 18, fontSize: 34, letterSpacing: 6, color: M.paperMuted}}>TOTAL</div>
				<div style={{position: 'absolute', left: IN_R - 200, top: ROW.total - 13, width: 200, height: 26, borderRadius: 13, background: '#E6E8E4', opacity: 1 - totalIn}} />
			</div>
			{/* highlight pills (green = what matters now) */}
			<Pill y={ROW.pay} w={186} h={70} o={prog(f, tJust + 6, 6) * (1 - prog(f, tIns200 - 4, 6))} />
			<Pill y={ROW.ins} w={186} h={70} o={prog(f, tIns200, 5) * (1 - prog(f, tGas200 - 4, 6))} />
			<Pill y={ROW.gas} w={186} h={70} o={prog(f, tGas200, 5) * (1 - prog(f, tTotal - 4, 6))} />
			<Pill y={ROW.total} w={408} h={108} o={prog(f, tDollars, 6) * (1 - prog(f, tAnnual - 2, 8))} />
			{/* rows 2–3 */}
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
						<div style={{...label, left: IN_L, top: y - 20, fontSize: 40, lineHeight: '40px', opacity: a, transform: `translateX(${(1 - a) * -24}px)`}}>{name}</div>
						<div style={{...label, right: 1080 - IN_R, top: y - 26, fontSize: 52, lineHeight: '52px', fontWeight: 900, letterSpacing: 0, textAlign: 'right'}}>
							{f < ta ? (
								<span style={{color: M.paperMuted, opacity: a}}>$ —</span>
							) : (
								<span style={{display: 'inline-block', transform: `scale(${1.35 - 0.35 * pop})`, transformOrigin: 'right center'}}>{usd(v)}</span>
							)}
						</div>
					</React.Fragment>
				);
			})}
			{/* maintenance: outside the subtotal, unpriced */}
			{(() => {
				const a = prog(f, tMaint - 2, 8);
				return (
					<>
						<div style={{...label, left: IN_L, top: ROW.maint - 17, fontSize: 34, color: M.paperMuted, opacity: a, transform: `translateX(${(1 - a) * -24}px)`}}>+ MAINTENANCE</div>
						<div style={{...label, right: 1080 - IN_R, top: ROW.maint - 13, fontSize: 26, letterSpacing: 4, color: M.paperMuted, opacity: a}}>NOT INCLUDED</div>
					</>
				);
			})()}
			{/* total */}
			<div style={{position: 'absolute', right: 1080 - IN_R, top: ROW.total - 46, display: 'flex', alignItems: 'baseline', opacity: totalIn, fontFamily: M.font}}>
				<NumberCounter value={total} fontSize={84} color={M.paperInk} roll />
				<span style={{fontSize: 38, fontWeight: 900, color: M.paperInk, marginLeft: 4}}>/MO</span>
			</div>
			{/* line one: the hook number, once it has become a row (rendered by the morph layer before) */}
		</div>
	);

	const amountColor = interpolateColors(p, [0, 0.6], [M.green, M.paperInk]);
	const labelColor = interpolateColors(p, [0, 0.6], [M.ink, M.paperInk]);
	const MorphRow: React.FC<{clip?: string}> = ({clip}) => (
		<div style={{position: 'absolute', inset: 0, clipPath: clip}}>
			<div
				style={{
					position: 'absolute',
					right: 1080 - mix(640, IN_R, p),
					top: mix(684, ROW.pay - 26, p),
					fontFamily: M.font,
					fontSize: mix(212, 52, p),
					lineHeight: `${mix(212, 52, p)}px`,
					fontWeight: 900,
					letterSpacing: mix(-8, 0, p),
					color: amountColor,
					fontVariantNumeric: 'tabular-nums',
					whiteSpace: 'nowrap',
				}}
			>
				{usd(FACTS.carPayment.value)}
			</div>
			<div style={{position: 'absolute', left: 650, top: 802, fontFamily: M.font, fontSize: 84, lineHeight: '84px', fontWeight: 900, color: M.ink, opacity: 1 - prog(f, tJust - 3, 6)}}>/MO</div>
			<div
				style={{
					...label,
					left: mix(118, IN_L, p),
					top: mix(918, ROW.pay - 20, p),
					fontSize: mix(48, 40, p),
					lineHeight: `${mix(48, 40, p)}px`,
					letterSpacing: mix(10, 3, p),
					color: labelColor,
				}}
			>
				CAR PAYMENT
			</div>
		</div>
	);

	// fold: bottom half flips up over the top half; its back is blank paper with the monthly total
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
			{/* soft floor light so the black isn't flat */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 50% 52%, #17191D 0%, #0B0C0E 70%)'}} />
			<Camera keys={camKeys}>
				{/* receipt group (compacts upward for the annual math) */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transformOrigin: `540px ${RT}px`,
						transform: `translateY(${-150 * compact + 260 * slipDrop}px) scale(${mix(1, 0.8, compact) * mix(1, 0.86, slipDrop)})`,
					}}
				>
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
					{/* the key rests on the receipt's top edge */}
					{keyOut < 1 && <CarKey x={keyOut > 0 ? keyOutXY[0] : kp[0]} y={keyOut > 0 ? keyOutXY[1] : kp[1]} rot={keyRot + keyOut * 140} scale={keyScale} />}
				</div>

				{/* "JUST THE PAYMENT" — second hook */}
				{tagIn > 0 && tagOut < 1 && (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 236,
							textAlign: 'center',
							fontFamily: M.font,
							fontWeight: 900,
							fontSize: 66,
							letterSpacing: -1,
							color: M.ink,
							opacity: Math.min(1, tagIn) * (1 - tagOut),
							transform: `translateY(${-30 * tagOut}px) scale(${1.25 - 0.25 * tagIn})`,
						}}
					>
						<span style={{color: M.green}}>JUST</span> THE PAYMENT
					</div>
				)}

				{/* annual math */}
				{f >= tL8 - 2 && annualOut < 1 && (
					<div style={{position: 'absolute', inset: 0, opacity: 1 - annualOut}}>
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 878,
								textAlign: 'center',
								fontFamily: M.font,
								fontWeight: 800,
								fontSize: 48,
								letterSpacing: 2,
								color: M.muted,
								opacity: prog(f, tL8 + 4, 8),
								transform: `translateY(${(1 - prog(f, tL8 + 4, 10)) * 16}px)`,
							}}
						>
							{usd(FACTS.monthly.value)} × 12
						</div>
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 960,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'baseline',
								fontFamily: M.font,
								fontWeight: 900,
								color: M.green,
								opacity: Math.min(1, sp(f, fps, tAnnual - 1, 'heavy') * 1.5),
								transform: `scale(${mix(0.82, 1, sp(f, fps, tAnnual - 1, 'heavy'))})`,
							}}
						>
							<span style={{fontSize: 164, lineHeight: '164px', letterSpacing: -6}}>{usd(FACTS.yearly.value)}</span>
							<span style={{fontSize: 72, marginLeft: 6}}>/YR</span>
						</div>
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 1168,
								textAlign: 'center',
								fontFamily: M.font,
								fontWeight: 700,
								fontSize: 38,
								color: M.ink,
								opacity: prog(f, tTires - 2, 8),
								transform: `translateY(${(1 - prog(f, tTires - 2, 10)) * 14}px)`,
							}}
						>
							<span style={{color: M.muted}}>+</span> Before tires and repairs
						</div>
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
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 790,
								textAlign: 'center',
								fontFamily: M.font,
								fontWeight: 700,
								fontSize: 40,
								color: M.muted,
								opacity: prog(f, tHalf + 6, 8),
							}}
						>
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
										style={{
											position: 'absolute',
											left: 0,
											right: 0,
											top: 10,
											textAlign: 'center',
											fontFamily: M.font,
											fontWeight: 900,
											fontSize: 112,
											lineHeight: '120px',
											letterSpacing: -2,
											color: M.green,
											transform: `translateY(${(1 - a) * 120 - out * 120}px)`,
										}}
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
			<Sfx at={tJust - 2} name="paper" volume={0.35} />
			<Sfx at={tIns - 1} name="tick" volume={0.25} />
			<Sfx at={tGas - 1} name="tick" volume={0.25} />
			<Sfx at={tMaint - 1} name="tick" volume={0.2} />
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
}> = ({theta, Contents, MorphRow, topClip, botClip}) => {
	const hH = FOLD - RT;
	return (
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
					height: hH,
					background: M.paper,
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
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 6, color: M.paperMuted}}>EXAMPLE · MONTHLY</div>
				<div style={{fontSize: 120, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05}}>
					{usd(FACTS.monthly.value)}
					<span style={{fontSize: 52}}>/MO</span>
				</div>
			</div>
		</>
	);
};
