import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {CreditCard} from '../props/Cards';
import {CheckBadge} from '../props/Icons';
import {Cash, Jar} from '../props/Jar';
import {Doc} from '../props/Paper';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';
import {JAR} from './S07PlanToFund';

/*
 * Illustrative example (not Gio's balances):
 *  $500 saved → $1,000 = bigger buffer → a repair bill is paid from the jar
 *  → split screen: without savings, the same bill lands on a credit card and debt grows.
 */
const START = 738;
const L = (g: number) => g - START;
const D500 = L(VO.d500);
const D1000 = L(VO.d1000);
const BILL_IN = L(VO.handle);
const PAY = L(VO.unexpected) - 2;
const SPLIT = L(VO.without) - 4;
const CARD_HIT = L(VO.creditCard) - 2;

const J = {x: 300, base: 1430, w: 400};
const LEVEL = (k: number) => -24 - k * ((J.w * 1.18 - 90) / 8) * 8;
const BILL = {x: 850, y: 880, s: 1.6};

const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

export const S09SavingsComparison: React.FC = () => {
	const f = useCurrentFrame();
	const enter = tw(f, 0, 18);
	const jx = lerp(JAR.x, J.x, enter);
	const jb = lerp(1437, J.base, enter);
	const js = lerp(1.055, 1, enter);

	const amount = tw(f, D500, D500 + 8, 0, 500, easeOut) + tw(f, D1000, D1000 + 14, 0, 500, easeOut);
	const numIn = pop(f, D500, 12, 190);
	const bump = pop(f, D1000 + 12, 10, 260) * (1 - tw(f, D1000 + 14, D1000 + 26));
	const paidOut = tw(f, PAY + 4, PAY + 20, 0, 0.26);
	const fill = 0.4 + 0.4 * tw(f, D1000, D1000 + 18, 0, 1, easeOut) - paidOut;
	const marker1000 = tw(f, D1000 + 10, D1000 + 20, 0, 1, easeOut);
	const buffer = pop(f, D1000 + 18, 13, 170);

	const billIn = tw(f, BILL_IN, BILL_IN + 9, 0, 1, easeIn);
	const paid = pop(f, PAY + 20, 9, 230);
	const split = tw(f, SPLIT, SPLIT + 12, 0, 1);
	const right = tw(f, SPLIT + 4, SPLIT + 16, 0, 1, easeOut);
	const toCard = tw(f, CARD_HIT - 10, CARD_HIT, 0, 1, easeIn);
	const debtUp = pop(f, CARD_HIT + 2, 11, 180);
	const out = tw(f, 213, 219, 1, 0);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -10}), expr: 'curious'},
		{f: D500 + 6, pose: P({...POSES.lookUp, gaze: 0.8}), expr: 'happy', dur: 8},
		{f: D1000 + 14, pose: P({...POSES.fistPump, gaze: 0.8}), expr: 'happy', dur: 8, overshoot: true},
		{f: BILL_IN + 8, pose: P({...POSES.flinch}), expr: 'shocked', dur: 5, overshoot: true},
		{f: PAY + 24, pose: P({...POSES.thumbsUp, gaze: 0.6}), expr: 'relieved', dur: 8, overshoot: true},
	]);

	// left: the "with savings" story, compressed into a column on split
	const ls = lerp(1, 0.56, split);
	const lx = lerp(0, 270 - 520 * 0.56, split);
	const ly = lerp(0, 1120 - 1150 * 0.56, split);

	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 640px 700px at 420px 1150px, rgba(57,255,136,0.07), transparent 70%)'}} />
			<AbsoluteFill style={{transform: `translate(${lx}px, ${ly}px) scale(${ls})`, transformOrigin: '0px 0px'}}>
				<Svg>
					<rect x={-400} y={1440} width={1900} height={900} fill="#101412" />
					{/* jar with level markers */}
					<g transform={`translate(${jx} ${jb}) scale(${js})`}>
						<Jar w={J.w} fill={fill} />
						{numIn > 0 ? (
							<g transform={`translate(${J.w / 2 + 18} 0)`} opacity={enter}>
								<line x1={0} x2={34} y1={LEVEL(0.4)} y2={LEVEL(0.4)} stroke={C.white} strokeWidth={5} />
								<text x={44} y={LEVEL(0.4) + 12} fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.white}>
									$500
								</text>
								<g opacity={marker1000}>
									<line x1={0} x2={34} y1={LEVEL(0.8)} y2={LEVEL(0.8)} stroke={C.green} strokeWidth={5} />
									<text x={44} y={LEVEL(0.8) + 12} fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.green}>
										$1,000
									</text>
									<line x1={18} x2={18} y1={LEVEL(0.4) - 8} y2={LEVEL(0.8) + 8} stroke={C.green} strokeWidth={3} strokeDasharray="6 8" />
								</g>
							</g>
						) : null}
					</g>
					{/* big balance number */}
					{numIn > 0 ? (
						<g transform={`translate(${jx} ${jb - J.w * 1.18 - 70}) scale(${(0.7 + 0.3 * numIn) * (1 + 0.06 * bump)})`}>
							<text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} letterSpacing={-5} fill={C.green}>
								{money(amount)}
							</text>
							<text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} letterSpacing={8} fill={C.gray}>
								SAVED
							</text>
						</g>
					) : null}
					{buffer > 0 && split < 0.5 ? (
						<g transform={`translate(540 600) scale(${buffer})`} opacity={(1 - split * 2) * (1 - billIn)}>
							<rect x={-150} y={-40} width={300} height={80} rx={40} fill={C.greenSoft} stroke={C.green} strokeWidth={3} />
							<text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} letterSpacing={2} fill={C.green}>
								BIGGER BUFFER
							</text>
						</g>
					) : null}
					{/* the unexpected bill */}
					{f >= BILL_IN ? (
						<g transform={`translate(${lerp(1400, BILL.x, billIn)} ${BILL.y}) rotate(${lerp(30, 6, billIn)}) scale(${BILL.s})`}>
							<Doc w={150} title="REPAIR BILL" accent={paid > 0.5 ? C.greenDeep : C.red} />
							{paid > 0 ? (
								<g transform={`translate(4 10) rotate(-14) scale(${1.6 - 0.6 * paid})`} opacity={Math.min(1, paid * 1.5)}>
									<rect x={-56} y={-22} width={112} height={44} rx={6} fill="rgba(255,255,255,0.85)" stroke={C.greenDeep} strokeWidth={4} />
									<text x={0} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} letterSpacing={2} fill={C.greenDeep}>
										PAID
									</text>
								</g>
							) : null}
						</g>
					) : null}
					{/* cash flies from the jar to the bill */}
					{[0, 1, 2].map((i) => {
						const t = tw(f, PAY + i * 5, PAY + i * 5 + 12, 0, 1, easeIn);
						if (t <= 0 || t >= 1) return null;
						const x = lerp(jx, BILL.x - 40, t);
						const y = lerp(jb - 250, BILL.y, t) - Math.sin(t * Math.PI) * 220;
						return (
							<g key={i} transform={`translate(${x} ${y}) rotate(${t * 40 - 20})`}>
								<Cash w={170} />
							</g>
						);
					})}
					{paid > 0 ? (
						<g transform={`translate(${BILL.x + 120} ${BILL.y - 160}) scale(${paid})`}>
							<CheckBadge r={44} p={tw(f, PAY + 22, PAY + 30)} />
						</g>
					) : null}
					<Marcus facing={-1} opacity={tw(f, 6, 14) * (1 - split)} x={975} y={1440} scale={0.75} pose={pose} expr={expr} frame={f + 738} fx={f > PAY + 24 ? ['sparkle'] : f > BILL_IN + 8 ? ['sweat'] : []} seed={9} />
				</Svg>
			</AbsoluteFill>
			{/* split screen: with vs without savings */}
			{split > 0 ? (
				<>
					<Svg>
						<line x1={540} x2={540} y1={560} y2={1440} stroke="#2A3430" strokeWidth={4} opacity={split} />
						<g opacity={split}>
							<text x={270} y={640} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} letterSpacing={1} fill={C.green}>
								WITH SAVINGS
							</text>
							<text x={810} y={640} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} letterSpacing={1} fill={C.red}>
								WITHOUT
							</text>
						</g>
					</Svg>
					<div style={{position: 'absolute', left: 810 - 175, top: 1010, opacity: right, transform: `translateY(${(1 - right) * 50}px) scale(${1 + 0.05 * debtUp})`}}>
						<CreditCard w={350} />
					</div>
					<Svg>
						{right > 0 && toCard < 1 ? (
							<g transform={`translate(${810} ${lerp(800, 1100, toCard)}) rotate(${lerp(-8, 4, toCard)}) scale(${lerp(1.3, 0.6, toCard)})`} opacity={right * (1 - toCard * 0.8)}>
								<Doc w={150} title="REPAIR BILL" accent={C.red} />
							</g>
						) : null}
						{debtUp > 0 ? (
							<g transform={`translate(810 ${1310}) scale(${debtUp})`}>
								<rect x={-210} y={-44} width={420} height={88} rx={44} fill={C.redSoft} stroke={C.red} strokeWidth={3} />
								<path d="M -170 14 L -152 -16 L -134 14 Z" fill={C.red} />
								<text x={22} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} letterSpacing={1} fill={C.red}>
									DEBT GROWS
								</text>
							</g>
						) : null}
					</Svg>
				</>
			) : null}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1490, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.gray, opacity: tw(f, D500, D500 + 10) * 0.9}}>
				Illustrative example. Expense costs vary.
			</div>
		</AbsoluteFill>
	);
};
