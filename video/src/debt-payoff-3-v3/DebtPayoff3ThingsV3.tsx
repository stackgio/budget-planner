import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {easeIn, easeIO, easeOut, lerp, pop, shake, tw} from '../debt-story/anim';
import {Watermark} from '../debt-story/Stage';
import {C, FONT} from '../debt-story/theme';
import {at as A, TOTAL_FRAMES} from '../debt-payoff-3/timing';
import {count, money} from '../debt-payoff-3/ui';
import type {DP3Props} from '../debt-payoff-3/DebtPayoff3Things';
import {Dip, Flash, Grain, Shot, StillShot, Type, stock} from '../debt-payoff-3-v2/cine';
import {ALT_PER_WEEK, CARD_PAYMENT, CARD_PURCHASE, CARD_START, ENDING_BALANCE, FUND, FUND_GOAL, HOOK_BALANCE, PER_WEEK, WEEKS} from '../debt-payoff-3-v2/numbers';

/**
 * V3 — cinematic documentary (V2 footage) + V1's financial explanations, rebuilt as graphics that
 * live inside the shot: frosted glass that shows the footage through it, parallax-tracked to the
 * camera move, and panels that carry across cuts. Same script, timing and figures as V1/V2.
 * Readability comes from local gradients behind type, not from dimming whole shots.
 */

// Brighter grades than V2 (V2 measured: repair 36, outcome 41, purchase 47, defocused jar 49 mean luma).
const G = {
	base: 'contrast(1.08) saturate(0.9) brightness(1.0)',
	warm: 'contrast(1.08) saturate(1.0) brightness(1.02)',
	lift: 'contrast(1.05) saturate(0.9) brightness(1.75)', // very dark repair source
	soft: (px: number) => `contrast(1.05) saturate(0.85) brightness(0.92) blur(${px}px)`,
};

// ---------- camera-tracked graphics ----------

type Move = {z0: number; z1: number; x0?: number; x1?: number; y0?: number; y1?: number; fx?: number; fy?: number};

/** Same move curve as the footage (cine.Shot), applied to graphics at a parallax `depth` (1 = locked to the plate). */
const Track: React.FC<{from: number; to: number; move: Move; depth?: number; children: React.ReactNode}> = ({from, to, move, depth = 0.6, children}) => {
	const f = useCurrentFrame();
	const t = easeIO(tw(f, from, to, 0, 1, (x) => x));
	const z = 1 + (lerp(move.z0, move.z1, t) - move.z0) * depth;
	const x = lerp(move.x0 ?? 0, move.x1 ?? 0, t) * depth;
	const y = lerp(move.y0 ?? 0, move.y1 ?? 0, t) * depth;
	return (
		<AbsoluteFill style={{transformOrigin: `${move.fx ?? 540}px ${move.fy ?? 960}px`, transform: `translate(${x}px, ${y}px) scale(${z})`}}>{children}</AbsoluteFill>
	);
};

/** Frosted glass: the footage stays visible, blurred, behind the numbers. */
const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
	position: 'absolute',
	boxSizing: 'border-box',
	borderRadius: 30,
	clipPath: 'inset(0 round 30px)',
	background: 'linear-gradient(160deg, rgba(14,20,17,0.62) 0%, rgba(8,11,10,0.5) 100%)',
	backdropFilter: 'blur(22px) saturate(1.2)',
	WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
	border: '1.5px solid rgba(255,255,255,0.16)',
	fontFamily: FONT,
	...extra,
});

/** Local darkening behind a block of type (instead of dimming the whole shot). */
const Shade: React.FC<{y0: number; y1: number; o?: number; from?: 'top' | 'bottom'}> = ({y0, y1, o = 0.62, from = 'top'}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			right: 0,
			top: y0,
			height: y1 - y0,
			background: `linear-gradient(${from === 'top' ? 180 : 0}deg, rgba(0,0,0,${o}) 0%, rgba(0,0,0,${o * 0.75}) 55%, rgba(0,0,0,0) 100%)`,
		}}
	/>
);

const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = '#C9CFCC', style}) => (
	<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: 4, color, ...style}}>{children}</div>
);

const win = (f: number, a: number, b: number, fi = 8, fo = 6) => (f < a || f >= b ? 0 : Math.min(tw(f, a, a + fi, 0, 1, easeOut), tw(f, b - fo, b, 1, 0, easeIn)));

