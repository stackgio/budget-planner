import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {easeIO, easeOut, pop, tw} from '../debt-story/anim';
import {Watermark} from '../debt-story/Stage';
import {C, FONT} from '../debt-story/theme';
import {at as A, TOTAL_FRAMES} from '../debt-payoff-3/timing';
import {count, money} from '../debt-payoff-3/ui';
import type {DP3Props} from '../debt-payoff-3/DebtPayoff3Things';
import {Dip, Flash, Grain, Kick, Label, Scrims, Shot, SparseCaptions, StillShot, Type, stock} from './cine';

import {ALT_PER_WEEK, CARD_PAYMENT, CARD_PURCHASE, CARD_START, ENDING_BALANCE, FUND, FUND_GOAL, HOOK_BALANCE, PER_WEEK, WEEKS} from './numbers';

const BLUR = (px: number) => `contrast(1.1) saturate(0.7) brightness(0.8) blur(${px}px)`;

/** Phrases that get a caption: only lines with no headline already saying it. */
const CAPTIONED = ['help', 'lastThing', 'couldMean', 'point', 'towardCard', 'turning', 'working', 'debtFree', 'learning'];

const Footage: React.FC = () => (
	<>
		{/* HOOK — bank statement + calculator, slow push */}
		<Shot id="407052217" from={0} to={A('three')} at={0.5} move={{z0: 1.08, z1: 1.22, fy: 1150}} />
		{/* "three things" — whip to a card macro */}
		<Shot id="314073589" from={A('three')} to={A('n1')} at={7} enter="whip" move={{z0: 1.18, z1: 1.3, x0: 50, x1: -50}} dim={0.3} />
		{/* STEP 1 — coins into a jar */}
		<Shot id="216482306" from={A('n1')} to={A('amounts')} at={2} move={{z0: 1.0, z1: 1.12, fy: 1150}} />
		<Shot id="216482306" from={A('amounts')} to={A('lastThing')} at={8.5} move={{z0: 1.25, z1: 1.32}} grade={BLUR(5)} dim={0.45} />
		{/* the flat tyre (still, Ken Burns into the tyre) */}
		<StillShot src={stock('477125265', 'jpg')} from={A('lastThing')} to={A('bill')} move={{z0: 1.02, z1: 1.38, fx: 560, fy: 1240}} />
		{/* the repair */}
		<Shot id="315023474" from={A('bill')} to={A('forcing')} at={3} move={{z0: 1.12, z1: 1.22}} grade="contrast(1.1) saturate(0.85) brightness(1.55)" />
		<StillShot src={stock('477125265', 'jpg')} from={A('forcing')} to={A('n2')} move={{z0: 1.45, z1: 1.5, fx: 560, fy: 1240}} grade={BLUR(9)} dim={0.42} />
		{/* STEP 2 — clock, courier, parcel */}
		<Shot id="1028222252" from={A('n2')} to={A('shifts')} at={1} enter="whip" move={{z0: 1.0, z1: 1.1}} grade="contrast(1.15) brightness(0.95)" />
		<Shot id="1332873009" from={A('shifts')} to={A('selling')} at={1} move={{z0: 1.06, z1: 1.16, fy: 900}} grade="contrast(1.12) saturate(0.75) brightness(0.82)" />
		<Shot id="230058613" from={A('selling')} to={A('fifty')} at={1} move={{z0: 1.08, z1: 1.18, fy: 1100}} grade="contrast(1.15) saturate(0.7) brightness(0.72)" />
		<Shot id="230058613" from={A('fifty')} to={A('n3')} at={5} move={{z0: 1.3, z1: 1.36}} grade={BLUR(7)} dim={0.6} />
		{/* STEP 3 — card macro, then the purchase */}
		<Shot id="314073589" from={A('n3')} to={A('turning')} at={9} move={{z0: 1.35, z1: 1.5, fx: 420}} dim={(f) => 0.3 + 0.3 * tw(f, A('point') - 6, A('point') + 6)} />
		<Shot id="480504243" from={A('turning')} to={A('working')} at={2} move={{z0: 1.06, z1: 1.16}} dim={0.42} />
		{/* ENDING — walking forward, then golden hour */}
		<Shot id="290773630" from={A('working')} to={A('notJust')} at={1} enter="fade" move={{z0: 1.04, z1: 1.12}} grade="contrast(1.12) saturate(0.6) brightness(0.72)" />
		<Shot id="573461741" from={A('notJust')} to={A('whats')} at={0} enter="fade" move={{z0: 1.05, z1: 1.14, fx: 700, fy: 700}} grade="contrast(1.12) saturate(0.95) brightness(0.85)" />
		<Shot id="573461741" from={A('whats')} to={TOTAL_FRAMES} at={4} enter="fade" move={{z0: 1.2, z1: 1.25}} grade={BLUR(14)} dim={0.6} />
	</>
);

