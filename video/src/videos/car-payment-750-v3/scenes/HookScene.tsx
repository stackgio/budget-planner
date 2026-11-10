import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, type CamKey} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, FONT, StudioBg} from '../look';

const usd = (v: number) => `$${v.toLocaleString('en-US')}`;

/** Fade/rise helper for one element appearing at `at` (local frames). */
const useIn = (at: number, cfg: 'snappy' | 'heavy' | 'bouncy' = 'snappy') => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = sp(frame, fps, at, cfg);
	return {opacity: frame < at ? 0 : prog(frame, at, 4), s};
};

const Chip: React.FC<{text: string; at: number; big?: boolean}> = ({text, at, big}) => {
	const {opacity, s} = useIn(at);
	return (
		<div
			style={{
				display: 'inline-flex',
				padding: big ? '18px 32px' : '12px 24px',
				borderRadius: 999,
				border: `3px solid ${C.white}`,
				background: 'rgba(15,15,16,0.85)',
				fontFamily: FONT,
				fontWeight: 900,
				fontSize: big ? 56 : 44,
				letterSpacing: 1,
				color: C.white,
				opacity,
				transform: `translateY(${(1 - s) * 22}px) scale(${0.9 + 0.1 * s})`,
			}}
		>
			{text}
		</div>
	);
};

const StepTag: React.FC<{n: string; label: string}> = ({n, label}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: C.white}}>
		<span style={{background: C.green, color: C.black, borderRadius: 8, padding: '6px 12px', letterSpacing: 2}}>{n}</span>
		{label}
	</div>
);

/** The same studio car, re-framed per shot (hard cuts) — wide, door close-up, front-wheel close-up. */
const CarStage: React.FC<{keys: CamKey[]; dim?: number; sheenFrom: number; reflection?: number}> = ({keys, dim = 1, sheenFrom, reflection = 0.22}) => {
	const frame = useCurrentFrame();
	return (
		<Camera keys={keys}>
			<StudioBg floorY={1230} />
			<div style={{position: 'absolute', inset: 0, filter: `brightness(${dim})`}}>
				<Car id="v3hook" variant="luxury" paint={PAINTS.gunmetal} x={400} y={1230} w={1300} lights={1} beam={0.85} sheen={kf(frame, [sheenFrom, sheenFrom + 70], [-0.25, 1.25], E.soft)} sheenAmt={0.6} reflection={reflection} />
			</div>
		</Camera>
	);
};