// ---------- shot moves (shared by footage and its tracked graphics) ----------

const M = {
	hook: {z0: 1.06, z1: 1.2, fy: 1150},
	three: {z0: 1.18, z1: 1.3, x0: 50, x1: -50},
	jarTitle: {z0: 1.0, z1: 1.1, fy: 1150},
	jarMeter: {z0: 1.24, z1: 1.32, x0: 0, x1: -110, fy: 1100},
	tire: {z0: 1.02, z1: 1.38, fx: 560, fy: 1240},
	repair: {z0: 1.1, z1: 1.2},
	clock: {z0: 1.0, z1: 1.1},
	courier: {z0: 1.06, z1: 1.16, fy: 900},
	parcel: {z0: 1.06, z1: 1.16, fy: 1100},
	weekly: {z0: 1.25, z1: 1.32},
	card3: {z0: 1.32, z1: 1.45, fx: 420},
	purchase: {z0: 1.04, z1: 1.14},
	walk: {z0: 1.04, z1: 1.12},
	golden: {z0: 1.05, z1: 1.14, fx: 700, fy: 700},
	cta: {z0: 1.2, z1: 1.25},
};

const Footage: React.FC = () => (
	<>
		<Shot id="407052217" from={0} to={A('three')} at={0.5} move={M.hook} grade={G.base} />
		<Shot id="314073589" from={A('three')} to={A('n1')} at={7} enter="whip" move={M.three} grade={G.base} />
		<Shot id="216482306" from={A('n1')} to={A('amounts')} at={2} move={M.jarTitle} grade="contrast(1.1) saturate(0.9) brightness(1.15)" />
		<Shot id="216482306" from={A('amounts')} to={A('lastThing')} at={7.5} move={M.jarMeter} grade="contrast(1.1) saturate(0.9) brightness(1.15)" />
		<StillShot src={stock('477125265', 'jpg')} from={A('lastThing')} to={A('bill')} move={M.tire} grade={G.base} />
		<Shot id="315023474" from={A('bill')} to={A('forcing')} at={3} move={M.repair} grade={G.lift} />
		{/* outcome split is drawn by OutcomeSplit */}
		<Shot id="1028222252" from={A('n2')} to={A('shifts')} at={1} enter="whip" move={M.clock} grade="contrast(1.1) brightness(1.15)" />
		<Shot id="1332873009" from={A('shifts')} to={A('selling')} at={1} move={M.courier} grade={G.base} />
		<Shot id="230058613" from={A('selling')} to={A('fifty')} at={1} move={M.parcel} grade={G.base} />
		<Shot id="230058613" from={A('fifty')} to={A('n3')} at={5} move={M.weekly} grade={G.soft(3)} />
		<Shot id="314073589" from={A('n3')} to={A('turning')} at={9} move={M.card3} grade={G.base} />
		<Shot id="480504243" from={A('turning')} to={A('working')} at={2} move={M.purchase} grade="contrast(1.08) saturate(0.95) brightness(1.2)" />
		<Shot id="290773630" from={A('working')} to={A('notJust')} at={1} enter="fade" move={M.walk} grade="contrast(1.1) saturate(0.75) brightness(0.95)" />
		<Shot id="573461741" from={A('notJust')} to={A('whats')} at={0} enter="fade" move={M.golden} grade={G.warm} />
		<Shot id="573461741" from={A('whats')} to={TOTAL_FRAMES} at={4} enter="fade" move={M.cta} grade={G.soft(12)} dim={0.35} />
	</>
);

// ---------- HOOK ----------