/** Big money figure with a kicker; counts and colours are driven by the caller. */
const Money: React.FC<{v: number; color?: string; y: number; size?: number; kicker?: string; kc?: string; o?: number; scale?: number}> = ({
	v,
	color = C.white,
	y,
	size = 250,
	kicker,
	kc = C.gray,
	o = 1,
	scale = 1,
}) => (
	<div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, opacity: o}}>
		{kicker ? <div style={{fontWeight: 800, fontSize: 30, letterSpacing: 6, color: kc, textShadow: '0 3px 18px rgba(0,0,0,0.8)'}}>{kicker}</div> : null}
		<div
			style={{
				fontWeight: 900,
				fontSize: size,
				lineHeight: 1,
				letterSpacing: -size * 0.04,
				color,
				fontVariantNumeric: 'tabular-nums',
				textShadow: '0 10px 60px rgba(0,0,0,0.6)',
				transform: `scale(${scale})`,
			}}
		>
			{money(v)}
		</div>
	</div>
);

const Chip: React.FC<{text: string; color: string; y: number; p: number}> = ({text, color, y, p}) => (
	<div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2)}}>
		<div style={{padding: '12px 28px', border: `3px solid ${color}`, borderRadius: 999, color, fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: 1, background: 'rgba(0,0,0,0.45)', transform: `translateY(${(1 - p) * 30}px)`}}>
			{text}
		</div>
	</div>
);

