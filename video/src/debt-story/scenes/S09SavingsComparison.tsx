import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {CreditCard, ExpenseCard, FundCard} from '../props/Cards';
import {CheckBadge} from '../props/Icons';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';
import {FUND_CENTER} from './S07PlanToFund';

const START = 738;
const L = (g: number) => g - START;
const SLOT = {cx: 305, cy: 960, w: 490};
const EXP = {left: 560, top: 610, w: 460};
const CC = {left: 610, top: 1170, w: 380};

const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

export const S09SavingsComparison: React.FC = () => {
	const f = useCurrentFrame();
	const move = tw(f, 0, 20, 0, 1);
	const w = lerp(FUND_CENTER.w, SLOT.w, move);
	const cx = lerp(FUND_CENTER.cx, SLOT.cx, move);
	const cy = lerp(FUND_CENTER.cy, SLOT.cy, move);

	const a500 = tw(f, L(VO.d500), L(VO.d500) + 10, 0, 500, easeOut);
	const a1000 = tw(f, L(VO.d1000), L(VO.d1000) + 14, 0, 500, easeOut);
	const bal = f < L(VO.d500) ? null : money(a500 + a1000);
	const bump = pop(f, L(VO.d1000) + 12, 10, 260) * (1 - tw(f, L(VO.d1000) + 14, L(VO.d1000) + 26));

	const expIn = pop(f, L(VO.handle), 12, 180);
	const forward = tw(f, L(VO.handle) + 10, L(VO.handle) + 22, 0, 1, easeOut);
	const line = tw(f, L(VO.unexpected), L(VO.unexpected) + 18, 0, 1, easeIn);
	const checkF = L(VO.unexpected) + 18;
	const check = tw(f, checkF, checkF + 8, 0, 1, easeOut);
	const ccIn = tw(f, L(VO.handle), L(VO.handle) + 14, 0, 1, easeOut);
	const notNeeded = pop(f, L(VO.creditCard) + 2, 13, 190);
	const out = tw(f, 206, 214, 1, 0);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -14}), expr: 'curious'},
		{f: L(VO.d500) + 6, pose: P({...POSES.lookUp, gaze: 0.8}), expr: 'happy', dur: 8},
		{f: L(VO.d1000) + 12, pose: P({...POSES.fistPump, gaze: 0.8}), expr: 'happy', dur: 8, overshoot: true},
		{f: L(VO.handle) + 8, pose: P({...POSES.lookUp, head: -26}), expr: 'curious', dur: 8},
		{f: checkF + 6, pose: P({...POSES.thumbsUp, gaze: 0.6}), expr: 'relieved', dur: 8, overshoot: true},
	]);

	// transfer path: savings card top edge → expense card bottom-left
	const p0 = {x: SLOT.cx + 150, y: SLOT.cy - (SLOT.w * 0.62) / 2 - 8};
	const p1 = {x: EXP.left + 110, y: EXP.top + 132};
	const pathD = `M ${p0.x} ${p0.y} C ${p0.x + 20} ${p0.y - 150}, ${p1.x - 40} ${p1.y + 140}, ${p1.x} ${p1.y + 8}`;
	const pathLen = 360;

	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 700px 700px at 400px 900px, rgba(57,255,136,0.07), transparent 70%)'}} />
			{/* credit card, background */}
			<div style={{position: 'absolute', left: CC.left, top: CC.top, opacity: ccIn * 0.85, transform: `translateY(${(1 - ccIn) * 40}px) rotate(4deg) scale(0.96)`}}>
				<CreditCard w={CC.w} dim={0.55} />
			</div>
			{notNeeded > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: CC.left + CC.w / 2 - 125,
						top: CC.top + 80,
						width: 250,
						transform: `scale(${notNeeded}) rotate(-6deg)`,
						padding: '12px 0',
						borderRadius: 14,
						border: `3px solid ${C.green}`,
						background: 'rgba(11,13,12,0.85)',
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: 900,
						fontSize: 30,
						letterSpacing: 2,
						color: C.green,
					}}
				>
					NOT NEEDED
				</div>
			) : null}
			{/* unexpected expense */}
			{expIn > 0 ? (
				<div style={{position: 'absolute', left: EXP.left, top: EXP.top, transform: `scale(${expIn})`, transformOrigin: '50% 50%'}}>
					<ExpenseCard w={EXP.w} title="UNEXPECTED EXPENSE" tone={check > 0.5 ? C.green : C.red} />
				</div>
			) : null}
			<Svg>
				{line > 0 ? (
					<g>
						<path d={pathD} fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 16" strokeDashoffset={-f * 2} opacity={0.9} />
						<path d={pathD} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - line)} opacity={0.5} />
						{[0, 0.33, 0.66].map((o) => {
							const t = ((f / 22 + o) % 1) * line;
							const bx = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * (p0.x + 20) + 3 * (1 - t) * t * t * (p1.x - 40) + t * t * t * p1.x;
							const by = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * (p0.y - 150) + 3 * (1 - t) * t * t * (p1.y + 140) + t * t * t * (p1.y + 8);
							return <circle key={o} cx={bx} cy={by} r={9} fill={C.green} />;
						})}
						<text x={p0.x - 24} y={p0.y - 64} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.green} opacity={line}>
							FROM SAVINGS
						</text>
					</g>
				) : null}
				{check > 0 ? (
					<g transform={`translate(${EXP.left + EXP.w - 10} ${EXP.top + 10}) scale(${0.4 + 0.6 * pop(f, checkF, 10, 220)})`}>
						<circle r={60 * check} fill={C.green} opacity={0.15 * (1 - check) + 0.08} />
						<CheckBadge r={38} p={check} />
					</g>
				) : null}
			</Svg>
			{/* savings card */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transform: `translate(${cx - w / 2}px, ${cy - (w * 0.62) / 2}px) scale(${1 + 0.05 * forward + 0.04 * bump})`,
					transformOrigin: `${w / 2}px ${(w * 0.62) / 2}px`,
				}}
			>
				<FundCard w={w} balance={bal} meter={0.78} glow={0.5 + 0.5 * forward} />
			</div>
			<Svg>
				<Marcus opacity={tw(f, 6, 14)} x={180} y={1490} scale={0.7} pose={pose} expr={expr} frame={f + 738} seed={9} />
			</Svg>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1488, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.gray, opacity: tw(f, L(VO.handle), L(VO.handle) + 10) * 0.9}}>
				Illustrative example. Expense costs vary.
			</div>
		</AbsoluteFill>
	);
};