const Hook: React.FC = () => {
	const f = useCurrentFrame();
	const end = A('three');
	if (f >= end) return null;
	const bal = count(f, 0, 22, 7350, HOOK_BALANCE);
	const o = tw(f, end - 6, end, 1, 0);
	return (
		<>
			<Shade y0={0} y1={900} o={0.7} />
			<Shade y0={960} y1={1920} o={0.55} from="bottom" />
			<Type from={-14} to={end} y={200} stagger={3} lines={[{t: 'PAYING', size: 190}, {t: 'OFF', size: 190}, {t: 'DEBT?', size: 240, c: C.green}]} />
			{/* the example balance sits on the statement, tilted with the paper */}
			<Track from={0} to={end} move={M.hook} depth={0.7}>
				<div style={{...glass({left: 84, top: 1030, width: 660, height: 280, padding: '30px 40px'}), opacity: o, transform: 'perspective(1400px) rotateX(10deg) rotateZ(-2deg)'}}>
					<Kicker color="#F2B3B3">TOTAL DEBT · EXAMPLE</Kicker>
					<div style={{fontWeight: 900, fontSize: 150, lineHeight: 1.05, letterSpacing: -5, color: C.white, fontVariantNumeric: 'tabular-nums'}}>{money(bal)}</div>
					<div style={{height: 10, width: `${100 * tw(f, 0, 22, 0.6, 1, easeOut)}%`, background: C.red, borderRadius: 5, marginTop: 6}} />
				</div>
			</Track>
		</>
	);
};

// ---------- STEP 1: savings meter rises beside the jar ----------

const TUBE = {x: 720, y: 640, w: 96, h: 600};