const Graphics: React.FC = () => {
	const f = useCurrentFrame();

	// hook balance (illustrative) — already rolling on frame 0
	const hookBal = count(f, 0, 22, 7350, HOOK_BALANCE);
	const hookO = tw(f, A('three') - 6, A('three'), 1, 0);

	// step 1 savings $0 → $500
	const s0 = A('amounts', 1) - 4;
	const fund = count(f, s0, s0 + 24, 0, FUND);
	const fundIn = tw(f, A('amounts') - 2, A('amounts') + 8, 0, 1, easeOut);
	const goal = tw(f, A('amounts', 3), A('amounts', 3) + 10, 0, 1, easeOut);
	const fundO = f >= A('amounts') - 2 && f < A('lastThing') ? fundIn * tw(f, A('lastThing') - 5, A('lastThing'), 1, 0) : 0;

	// step 2 weekly blocks
	const w0 = A('fifty', 3) - 4;
	const weeksLit = [0, 1, 2, 3].map((k) => tw(f, w0 + k * 12, w0 + k * 12 + 6, 0, 1, easeOut));
	const phase2 = A('difference') - 4;

	// step 3 balance
	const pay = A('paying300', 2) - 2;
	const buy = A('charging', 2) - 2;
	const bal = f < buy + 8 ? count(f, pay + 8, pay + 26, CARD_START, CARD_START - CARD_PAYMENT) : count(f, buy + 8, buy + 26, CARD_START - CARD_PAYMENT, CARD_START - CARD_PAYMENT + CARD_PURCHASE);
	const balColor = f >= buy + 8 ? C.red : f >= pay + 8 ? C.green : C.white;
	const balO = f >= A('point') - 4 && f < A('working') ? tw(f, A('point') - 4, A('point') + 6) * tw(f, A('working') - 6, A('working'), 1, 0) : 0;
	const eq = tw(f, buy + 30, buy + 40, 0, 1, easeOut);

	// ending: example balance slowly paid down
	const e0 = A('working') + 6;
	const e1 = A('notJust') - 4;
	const endBal = f >= e1 ? ENDING_BALANCE : Math.round(tw(f, e0, e1, HOOK_BALANCE, ENDING_BALANCE, easeIO));
	const endO = f >= A('working') && f < A('notJust') ? Math.min(tw(f, A('working') + 2, A('working') + 12), tw(f, A('notJust') - 5, A('notJust'), 1, 0)) : 0;

	return (
		<>
			{/* ——— HOOK ——— */}
			<Type from={-14} to={A('three')} y={210} stagger={3} lines={[{t: 'PAYING', size: 200}, {t: 'OFF', size: 200}, {t: 'DEBT?', size: 250, c: C.green}]} />
			{f < A('three') ? (
				<div style={{position: 'absolute', left: 84, top: 1010, fontFamily: FONT, opacity: hookO}}>
					<div style={{fontWeight: 800, fontSize: 28, letterSpacing: 6, color: '#E9A3A3', textShadow: '0 3px 18px rgba(0,0,0,0.8)'}}>TOTAL DEBT · EXAMPLE</div>
					<div style={{fontWeight: 900, fontSize: 150, lineHeight: 1.05, letterSpacing: -5, color: C.white, fontVariantNumeric: 'tabular-nums', textShadow: '0 10px 50px rgba(0,0,0,0.7)'}}>{money(hookBal)}</div>
					<div style={{height: 8, width: 560 * tw(f, 0, 22, 0.6, 1, easeOut), background: C.red, borderRadius: 4, marginTop: 8}} />
				</div>
			) : null}

			{/* ——— 3 THINGS ——— */}
			<Type from={A('three') - 2} to={A('n1')} x={50} y={190} lines={[{t: '3', size: 820, outline: true, c: C.white, w: 900}]} shadow={false} />
			<Type from={A('three', 1)} to={A('n1')} y={1040} stagger={5} lines={[{t: 'THINGS', size: 190}, {t: "I'D FOCUS ON", size: 82, c: C.green, w: 800, ls: 1}]} />

			{/* ——— STEP 1 ——— */}
			<Type from={A('n1')} to={A('amounts') - 2} y={240} lines={[{t: '01', size: 130, c: C.green}]} />
			<Type from={A('n1') + 6} to={A('amounts') - 2} y={1000} stagger={5} lines={[{t: 'EMERGENCY', size: 134}, {t: 'FUND', size: 236}]} />
			{fundO > 0 ? (
				<>
					<Money v={fund} y={640} size={270} kicker="EMERGENCY SAVINGS" kc={C.green} o={fundO} color={fund >= FUND ? C.green : C.white} scale={1 + 0.05 * Math.sin(Math.PI * tw(f, s0 + 24, s0 + 34))} />
					<div style={{position: 'absolute', left: 190, width: 700, top: 1000, opacity: fundO, fontFamily: FONT}}>
						<div style={{height: 10, background: 'rgba(245,247,245,0.18)', borderRadius: 5, position: 'relative'}}>
							<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(100 * fund) / FUND_GOAL}%`, background: C.green, borderRadius: 5}} />
							<div style={{position: 'absolute', left: '50%', right: 0, top: -6, bottom: -6, border: `2px dashed rgba(57,255,136,${0.9 * goal})`, borderRadius: 10}} />
						</div>
						<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 800, fontSize: 28, color: C.gray, letterSpacing: 1}}>
							<span>$0</span>
							<span style={{color: fund >= FUND ? C.green : C.gray}}>{money(FUND)}</span>
							<span style={{color: goal > 0.5 ? C.green : C.gray}}>{money(FUND_GOAL)}</span>
						</div>
					</div>
				</>
			) : null}
			<Type from={A('tire', 2) - 3} to={A('bill')} y={230} stagger={3} lines={[{t: 'FLAT', size: 230}, {t: 'TIRE.', size: 230, c: C.white}]} />
			<Type from={A('bill', 1) - 3} to={A('forcing')} y={230} stagger={3} lines={[{t: 'SURPRISE', size: 170}, {t: 'BILL.', size: 250, c: C.red}]} />
			{/* the same bill, two outcomes */}
			<Kick text="NO SAVINGS" from={A('forcing') - 2} to={A('n2')} y={470} color={C.red} />
			<Type from={A('forcing')} to={A('n2')} y={520} stagger={4} lines={[{t: 'IT GOES ON', size: 104}, {t: 'THE CARD.', size: 104, c: C.red}]} />
			<div style={{position: 'absolute', left: 84, top: 790, width: 300 * tw(f, A('intoDebt') - 6, A('intoDebt') + 6, 0, 1, easeOut), height: 3, background: 'rgba(245,247,245,0.35)', opacity: f < A('n2') ? 1 : 0}} />
			<Kick text={`${money(FUND)} SAVED`} from={A('intoDebt') - 2} to={A('n2')} y={850} color={C.green} />
			<Type from={A('intoDebt')} to={A('n2')} y={900} stagger={4} lines={[{t: 'PAID.', size: 170}, {t: 'NO NEW DEBT.', size: 104, c: C.green}]} />

			{/* ——— STEP 2 ——— */}
			<Type from={A('n2')} to={A('couldMean')} y={240} lines={[{t: '02', size: 130, c: C.green}]} />
			<Type from={A('n2') + 6} to={A('couldMean')} y={1000} stagger={5} lines={[{t: 'EXTRA', size: 210}, {t: 'INCOME', size: 210}]} />
			<Label text="OVERTIME" from={A('overtime', 1) - 2} to={A('shifts')} />
			<Label text="EXTRA SHIFTS" from={A('shifts', 2) - 2} to={A('doordash')} />
			<Label text="DELIVERY" from={A('doordash', 1) - 2} to={A('selling')} />
			<Label text="SELL WHAT YOU DON'T USE" from={A('selling', 1) - 2} to={A('fifty')} />
			{/* $50 a week → $200 in 4 weeks */}
			<Type from={A('fifty', 3) - 6} to={phase2} y={330} stagger={4} lines={[{t: `+${money(PER_WEEK)}`, size: 270, c: C.green}, {t: '/WEEK', size: 120}]} exit="rise" />
			{f >= A('fifty') && f < A('n3') ? (
				<div style={{position: 'absolute', left: 120, width: 840, top: 860, display: 'flex', gap: 16, fontFamily: FONT, opacity: tw(f, phase2, phase2 + 8, 1, 0.35)}}>
					{weeksLit.map((p, k) => (
						<div key={k} style={{flex: 1, textAlign: 'center'}}>
							<div style={{height: 120, borderRadius: 14, border: `3px solid ${p > 0.5 ? C.green : 'rgba(245,247,245,0.3)'}`, background: `rgba(57,255,136,${0.85 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 40, color: p > 0.5 ? C.bg : 'rgba(245,247,245,0.5)'}}>
								{money(PER_WEEK)}
							</div>
							<div style={{marginTop: 12, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: C.gray}}>WEEK {k + 1}</div>
						</div>
					))}
				</div>
			) : null}
			<Type from={phase2} to={A('n3')} y={330} stagger={4} lines={[{t: `+${money(PER_WEEK * WEEKS)}`, size: 270, c: C.green}, {t: `IN ${WEEKS} WEEKS`, size: 120}]} />
			<Kick text={`AT ${money(ALT_PER_WEEK)} A WEEK: ${money(ALT_PER_WEEK * WEEKS)}`} from={A('difference', 2)} to={A('n3')} y={1110} color={C.white} />

			{/* ——— STEP 3 ——— */}
			<Type from={A('n3')} to={A('point') - 2} y={240} lines={[{t: '03', size: 130, c: C.green}]} />
			<Type from={A('n3', 1)} to={A('point') - 2} y={1000} stagger={5} lines={[{t: 'STOP ADDING', size: 140}, {t: 'NEW DEBT.', size: 176, c: C.green}]} />
			{balO > 0 ? (
				<>
					<Money v={bal} y={560} size={250} kicker="CARD BALANCE" o={balO} color={balColor} />
					<Chip text={`−${money(CARD_PAYMENT)} PAYMENT`} color={C.green} y={900} p={f < buy ? pop(f, pay, 14, 200, 0.8) * tw(f, buy - 6, buy, 1, 0) : 0} />
					<Chip text={`+${money(CARD_PURCHASE)} NEW PURCHASE`} color={C.red} y={900} p={pop(f, buy, 14, 200, 0.8)} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, opacity: eq * balO, textShadow: '0 3px 18px rgba(0,0,0,0.8)'}}>
						{money(CARD_START)} <span style={{color: C.green}}>− {money(CARD_PAYMENT)}</span> <span style={{color: C.red}}>+ {money(CARD_PURCHASE)}</span> = {money(CARD_START)}
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 26, color: '#C9CFCC', opacity: balO, textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>
						Simplified example. Excludes interest and fees.
					</div>
				</>
			) : null}

			{/* ——— ENDING ——— */}
			{endO > 0 ? (
				<div style={{position: 'absolute', left: 84, top: 1010, fontFamily: FONT, opacity: endO}}>
					<div style={{fontWeight: 800, fontSize: 28, letterSpacing: 6, color: C.green, textShadow: '0 3px 18px rgba(0,0,0,0.8)'}}>PAYING IT DOWN · EXAMPLE</div>
					<div style={{fontWeight: 900, fontSize: 150, lineHeight: 1.05, letterSpacing: -5, color: C.white, fontVariantNumeric: 'tabular-nums', textShadow: '0 10px 50px rgba(0,0,0,0.7)'}}>{money(endBal)}</div>
				</div>
			) : null}
			<Type from={A('notJust') - 2} to={A('whats')} y={250} stagger={4} lines={[{t: 'PAYING IT OFF', size: 118}, {t: 'IS ONE THING.', size: 118}]} />
			<Type from={A('changing') - 2} to={A('whats')} y={540} stagger={4} lines={[{t: 'STAYING OUT', size: 140, c: C.green}, {t: 'IS THE GOAL.', size: 140, c: C.green}]} />

			{/* ——— CTA ——— */}
			<Type from={A('whats') - 2} to={TOTAL_FRAMES + 1} x={0} width={1080} align="center" y={620} stagger={4} exit="none" lines={[{t: "WHAT'S YOUR", size: 128}, {t: 'BIGGEST DEBT', size: 128}, {t: 'STRUGGLE?', size: 168, c: C.green}]} />
		</>
	);
};

