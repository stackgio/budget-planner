import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, lerp, pop, tw} from '../debt-story/anim';
import {C, FONT} from '../debt-story/theme';
import {at, SCENES} from './timing';
import {STEPS} from './ui';

/**
 * The three steps. They are revealed as large rows in the hook ("three things"), then fly up into a
 * compact tracker that stays on screen: the current step is lit and finished steps get a check.
 */
type Box = {x: number; y: number; w: number; h: number; font: number; dot: number};
const ROW = (i: number): Box => ({x: 330, y: 770 + i * 142, w: 610, h: 118, font: 46, dot: 78});
const PILL_W = [292, 262, 248];
const PILL = (i: number): Box => {
	const gap = 12;
	const total = PILL_W.reduce((a, b) => a + b, 0) + gap * 2;
	const x = 540 - total / 2 + PILL_W.slice(0, i).reduce((a, b) => a + b + gap, 0);
	return {x, y: 180, w: PILL_W[i], h: 58, font: 23, dot: 38};
};

export const Tracker: React.FC = () => {
	const f = useCurrentFrame();
	const reveal = at('three', 1);
	const morph0 = at('n1') - 14;
	const fade = tw(f, SCENES.cta[0], SCENES.cta[0] + 10, 1, 0);
	if (f < reveal || fade <= 0) return null;

	// active step and completion times
	const starts = [at('n1'), at('n2'), at('n3')];
	const done = [at('n2'), at('n3'), at('habits')];
	const finale = [at('habits'), at('habits') + 6, at('habits') + 12];

	return (
		<div style={{position: 'absolute', inset: 0, opacity: fade}}>
			{STEPS.map((st, i) => {
				const morph = tw(f, morph0 + i * 3, morph0 + 18 + i * 3, 0, 1, easeIO);
				const typeT = Math.min(1, morph * 1.8);
				const inP = pop(f, reveal + i * 6, 15, 170, 0.8);
				const a = ROW(i);
				const b = PILL(i);
				const box: Box = {
					x: lerp(a.x, b.x, morph) + (1 - inP) * 120,
					y: lerp(a.y, b.y, morph),
					w: lerp(a.w, b.w, morph),
					h: lerp(a.h, b.h, morph),
					font: lerp(a.font, b.font, typeT),
					dot: lerp(a.dot, b.dot, typeT),
				};
				const active = morph < 1 || (f >= starts[i] && f < done[i]);
				const lit = morph < 1 ? 1 : tw(f, starts[i], starts[i] + 8) * (f < done[i] ? 1 : 0);
				// steps 1–2 are checked when the next step starts; step 3 on "habits"
				const isDone = f >= done[i];
				const ck = pop(f, done[i], 14, 200, 0.7);
				// finale: all three pulse in sequence on "habits"
				const pulse = 1 + 0.12 * Math.sin(Math.PI * tw(f, finale[i], finale[i] + 10));
				const dim = morph >= 1 && !active && !isDone;
				return (
					<div
						key={st.n}
						style={{
							position: 'absolute',
							left: box.x,
							top: box.y,
							width: box.w,
							height: box.h,
							boxSizing: 'border-box',
							borderRadius: 999,
							display: 'flex',
							alignItems: 'center',
							gap: box.h * 0.2,
							paddingLeft: (box.h - box.dot) / 2,
							paddingRight: box.h * 0.3,
							fontFamily: FONT,
							background: lit > 0 ? `rgba(57,255,136,${0.06 + 0.06 * lit})` : 'rgba(245,247,245,0.05)',
							border: `${lerp(3, 2, morph)}px solid ${lit > 0 ? `rgba(57,255,136,${0.35 + 0.5 * lit})` : isDone ? 'rgba(57,255,136,0.35)' : '#2A3330'}`,
							boxShadow: morph < 1 ? '0 20px 50px rgba(0,0,0,0.5)' : 'none',
							opacity: Math.min(1, inP * 1.6),
							transform: `scale(${pulse})`,
						}}
					>
						<div
							style={{
								flex: 'none',
								width: box.dot,
								height: box.dot,
								borderRadius: '50%',
								background: isDone || lit > 0.5 ? C.green : '#26302D',
								color: C.bg,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 900,
								fontSize: box.dot * 0.58,
							}}
						>
							{isDone ? (
								<svg width={box.dot * 0.6} height={box.dot * 0.6} viewBox="-12 -12 24 24" style={{transform: `scale(${0.4 + 0.6 * ck})`}}>
									<path d="M -7 0 L -2 5 L 8 -6" stroke={C.bg} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							) : (
								<span style={{color: lit > 0.5 ? C.bg : C.gray}}>{st.n}</span>
							)}
						</div>
						<div
							style={{
								fontWeight: 900,
								fontSize: box.font,
								letterSpacing: lerp(-0.5, 0.6, morph),
								whiteSpace: 'nowrap',
								color: dim ? C.gray : C.white,
								transform: `translateX(${(1 - tw(f, reveal + i * 6 + 2, reveal + i * 6 + 14, 0, 1, easeOut)) * 30}px)`,
							}}
						>
							{st.short}
						</div>
					</div>
				);
			})}
		</div>
	);
};