/**
 * 0:00–0:10, four beats on one car:
 *  A  0.0–2.0  $750/MONTH · JUST THE PAYMENT (frame one) → EXAMPLE card: + INSURANCE + GAS = $1,150/MO
 *  B  "paying…" door close-up: 01 · PAYMENT  $750/MO
 *  C  "Like…"   front-wheel close-up: 02 · OWNERSHIP COSTS, the costs stack up
 *  D  "And the worst part?" wide again: JUST THE PAYMENT, JUST lights up on "just"
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tB = cue('L1', 'paying', -0.05);
	const tC = cue('L2', 'like', -0.05);
	const tD = cue('L3', undefined, -0.1);
	const tJust = cue('L4', 'just');
	// card beat — fixed so it always lands inside the first two seconds
	const cIns = 14;
	const cGas = 24;
	const cTot = 36;

	const shot = frame < tB ? 'A' : frame < tC ? 'B' : frame < tD ? 'C' : 'D';
	const card = useIn(8, 'snappy');
	const bIn = useIn(tB - 6, 'heavy'); // fully in by the cut
	const total = sp(frame, fps, cTot, 'heavy');
	const just = kf(frame, [tJust - 2, tJust + 10], [0, 1], E.out);

	return (
		<AbsoluteFill style={{background: C.black}}>
			{shot === 'A' && (
				<>
					<CarStage keys={[{at: 0, zoom: 1.04, x: 580, y: 1040}, {at: tB, zoom: 1.0, x: 560, y: 1020}]} dim={kf(frame, [6, 20], [1, 0.75])} sheenFrom={0} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 980, background: 'linear-gradient(180deg, rgba(15,15,16,0.94) 0%, rgba(15,15,16,0.7) 75%, rgba(15,15,16,0) 100%)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 220, textAlign: 'center', fontFamily: FONT}}>
						<div style={{fontWeight: 900, fontSize: 196, lineHeight: 1, letterSpacing: -8, color: C.white}}>
							{usd(FACTS.payment.value)}
							<span style={{fontSize: 74, letterSpacing: 0}}>/MONTH</span>
						</div>
						<div style={{marginTop: 22, fontWeight: 900, fontSize: 90, letterSpacing: -2, color: C.white}}>
							<span style={{color: C.green}}>JUST</span> THE PAYMENT
						</div>
					</div>
					{/* EXAMPLE card: the math, previewed */}
					<div
						style={{
							position: 'absolute',
							left: 90,
							right: 90,
							top: 560,
							padding: '26px 34px 30px',
							borderRadius: 30,
							background: 'rgba(24,24,26,0.96)',
							border: '2px solid rgba(255,255,255,0.18)',
							opacity: card.opacity,
							transform: `translateY(${(1 - card.s) * 30}px)`,
						}}
					>
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
							<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.gray}}>{usd(FACTS.payment.value)} PAYMENT</div>
							<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 5, color: C.black, background: C.white, borderRadius: 10, padding: '8px 16px'}}>EXAMPLE</div>
						</div>
						<div style={{display: 'flex', gap: 18, marginTop: 22}}>
							<Chip text="+ INSURANCE" at={cIns} />
							<Chip text="+ GAS" at={cGas} />
						</div>
						<div
							style={{
								marginTop: 20,
								fontFamily: FONT,
								fontWeight: 900,
								fontSize: 150,
								lineHeight: 1,
								letterSpacing: -6,
								color: C.green,
								opacity: frame < cTot ? 0 : prog(frame, cTot, 4),
								transform: `scale(${1.12 - 0.12 * total})`,
								transformOrigin: '0% 50%',
							}}
						>
							= {usd(FACTS.monthly.value)}
							<span style={{fontSize: 60, letterSpacing: 0, color: C.white}}>/MO</span>
						</div>
					</div>
				</>
			)}
			{shot === 'B' && (
				<>
					<CarStage keys={[{at: tB, zoom: 1.75, x: 560, y: 1080}, {at: tC, zoom: 1.85, x: 600, y: 1080, ease: E.soft}]} sheenFrom={tB} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: 'linear-gradient(180deg, rgba(15,15,16,0.92) 0%, rgba(15,15,16,0) 100%)'}} />
					<div style={{position: 'absolute', left: 90, top: 250}}>
						<StepTag n="01" label="THE PAYMENT" />
						<div style={{marginTop: 26, fontFamily: FONT, fontWeight: 900, fontSize: 210, lineHeight: 1, letterSpacing: -8, color: C.white, opacity: bIn.opacity, transform: `scale(${1.08 - 0.08 * bIn.s})`, transformOrigin: '0% 50%'}}>
							{usd(FACTS.payment.value)}
							<span style={{fontSize: 80, letterSpacing: 0, color: C.gray}}>/MO</span>
						</div>
					</div>
				</>
			)}
			{shot === 'C' && (
				<>
					<CarStage keys={[{at: tC, zoom: 2.1, x: 815, y: 1120}, {at: tD, zoom: 2.0, x: 800, y: 1120, ease: E.soft}]} dim={1.15} sheenFrom={tC - 30} reflection={0} />
					<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,15,16,0.9) 0%, rgba(15,15,16,0.45) 55%, rgba(15,15,16,0) 100%)'}} />
					<div style={{position: 'absolute', left: 90, top: 250}}>
						<StepTag n="02" label="OWNERSHIP COSTS" />
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, marginTop: 40}}>
							<Chip big text="+ INSURANCE" at={tC + 2} />
							<Chip big text="+ GAS" at={cue('L2', 'actually', -0.05)} />
							<Chip big text="+ MAINTENANCE" at={cue('L2', 'crazy', -0.05)} />
						</div>
					</div>
				</>
			)}
			{shot === 'D' && (
				<>
					<CarStage keys={[{at: tD, zoom: 1.0, x: 560, y: 1020}, {at: tJust + 20, zoom: 1.06, x: 600, y: 1030, ease: E.inOut}]} dim={0.6} sheenFrom={tD} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 980, background: 'linear-gradient(180deg, rgba(15,15,16,0.94) 0%, rgba(15,15,16,0.6) 75%, rgba(15,15,16,0) 100%)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: FONT}}>
						<div style={{fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.gray, opacity: prog(frame, cue('L3', 'worst', -0.1), 6)}}>AND THE WORST PART?</div>
						<div style={{marginTop: 34, fontWeight: 900, fontSize: 132, lineHeight: 0.98, letterSpacing: -4, color: C.white, opacity: prog(frame, tJust - 4, 5)}}>
							<span style={{position: 'relative', display: 'inline-block', color: C.green}}>
								JUST
								<span style={{position: 'absolute', left: 0, bottom: 0, height: 12, width: `${just * 100}%`, borderRadius: 6, background: C.green}} />
							</span>{' '}
							THE
							<br />
							PAYMENT.
						</div>
						<div style={{marginTop: 34, display: 'flex', justifyContent: 'center', gap: 16, opacity: prog(frame, cue('L4', 'payment'), 8)}}>
							{['+ INSURANCE ?', '+ GAS ?', '+ MAINTENANCE ?'].map((t) => (
								<div key={t} style={{padding: '10px 20px', borderRadius: 999, border: '3px dashed rgba(255,255,255,0.6)', fontFamily: FONT, fontWeight: 800, fontSize: 32, color: C.white}}>
									{t}
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</AbsoluteFill>
	);
};
