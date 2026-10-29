import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeOut, pop, tw} from '../../debt-story/anim';
import {C, FONT} from '../../debt-story/theme';
import {at} from '../timing';
import {count, Kicker, money, SceneWin} from '../ui';

export const PER_WEEK = 50;
export const WEEKS = 4;
export const ALT_PER_WEEK = 100;
export const TOTAL = PER_WEEK * WEEKS; // $200
export const ALT_TOTAL = ALT_PER_WEEK * WEEKS; // $400

const COL_X = [190, 370, 550, 730];
const COL_W = 160;
const BASE = 1110;
const BLOCK = 96;

/** $50 a week stacks into a staircase: $50 → $100 → $150 → $200 after four weeks. */
export const S6Weeks: React.FC = () => {
	const f = useCurrentFrame();
	const t0 = at('fifty', 3) - 4;
	const wk = (k: number) => t0 + k * 13;
	const landed = Array.from({length: WEEKS}, (_, k) => f >= wk(k) + 8).filter(Boolean).length;
	// running total steps up as each week lands
	const k = Math.max(0, Math.min(WEEKS - 1, Math.floor((f - t0) / 13)));
	const total = f < t0 ? 0 : count(f, wk(k), wk(k) + 8, k * PER_WEEK, (k + 1) * PER_WEEK);
	const done = pop(f, wk(WEEKS - 1) + 10, 12, 200, 0.7);
	const alt = tw(f, at('difference'), at('difference') + 10, 0, 1, easeOut);
	const headIn = tw(f, at('fifty') - 6, at('fifty') + 6, 0, 1, easeOut);

	return (
		<SceneWin id="weeks" enter="rise" exit="push">
			<div style={{position: 'absolute', left: 150, right: 150, top: 470, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: FONT, opacity: headIn}}>
				<div>
					<Kicker>EXTRA PER WEEK</Kicker>
					<div style={{fontWeight: 900, fontSize: 92, lineHeight: 1.05, letterSpacing: -3, color: C.white}}>+{money(PER_WEEK)}</div>
				</div>
				<div style={{textAlign: 'right'}}>
					<Kicker color={landed === WEEKS ? C.green : C.gray}>{landed ? `AFTER ${landed} WEEK${landed > 1 ? 'S' : ''}` : 'TOTAL'}</Kicker>
					<div
						style={{
							fontWeight: 900,
							fontSize: 120,
							lineHeight: 1,
							letterSpacing: -4,
							color: C.green,
							fontVariantNumeric: 'tabular-nums',
							transform: `scale(${1 + 0.08 * Math.sin(Math.PI * Math.min(1, done))})`,
							transformOrigin: 'right bottom',
						}}
					>
						{money(total)}
					</div>
				</div>
			</div>

			{/* baseline */}
			<div style={{position: 'absolute', left: 150, width: 780, top: BASE, height: 4, borderRadius: 2, background: '#2A3330', opacity: headIn}} />

			{COL_X.map((x, c) => {
				const n = c + 1;
				const colIn = tw(f, wk(c), wk(c) + 6, 0, 1, easeOut);
				return (
					<div key={c}>
						{Array.from({length: n}, (_, b) => {
							const p = pop(f, wk(c) + b * 2, 14, 210, 0.75);
							if (p <= 0) return null;
							const isNew = b === n - 1;
							return (
								<div
									key={b}
									style={{
										position: 'absolute',
										left: x,
										top: BASE - (b + 1) * (BLOCK + 6),
										width: COL_W,
										height: BLOCK,
										borderRadius: 16,
										boxSizing: 'border-box',
										background: isNew ? C.green : 'rgba(57,255,136,0.22)',
										border: `2px solid ${isNew ? C.green : 'rgba(57,255,136,0.45)'}`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontFamily: FONT,
										fontWeight: 900,
										fontSize: 32,
										color: isNew ? C.bg : C.green,
										opacity: Math.min(1, p * 1.5),
										transform: `translateY(${(1 - p) * -120}px)`,
									}}
								>
									{money(PER_WEEK)}
								</div>
							);
						})}
						<div style={{position: 'absolute', left: x, width: COL_W, top: BASE + 18, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: C.gray, opacity: colIn}}>
							WEEK {n}
						</div>
					</div>
				);
			})}

			{/* equation once the fourth week lands, then the $100/week line on "difference" */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1176, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: C.white, opacity: Math.min(1, done * 1.5)}}>
				{money(PER_WEEK)} × {WEEKS} WEEKS = <span style={{color: C.green}}>{money(TOTAL)}</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1234, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.gray, opacity: alt}}>
				At {money(ALT_PER_WEEK)} a week: {money(ALT_TOTAL)}
			</div>
		</SceneWin>
	);
};
