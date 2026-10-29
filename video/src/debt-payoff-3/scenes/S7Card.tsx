import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, lerp, pop, shake, tw} from '../../debt-story/anim';
import {CreditCard} from '../../debt-story/props/Cards';
import {C, FONT} from '../../debt-story/theme';
import {at} from '../timing';
import {count, Footnote, Kicker, money, panel, SceneWin} from '../ui';

// Simplified example (no interest or fees). Every figure on screen derives from these three.
export const START = 1000;
export const PAYMENT = 300;
export const PURCHASE = 300;
export const AFTER_PAYMENT = START - PAYMENT; // $700
export const AFTER_PURCHASE = AFTER_PAYMENT + PURCHASE; // $1,000

const Chip: React.FC<{text: string; tone: string; x: number; y: number; p: number; from: number}> = ({text, tone, x, y, p, from}) => (
	<div
		style={{
			position: 'absolute',
			left: lerp(from, x, p),
			top: y,
			transform: `translateX(-50%) scale(${lerp(0.9, 1, p)})`,
			opacity: Math.min(1, p * 3) * (p >= 1 ? 1 : 1),
			padding: '14px 26px',
			borderRadius: 999,
			background: tone,
			color: C.bg,
			fontFamily: FONT,
			fontWeight: 900,
			fontSize: 38,
			whiteSpace: 'nowrap',
			boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
		}}
	>
		{text}
	</div>
);

export const S7Card: React.FC = () => {
	const f = useCurrentFrame();
	const cardIn = pop(f, at('n3') + 8, 16, 150, 0.9);
	const pay = at('paying300', 2) - 4;
	const buy = at('charging', 2) - 2;
	// chips fly into the card, then fade as the balance moves
	const payFly = tw(f, pay, pay + 12, 0, 1, easeIO);
	const payGone = tw(f, pay + 22, pay + 30, 1, 0);
	const buyFly = tw(f, buy, buy + 12, 0, 1, easeIO);
	const buyGone = tw(f, buy + 22, buy + 30, 1, 0);

	const bal = f < buy + 10 ? count(f, pay + 10, pay + 28, START, AFTER_PAYMENT) : count(f, buy + 10, buy + 28, AFTER_PAYMENT, AFTER_PURCHASE);
	const tone = f >= buy + 10 ? C.red : f >= pay + 10 ? C.green : C.white;
	const flashG = tw(f, pay + 10, pay + 14) * tw(f, pay + 16, pay + 30, 1, 0);
	const flashR = tw(f, buy + 10, buy + 14) * tw(f, buy + 16, buy + 30, 1, 0);
	const sh = shake(f, buy + 12, 14, 9);
	const back = pop(f, buy + 30, 12, 200, 0.7);

	const ledger = [
		{at: at('n3') + 14, l: 'Starting balance', d: '', v: START, c: C.white},
		{at: pay + 10, l: 'Payment', d: `−${money(PAYMENT)}`, v: AFTER_PAYMENT, c: C.green},
		{at: buy + 10, l: 'New purchase', d: `+${money(PURCHASE)}`, v: AFTER_PURCHASE, c: C.red},
	];

	return (
		<SceneWin id="card" enter="push" exit="fade" fy={700}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
				<div style={{opacity: Math.min(1, cardIn * 1.5), transform: `translateY(${(1 - cardIn) * 60}px)`}}>
					<CreditCard
						w={440}
						style={{
							left: 320,
							top: 440,
							transform: `rotate(${-3 + Math.sin(f / 40) * 1.2}deg)`,
							boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 0 ${4 * (flashG + flashR)}px ${flashR > flashG ? C.red : C.green}`,
						}}
					/>
				</div>

				<div style={{...panel({left: 130, top: 750, width: 820, height: 260, padding: '28px 46px'}), opacity: Math.min(1, cardIn * 1.5)}}>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
						<Kicker>CARD BALANCE</Kicker>
						<div
							style={{
								fontWeight: 900,
								fontSize: 28,
								color: C.bg,
								background: C.red,
								borderRadius: 999,
								padding: '6px 18px',
								opacity: Math.min(1, back * 1.5),
								transform: `scale(${0.6 + 0.4 * back})`,
							}}
						>
							BACK TO {money(AFTER_PURCHASE)}
						</div>
					</div>
					<div style={{marginTop: 6, fontWeight: 900, fontSize: 132, lineHeight: 1.05, letterSpacing: -4, color: tone, fontVariantNumeric: 'tabular-nums'}}>{money(bal)}</div>
					<div style={{marginTop: 12, height: 22, borderRadius: 11, background: 'rgba(245,247,245,0.08)', overflow: 'hidden'}}>
						<div style={{height: '100%', width: `${(100 * bal) / START}%`, borderRadius: 11, background: C.red, opacity: 0.85}} />
					</div>
				</div>

				{/* ledger builds one line per event */}
				<div style={{position: 'absolute', left: 150, width: 780, top: 1040, fontFamily: FONT}}>
					{ledger.map((r, i) => {
						const p = tw(f, r.at, r.at + 8, 0, 1, easeOut);
						return (
							<div
								key={i}
								style={{
									display: 'flex',
									alignItems: 'baseline',
									height: 62,
									borderBottom: i < 2 ? '2px solid #222A27' : 'none',
									opacity: p,
									transform: `translateY(${(1 - p) * 16}px)`,
									fontSize: 32,
								}}
							>
								<div style={{flex: 1, fontWeight: 700, color: C.gray, paddingTop: 12}}>{r.l}</div>
								<div style={{width: 150, textAlign: 'right', fontWeight: 900, color: r.c}}>{r.d}</div>
								<div style={{width: 190, textAlign: 'right', fontWeight: 900, color: C.white, fontVariantNumeric: 'tabular-nums'}}>{money(r.v)}</div>
							</div>
						);
					})}
				</div>
			</div>

			{payFly > 0 && payGone > 0 ? (
				<div style={{opacity: payGone}}>
					<Chip text={`−${money(PAYMENT)} PAYMENT`} tone={C.green} x={540} y={lerp(560, 570, payFly)} p={payFly} from={-200} />
				</div>
			) : null}
			{buyFly > 0 && buyGone > 0 ? (
				<div style={{opacity: buyGone}}>
					<Chip text={`+${money(PURCHASE)} NEW PURCHASE`} tone={C.red} x={540} y={570} p={buyFly} from={1300} />
				</div>
			) : null}

			<Footnote text="Simplified example. Excludes interest and fees." top={1244} start={at('n3') + 14} />
		</SceneWin>
	);
};