const SFX: [number, string, number][] = [
	[0, 'thud', 0.22],
	[A('three') - 6, 'whoosh', 0.22],
	[A('n1'), 'thud', 0.3],
	[A('amounts', 1) + 20, 'confirm', 0.2],
	[A('tire', 1), 'hiss', 0.3],
	[A('bill', 1), 'paper', 0.3],
	[A('forcing') + 2, 'alert', 0.16],
	[A('intoDebt'), 'confirm', 0.22],
	[A('n2') - 6, 'whoosh', 0.22],
	[A('fifty', 3) + 36, 'pop', 0.16],
	[A('difference') - 4, 'confirm', 0.2],
	[A('n3'), 'thud', 0.3],
	[A('paying300', 2) + 6, 'confirm', 0.2],
	[A('charging', 2) + 6, 'alert', 0.22],
	[A('changing'), 'chime', 0.2],
];

const DraftBadge: React.FC = () => (
	<div style={{position: 'absolute', left: 40, top: 60, padding: '8px 16px', borderRadius: 10, border: '2px solid #FF9A3D', color: '#FF9A3D', fontFamily: FONT, fontWeight: 800, fontSize: 22, letterSpacing: 1.5, background: 'rgba(0,0,0,0.6)'}}>
		V2 PREVIEW · TEMP TIMING · NO VOICEOVER
	</div>
);

export const DebtPayoff3ThingsV2: React.FC<DP3Props> = ({voiceover, draft}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Footage />
		<Scrims />
		<Flash at={A('n1')} />
		<Dip at={A('n3')} len={6} />
		<Graphics />
		<SparseCaptions ids={CAPTIONED} />
		<Grain amt={0.08} />
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
