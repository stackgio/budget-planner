import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, pop, shake, tw} from '../../debt-story/anim';
import {CreditCard} from '../../debt-story/props/Cards';
import {TireIcon} from '../../debt-story/props/Icons';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at, SCENES} from '../timing';
import {Kicker, money, panel, SceneWin} from '../ui';
import {FUND_TARGET} from './S2Fund';

const TAG = {x: 270, y: 470, w: 540, h: 136};

/** "Surprise expense" card. Same screen position in the tyre scene and the comparison (match cut). */
export const ExpenseTag: React.FC<{p: number}> = ({p}) => (
	<div
		style={{
			...panel({left: TAG.x, top: TAG.y, width: TAG.w, height: TAG.h, padding: '0 30px', display: 'flex', alignItems: 'center', gap: 24}),
			background: 'linear-gradient(160deg, #2A1415 0%, #1A0F10 100%)',
			border: `2px solid ${C.red}`,
			opacity: Math.min(1, p * 1.6),
			transform: `translateY(${(1 - p) * -40}px) scale(${0.85 + 0.15 * p})`,
		}}
	>
		<svg width={96} height={96} viewBox="-50 -50 100 100" style={{flex: 'none'}}>
			<TireIcon r={40} />
		</svg>
		<div>
			<div style={{fontWeight: 900, fontSize: 38, color: C.white, letterSpacing: 0.5, lineHeight: 1.05}}>SURPRISE EXPENSE</div>
			<div style={{fontWeight: 600, fontSize: 26, color: '#E9A3A3', marginTop: 6}}>Flat tire or unexpected bill</div>
		</div>
	</div>
);

const COL = [
	{cx: 330, label: 'NO SAVINGS', tone: C.red},
	{cx: 750, label: `${money(FUND_TARGET)} SAVED`, tone: C.green},
] as const;
const COL_W = 380;

/** Same surprise expense, two outcomes: on the card (new debt) vs paid from savings (no new debt). */
export const S4Split: React.FC = () => {
	const f = useCurrentFrame();
	const S = SCENES.split[0];
	const cols = pop(f, S + 6, 15, 170, 0.8);
	const bad = at('forcing');
	const good = at('intoDebt') - 2;
	const path = [tw(f, bad - 4, bad + 8, 0, 1, easeIO), tw(f, good - 4, good + 8, 0, 1, easeIO)];
	const result = [pop(f, bad + 10, 11, 220, 0.7), pop(f, good + 8, 11, 220, 0.7)];
	const sh = shake(f, bad + 10, 12, 8);

	return (
		<SceneWin id="split" enter="fade" exit="push">
			<ExpenseTag p={1} />
			<Svg>
				{COL.map((c, i) => {
					const len = 260;
					const d = `M 540 ${TAG.y + TAG.h} C 540 ${TAG.y + TAG.h + 50}, ${c.cx} ${TAG.y + TAG.h + 30}, ${c.cx} ${TAG.y + TAG.h + 92}`;
					return (
						<g key={i}>
							<path d={d} stroke="#2A3330" strokeWidth={6} fill="none" strokeLinecap="round" opacity={cols} />
							<path d={d} stroke={c.tone} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - path[i])} />
						</g>
					);
				})}
			</Svg>
			{COL.map((c, i) => {
				const lit = path[i];
				const r = result[i];
				const x = c.cx - COL_W / 2;
				const dx = i === 0 ? sh.x : 0;
				return (
					<div key={i} style={{position: 'absolute', left: x + dx, top: 700, width: COL_W, opacity: Math.min(1, cols * 1.5), transform: `translateY(${(1 - cols) * 50}px)`}}>
						<div
							style={{
								...panel({position: 'relative', height: 310, padding: '26px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center'}),
								borderColor: lit > 0.5 ? c.tone : '#27302D',
							}}
						>
							<Kicker color={lit > 0.5 ? c.tone : C.gray} style={{fontSize: 28, letterSpacing: 2}}>
								{c.label}
							</Kicker>
							<div style={{marginTop: 22, position: 'relative', height: 176, width: 260}}>
								{i === 0 ? (
									<CreditCard w={250} style={{left: 5, top: 4, transform: `rotate(${-4 + 4 * lit}deg)`}} />
								) : (
									<div style={{textAlign: 'center', fontFamily: FONT}}>
										<div style={{fontWeight: 800, fontSize: 24, letterSpacing: 2, color: C.gray}}>EMERGENCY FUND</div>
										<div style={{fontWeight: 900, fontSize: 96, lineHeight: 1.1, letterSpacing: -3, color: C.green, fontVariantNumeric: 'tabular-nums'}}>{money(FUND_TARGET)}</div>
									</div>
								)}
							</div>
							<div style={{fontWeight: 700, fontSize: 26, color: C.gray, fontFamily: FONT, marginTop: 6}}>{i === 0 ? 'Swipe the card' : 'Pay from savings'}</div>
						</div>
						<div
							style={{
								marginTop: 26,
								height: 104,
								borderRadius: 26,
								background: i === 0 ? 'rgba(255,85,85,0.14)' : 'rgba(57,255,136,0.12)',
								border: `2px solid ${c.tone}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 14,
								fontFamily: FONT,
								fontWeight: 900,
								fontSize: 40,
								color: c.tone,
								opacity: Math.min(1, r * 1.5),
								transform: `scale(${0.6 + 0.4 * r})`,
							}}
						>
							{i === 0 ? (
								<>
									<span style={{fontSize: 46}}>↑</span> NEW DEBT
								</>
							) : (
								<>
									<svg width={40} height={40} viewBox="-12 -12 24 24">
										<circle r={11} fill={C.green} />
										<path d="M -5 0 L -1.5 3.5 L 5.5 -4" stroke={C.bg} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									NO NEW DEBT
								</>
							)}
						</div>
					</div>
				);
			})}
			{/* the losing side dims once the good outcome lands */}
			<div
				style={{
					position: 'absolute',
					left: COL[0].cx - COL_W / 2 - 10,
					top: 690,
					width: COL_W + 20,
					height: 450,
					background: C.bg,
					opacity: 0.35 * tw(f, good + 14, good + 24, 0, 1, easeOut),
					borderRadius: 30,
				}}
			/>
		</SceneWin>
	);
};