const SavingsMeter: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('amounts');
	const b = A('lastThing');
	if (f < a - 2 || f >= b) return null;
	const s0 = A('amounts', 1) - 4;
	const bal = count(f, s0, s0 + 26, 0, FUND);
	const goal = tw(f, A('amounts', 3), A('amounts', 3) + 10, 0, 1, easeOut);
	const o = win(f, a - 2, b, 8, 5);
	const land = Math.sin(Math.PI * tw(f, s0 + 26, s0 + 36));
	const fill = bal / FUND_GOAL;
	return (
		<div style={{opacity: o}}>
			<Shade y0={0} y1={640} o={0.7} />
			<div style={{position: 'absolute', left: 84, top: 250, fontFamily: FONT}}>
				<Kicker color={C.green}>EMERGENCY SAVINGS</Kicker>
				<div style={{fontWeight: 900, fontSize: 230, lineHeight: 1, letterSpacing: -9, color: bal >= FUND ? C.green : C.white, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + 0.04 * land})`, transformOrigin: 'left center'}}>{money(bal)}</div>
			</div>
			<Track from={a} to={b} move={M.jarMeter} depth={0.55}>
				{/* glass tube meter, $0 → $1,000 */}
				<div style={{...glass({left: TUBE.x, top: TUBE.y, width: TUBE.w, height: TUBE.h, borderRadius: 48}), clipPath: 'inset(0 round 48px)'}}>
					<div style={{position: 'absolute', left: 10, right: 10, bottom: 10, height: (TUBE.h - 20) * fill, borderRadius: 38, background: `linear-gradient(0deg, ${C.greenDeep}, ${C.green})`}} />
					{/* $500–$1,000 goal band */}
					<div style={{position: 'absolute', left: 6, right: 6, top: 6, height: TUBE.h / 2 - 6, borderRadius: 42, border: `3px dashed rgba(57,255,136,${0.85 * goal})`}} />
				</div>
				{[0, 0.5, 1].map((k) => {
					const lit = (k === 0.5 && bal >= FUND) || (k === 1 && goal > 0.5);
					return (
						<div key={k} style={{position: 'absolute', left: TUBE.x + TUBE.w + 18, top: TUBE.y + TUBE.h * (1 - k) - 26, fontFamily: FONT, fontWeight: 900, fontSize: 44, color: lit ? C.green : '#D5DAD8', textShadow: '0 3px 14px rgba(0,0,0,0.85)'}}>
							{money(k * FUND_GOAL)}
						</div>
					);
				})}
			</Track>
			<Shade y0={1180} y1={1920} o={0.6} from="bottom" />
			<div style={{position: 'absolute', left: 84, top: 1330, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.white, opacity: goal, textShadow: '0 3px 16px rgba(0,0,0,0.9)'}}>
				Goal: <span style={{color: C.green}}>{money(FUND)}–{money(FUND_GOAL)}</span> set aside
			</div>
		</div>
	);
};

// ---------- STEP 1: same bill, two outcomes (split screen) ----------

const OutcomeSplit: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('forcing');
	const b = A('n2');
	if (f < a || f >= b) return null;
	const split = tw(f, A('intoDebt') - 12, A('intoDebt') - 1, 0, 1, easeIO);
	const top = lerp(1920, 960, split);
	const redIn = pop(f, a + 4, 14, 190, 0.8);
	const redChip = pop(f, a + 14, 12, 220, 0.7);
	const greenIn = pop(f, A('intoDebt') - 4, 14, 190, 0.8);
	const greenChip = pop(f, A('intoDebt') + 3, 12, 220, 0.7);
	const sh = shake(f, a + 14, 12, 7);
	return (
		<AbsoluteFill>
			{/* top: the tyre — no savings */}
			<AbsoluteFill style={{clipPath: `inset(0 0 ${1920 - top}px 0)`}}>
				<StillShot src={stock('477125265', 'jpg')} from={a} to={b} move={{z0: 1.3, z1: 1.36, fx: 560, fy: 1240}} grade="contrast(1.08) saturate(0.85) brightness(0.92)" />
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)'}} />
			</AbsoluteFill>
			{/* bottom: the jar — $500 saved */}
			<AbsoluteFill style={{clipPath: `inset(${top}px 0 0 0)`}}>
				<Shot id="216482306" from={a} to={b} at={10} move={{z0: 1.2, z1: 1.26, fy: 1300}} grade="contrast(1.1) saturate(0.9) brightness(1.1)" />
				<AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(0,30,12,0.55) 0%, rgba(0,0,0,0.1) 100%)'}} />
			</AbsoluteFill>
			{split > 0 ? <div style={{position: 'absolute', left: 0, width: 1080 * split, top: top - 3, height: 6, background: C.white}} /> : null}

			<div style={{position: 'absolute', left: 84, top: lerp(560, 250, split) + sh.y, fontFamily: FONT, opacity: Math.min(1, redIn * 1.5), transform: `translateX(${sh.x}px)`}}>
				<Kicker color="#FF8C8C">NO SAVINGS</Kicker>
				<div style={{fontWeight: 900, fontSize: 100, lineHeight: 1, letterSpacing: -3, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>IT GOES ON</div>
				<div style={{fontWeight: 900, fontSize: 100, lineHeight: 1, letterSpacing: -3, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>THE CARD.</div>
				<div style={{display: 'inline-block', marginTop: 24, padding: '10px 26px', borderRadius: 999, background: C.red, color: C.bg, fontWeight: 900, fontSize: 52, transform: `scale(${0.5 + 0.5 * redChip})`, transformOrigin: 'left center', opacity: Math.min(1, redChip * 2)}}>↑ NEW DEBT</div>
			</div>
			<div style={{position: 'absolute', left: 84, top: 1030, fontFamily: FONT, opacity: Math.min(1, greenIn * 1.5), transform: `translateY(${(1 - greenIn) * 40}px)`}}>
				<Kicker color={C.green}>{money(FUND)} SAVED</Kicker>
				<div style={{fontWeight: 900, fontSize: 100, lineHeight: 1, letterSpacing: -3, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>PAID FROM</div>
				<div style={{fontWeight: 900, fontSize: 100, lineHeight: 1, letterSpacing: -3, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>SAVINGS.</div>
				<div style={{display: 'inline-block', marginTop: 24, padding: '10px 26px', borderRadius: 999, background: C.green, color: C.bg, fontWeight: 900, fontSize: 52, transform: `scale(${0.5 + 0.5 * greenChip})`, transformOrigin: 'left center', opacity: Math.min(1, greenChip * 2)}}>✓ NO NEW DEBT</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- STEP 2: income breakdown that carries across the cuts ----------

const SOURCES = [
	{id: 'overtime', k: 1, label: 'OVERTIME', w: 11},
	{id: 'shifts', k: 2, label: 'EXTRA SHIFTS', w: 11},
	{id: 'doordash', k: 1, label: 'DELIVERY', w: 11},
	{id: 'selling', k: 1, label: 'SELLING STUFF', w: 11},
];
const BASE_PAY = 56; // % of the bar; proportions are illustrative, no amounts shown

const IncomeBar: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('couldMean');
	const b = A('fifty');
	if (f < a - 4 || f >= b) return null;
	const o = win(f, a - 4, b, 10, 6);
	const grow = SOURCES.map((s) => tw(f, A(s.id, s.k) - 3, A(s.id, s.k) + 7, 0, 1, easeOut));
	const cur = [...SOURCES].reverse().find((s, i) => f >= A(s.id, s.k) - 3);
	const curIdx = cur ? SOURCES.indexOf(cur) : -1;
	const labelP = cur ? tw(f, A(cur.id, cur.k) - 3, A(cur.id, cur.k) + 6, 0, 1, easeOut) : 0;
	return (
		<div style={{opacity: o}}>
			<Shade y0={940} y1={1920} o={0.6} from="bottom" />
			<div style={{...glass({left: 72, top: 1040, width: 936, height: 400, padding: '28px 36px'}), transform: `translateY(${(1 - o) * 40}px)`}}>
				<Kicker style={{whiteSpace: 'nowrap'}}>MONTHLY INCOME</Kicker>
				<div style={{height: 76, fontWeight: 900, fontSize: 66, lineHeight: '76px', color: C.green, opacity: labelP, transform: `translateY(${(1 - labelP) * 20}px)`, whiteSpace: 'nowrap'}}>{cur ? `+ ${cur.label}` : ''}</div>
				<div style={{marginTop: 14, height: 96, borderRadius: 18, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)'}}>
					<div style={{width: `${BASE_PAY}%`, background: '#55605C', display: 'flex', alignItems: 'center', paddingLeft: 22, fontWeight: 900, fontSize: 40, color: C.white, whiteSpace: 'nowrap'}}>YOUR PAY</div>
					{SOURCES.map((s, i) => (
						<div key={s.id} style={{width: `${s.w * grow[i]}%`, background: i % 2 ? C.greenDeep : C.green, borderLeft: grow[i] > 0 ? `3px solid ${C.bg}` : 'none', opacity: i === curIdx ? 1 : 0.85}} />
					))}
				</div>
				<div style={{marginTop: 22, fontWeight: 700, fontSize: 40, color: '#D5DAD8'}}>More coming in = more toward debt</div>
			</div>
		</div>
	);
};

// ---------- STEP 2: $50 a week staircase ----------

const COLS = [140, 350, 560, 770];
const COL_W = 180;
const BASE = 1230;
const BLK = 92;

const Weekly: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('fifty');
	const b = A('n3');
	if (f < a || f >= b) return null;
	const w0 = A('fifty', 3) - 4;
	const wk = (k: number) => w0 + k * 12;
	const phase2 = A('difference') - 4;
	const head1 = win(f, a, phase2, 8, 6);
	const alt = tw(f, A('difference', 2), A('difference', 2) + 10, 0, 1, easeOut);
	return (
		<>
			<Shade y0={0} y1={760} o={0.65} />
			<Shade y0={1180} y1={1920} o={0.55} from="bottom" />
			{head1 > 0 ? (
				<div style={{position: 'absolute', left: 84, top: 240, fontFamily: FONT, opacity: head1}}>
					<div style={{fontWeight: 900, fontSize: 250, lineHeight: 0.95, letterSpacing: -9, color: C.green}}>+{money(PER_WEEK)}</div>
					<div style={{fontWeight: 900, fontSize: 110, lineHeight: 1, letterSpacing: -3, color: C.white}}>A WEEK</div>
				</div>
			) : null}
			<Type from={phase2} to={b} y={240} stagger={4} lines={[{t: `+${money(PER_WEEK * WEEKS)}`, size: 250, c: C.green}, {t: `IN ${WEEKS} WEEKS`, size: 110}]} />
			<Track from={a} to={b} move={M.weekly} depth={0.5}>
				{COLS.map((x, c) => (
					<div key={c}>
						{Array.from({length: c + 1}, (_, k) => {
							const p = pop(f, wk(c) + k * 2, 14, 210, 0.75);
							if (p <= 0) return null;
							const isNew = k === c;
							return (
								<div
									key={k}
									style={{
										...glass({left: x, top: BASE - (k + 1) * (BLK + 8), width: COL_W, height: BLK, borderRadius: 16}),
										clipPath: 'inset(0 round 16px)',
										background: isNew ? 'rgba(57,255,136,0.92)' : 'rgba(57,255,136,0.28)',
										border: `2px solid ${C.green}`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: 900,
										fontSize: 44,
										color: isNew ? C.bg : C.white,
										opacity: Math.min(1, p * 1.5),
										transform: `translateY(${(1 - p) * -120}px)`,
									}}
								>
									{money(PER_WEEK)}
								</div>
							);
						})}
						<div style={{position: 'absolute', left: x, width: COL_W, top: BASE + 16, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: C.white, opacity: tw(f, wk(c), wk(c) + 6), textShadow: '0 3px 12px rgba(0,0,0,0.9)'}}>
							WEEK {c + 1}
						</div>
					</div>
				))}
			</Track>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1360, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.white, opacity: alt, textShadow: '0 3px 16px rgba(0,0,0,0.9)'}}>
				At <span style={{color: C.green}}>{money(ALT_PER_WEEK)}</span> a week: <span style={{color: C.green}}>{money(ALT_PER_WEEK * WEEKS)}</span>
			</div>
		</>
	);
};

// ---------- STEP 3: card statement that carries across the cut ----------

const CardStatement: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('point') - 4;
	const b = A('working') + 4; // dissolves over the first frames of the next shot
	if (f < a || f >= b) return null;
	const o = win(f, a, b, 10, 8);
	const pay = A('paying300', 2) - 2;
	const buy = A('charging', 2) - 2;
	const bal = f < buy + 6 ? count(f, pay + 8, pay + 26, CARD_START, CARD_START - CARD_PAYMENT) : count(f, buy + 6, buy + 18, CARD_START - CARD_PAYMENT, CARD_START - CARD_PAYMENT + CARD_PURCHASE);
	const tone = f >= buy + 6 ? C.red : f >= pay + 8 ? C.green : C.white;
	const payChip = tw(f, pay - 2, pay + 10, 0, 1, easeIO);
	const buyChip = tw(f, buy - 2, buy + 10, 0, 1, easeIO);
	const sh = shake(f, buy + 10, 14, 8);
	const back = pop(f, buy + 16, 12, 200, 0.7);
	const rows = [
		{at: a + 6, l: 'Starting balance', d: '', v: CARD_START, c: C.white},
		{at: pay + 8, l: 'Payment', d: `−${money(CARD_PAYMENT)}`, v: CARD_START - CARD_PAYMENT, c: C.green},
		{at: buy + 6, l: 'New purchase', d: `+${money(CARD_PURCHASE)}`, v: CARD_START - CARD_PAYMENT + CARD_PURCHASE, c: C.red},
	];
	// slight 3D tilt that follows the camera, so the statement sits in the shot
	const tilt = lerp(-4, 3, tw(f, a, b, 0, 1, easeIO));
	return (
		<div style={{opacity: o}}>
			<Shade y0={0} y1={560} o={0.55} />
			{/* chips fly in: the payment from the left, the purchase from the phone */}
			{payChip > 0 && f < pay + 24 ? (
				<div style={{position: 'absolute', top: 440, left: lerp(-420, 540, payChip), transform: 'translateX(-50%)', padding: '12px 30px', borderRadius: 999, background: C.green, color: C.bg, fontFamily: FONT, fontWeight: 900, fontSize: 54, whiteSpace: 'nowrap', opacity: tw(f, pay + 16, pay + 24, 1, 0)}}>
					−{money(CARD_PAYMENT)} PAYMENT
				</div>
			) : null}
			{buyChip > 0 && f < buy + 24 ? (
				<div style={{position: 'absolute', top: lerp(250, 440, buyChip), left: lerp(820, 540, buyChip), transform: `translateX(-50%) scale(${lerp(0.6, 1, buyChip)})`, padding: '12px 30px', borderRadius: 999, background: C.red, color: C.bg, fontFamily: FONT, fontWeight: 900, fontSize: 54, whiteSpace: 'nowrap', opacity: tw(f, buy + 16, buy + 24, 1, 0)}}>
					+{money(CARD_PURCHASE)} NEW PURCHASE
				</div>
			) : null}
			<div
				style={{
					...glass({left: 72, top: 560, width: 936, height: 720, padding: '34px 44px'}),
					transform: `perspective(1600px) rotateY(${tilt}deg) translate(${sh.x}px, ${sh.y}px)`,
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<Kicker>CARD BALANCE</Kicker>
					<div style={{fontWeight: 900, fontSize: 42, color: C.bg, background: C.red, borderRadius: 999, padding: '6px 20px', opacity: Math.min(1, back * 1.5), transform: `scale(${0.6 + 0.4 * back})`}}>BACK TO {money(CARD_START)}</div>
				</div>
				<div style={{fontWeight: 900, fontSize: 190, lineHeight: 1.02, letterSpacing: -7, color: tone, fontVariantNumeric: 'tabular-nums'}}>{money(bal)}</div>
				<div style={{marginTop: 8, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
					<div style={{height: '100%', width: `${(100 * bal) / CARD_START}%`, background: C.red, borderRadius: 13}} />
				</div>
				<div style={{marginTop: 22}}>
					{rows.map((r, i) => {
						const p = tw(f, r.at, r.at + 8, 0, 1, easeOut);
						return (
							<div key={i} style={{display: 'flex', alignItems: 'baseline', height: 74, borderTop: i ? '2px solid rgba(255,255,255,0.1)' : 'none', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, fontSize: 44}}>
								<div style={{flex: 1, fontWeight: 700, color: '#D5DAD8', paddingTop: 12}}>{r.l}</div>
								<div style={{width: 170, textAlign: 'right', fontWeight: 900, color: r.c}}>{r.d}</div>
								<div style={{width: 210, textAlign: 'right', fontWeight: 900, color: C.white, fontVariantNumeric: 'tabular-nums'}}>{money(r.v)}</div>
							</div>
						);
					})}
				</div>
				<div style={{marginTop: 14, fontWeight: 700, fontSize: 34, color: '#C9CFCC'}}>Simplified example. Excludes interest and fees.</div>
			</div>
		</div>
	);
};

// ---------- ENDING: example balance slowly paid down ----------

const PayDown: React.FC = () => {
	const f = useCurrentFrame();
	const a = A('working');
	const b = A('notJust');
	if (f < a || f >= b) return null;
	const o = win(f, a + 2, b, 10, 5);
	const e0 = a + 6;
	const e1 = b - 4;
	const v = f >= e1 ? ENDING_BALANCE : Math.round(tw(f, e0, e1, HOOK_BALANCE, ENDING_BALANCE, easeIO));
	return (
		<div style={{opacity: o}}>
			<Shade y0={980} y1={1920} o={0.6} from="bottom" />
			<Track from={a} to={b} move={M.walk} depth={0.4}>
				<div style={{...glass({left: 72, top: 1090, width: 760, height: 300, padding: '28px 40px'})}}>
					<Kicker color={C.green}>PAYING IT DOWN · EXAMPLE</Kicker>
					<div style={{fontWeight: 900, fontSize: 140, lineHeight: 1.05, letterSpacing: -5, color: C.white, fontVariantNumeric: 'tabular-nums'}}>{money(v)}</div>
					<div style={{marginTop: 6, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
						<div style={{height: '100%', width: `${(100 * v) / HOOK_BALANCE}%`, background: C.red, borderRadius: 7}} />
					</div>
				</div>
			</Track>
		</div>
	);
};

// ---------- titles ----------

const Titles: React.FC = () => {
	const f = useCurrentFrame();
	const chapter = (n: string, from: number, to: number, lines: {t: string; size: number; c?: string}[]) => (
		<>
			{f >= from && f < to ? (
				<>
					<Shade y0={0} y1={520} o={0.55} />
					<Shade y0={900} y1={1920} o={0.6} from="bottom" />
				</>
			) : null}
			<Type from={from} to={to} y={240} lines={[{t: n, size: 130, c: C.green}]} />
			<Type from={from + 6} to={to} y={1000} stagger={5} lines={lines} />
		</>
	);
	return (
		<>
			{/* 3 THINGS */}
			{f >= A('three') && f < A('n1') ? <Shade y0={960} y1={1920} o={0.65} from="bottom" /> : null}
			<Type from={A('three') - 2} to={A('n1')} x={50} y={170} lines={[{t: '3', size: 820, outline: true, c: C.white}]} shadow={false} />
			<Type from={A('three', 1)} to={A('n1')} y={1060} stagger={5} lines={[{t: 'THINGS', size: 190}, {t: "I'D FOCUS ON", size: 84, c: C.green, w: 800, ls: 1}]} />

			{chapter('01', A('n1'), A('amounts') - 2, [{t: 'EMERGENCY', size: 134}, {t: 'FUND', size: 236}])}

			{f >= A('lastThing') && f < A('forcing') ? <Shade y0={0} y1={720} o={0.55} /> : null}
			<Type from={A('tire', 2) - 3} to={A('bill')} y={220} stagger={3} lines={[{t: 'FLAT', size: 230}, {t: 'TIRE.', size: 230}]} />
			<Type from={A('bill', 1) - 3} to={A('forcing')} y={220} stagger={3} lines={[{t: 'SURPRISE', size: 170}, {t: 'BILL.', size: 250, c: C.red}]} />

			{chapter('02', A('n2'), A('couldMean'), [{t: 'EXTRA', size: 210}, {t: 'INCOME', size: 210}])}
			{chapter('03', A('n3'), A('point') - 4, [{t: 'STOP ADDING', size: 140}, {t: 'NEW DEBT.', size: 176, c: C.green}])}

			{f >= A('notJust') && f < A('whats') ? <Shade y0={0} y1={900} o={0.6} /> : null}
			<Type from={A('notJust') - 2} to={A('whats')} y={250} stagger={4} lines={[{t: 'PAYING IT OFF', size: 118}, {t: 'IS ONE THING.', size: 118}]} />
			<Type from={A('changing') - 2} to={A('whats')} y={540} stagger={4} lines={[{t: 'STAYING OUT', size: 140, c: C.green}, {t: 'IS THE GOAL.', size: 140, c: C.green}]} />

			<Type from={A('whats') - 2} to={TOTAL_FRAMES + 1} x={0} width={1080} align="center" y={620} stagger={4} exit="none" lines={[{t: "WHAT'S YOUR", size: 128}, {t: 'BIGGEST DEBT', size: 128}, {t: 'STRUGGLE?', size: 168, c: C.green}]} />
		</>
	);
};

const SFX: [number, string, number][] = [
	[0, 'thud', 0.22],
	[A('three') - 6, 'whoosh', 0.22],
	[A('n1'), 'thud', 0.3],
	[A('amounts', 1) + 22, 'confirm', 0.2],
	[A('tire', 1), 'hiss', 0.3],
	[A('bill', 1), 'paper', 0.3],
	[A('forcing') + 14, 'alert', 0.18],
	[A('intoDebt') + 3, 'confirm', 0.22],
	[A('n2') - 6, 'whoosh', 0.22],
	[A('overtime', 1) - 3, 'pop', 0.14],
	[A('doordash', 1) - 3, 'pop', 0.14],
	[A('fifty', 3) + 36, 'pop', 0.16],
	[A('difference') - 4, 'confirm', 0.2],
	[A('n3'), 'thud', 0.3],
	[A('paying300', 2) + 6, 'confirm', 0.2],
	[A('charging', 2) + 8, 'alert', 0.22],
	[A('changing'), 'chime', 0.2],
];

const DraftBadge: React.FC = () => (
	<div style={{position: 'absolute', left: 40, top: 60, padding: '8px 16px', borderRadius: 10, border: '2px solid #FF9A3D', color: '#FF9A3D', fontFamily: FONT, fontWeight: 800, fontSize: 22, letterSpacing: 1.5, background: 'rgba(0,0,0,0.6)'}}>
		V3 PREVIEW · TEMP TIMING · NO VOICEOVER
	</div>
);

export const DebtPayoff3ThingsV3: React.FC<DP3Props> = ({voiceover, draft}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Footage />
		<OutcomeSplit />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 860px 1250px at 540px 900px, transparent 62%, rgba(0,0,0,0.5) 100%)'}} />
		<Flash at={A('n1')} />
		<Dip at={A('n3')} len={6} />
		<Hook />
		<SavingsMeter />
		<IncomeBar />
		<Weekly />
		<CardStatement />
		<PayDown />
		<Titles />
		<Grain amt={0.06} />
		<Watermark />
		{draft ? <DraftBadge /> : null}
		{voiceover ? <Audio src={staticFile(voiceover)} /> : null}
		{SFX.map(([f, name, vol], i) => (
			<Sequence key={i} from={Math.max(0, f)} durationInFrames={36} name={`sfx ${name}`}>
				<Audio src={staticFile(`debt-story/sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
