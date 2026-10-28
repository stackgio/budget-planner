import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {BillIcon, CarIcon, CommentIcon, TireIcon} from '../props/Icons';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const START = 1100;
const L = (g: number) => g - START;
const ROW_Y = 810;
const ICONS = [
	{label: 'FLAT TIRE', from: {x: 200, y: 900}, to: {x: 230, y: ROW_Y}, f: 6, node: <TireIcon r={46} />},
	{label: 'CAR REPAIR', from: {x: 540, y: 720}, to: {x: 540, y: ROW_Y}, f: 12, node: <CarIcon s={1.25} />},
	{label: 'RANDOM BILL', from: {x: 880, y: 900}, to: {x: 850, y: ROW_Y}, f: 18, node: <BillIcon s={0.95} />},
];

export const S11Comments: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = tw(f, 4, 12, 0, 1, easeOut);
	const settleT = tw(f, L(VO.messes) + 6, L(VO.messes) + 24, 0, 1);
	const prompt = pop(f, L(VO.messes) + 14, 14, 160);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.lookUp, head: -18, gaze: 0.9}), expr: 'curious'},
		{f: L(VO.expense), pose: P({...POSES.lookUp, head: -26, gaze: 0.5}), expr: 'curious', dur: 8},
		{f: L(VO.expense) + 14, pose: P({...POSES.handChin, head: -18, gaze: 0.9}), expr: 'confused', dur: 8},
		{f: L(VO.messes) + 8, pose: P({...POSES.shrug}), expr: 'happy', dur: 10, overshoot: true},
	]);
	const facing: 1 | -1 = f < L(VO.expense) - 4 ? -1 : 1;

	return (
		<AbsoluteFill style={{opacity: fadeIn}}>
			<Svg>
				<ellipse cx={540} cy={1462} rx={300} ry={26} fill={C.green} opacity={0.05} />
				<line x1={240} x2={840} y1={1462} y2={1462} stroke="#1E2523" strokeWidth={3} />
				{ICONS.map((ic, i) => {
					const p = pop(f, ic.f, 12, 170);
					if (p <= 0) return null;
					const bob = Math.sin((f + i * 20) / 11) * 12 * (1 - settleT);
					const x = lerp(ic.from.x, ic.to.x, settleT);
					const y = lerp(ic.from.y, ic.to.y, settleT) + bob;
					return (
						<g key={i} transform={`translate(${x} ${y}) scale(${p})`}>
							<circle r={96} fill="#141A18" stroke="#2A3430" strokeWidth={3} />
							<circle r={96} fill="none" stroke={C.red} strokeWidth={3} opacity={0.35} />
							{ic.node}
							<text y={142} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} letterSpacing={1.5} fill={C.white}>
								{ic.label}
							</text>
						</g>
					);
				})}
				<Marcus x={540} y={1460} scale={0.98} facing={facing} pose={pose} expr={expr} frame={f + 1100} seed={11} />
			</Svg>
			{prompt > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 540,
						display: 'flex',
						justifyContent: 'center',
						transform: `translateY(${(1 - prompt) * 30}px)`,
						opacity: Math.min(1, prompt * 1.5),
					}}
				>
					<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 999, background: C.greenSoft, border: '2px solid rgba(57,255,136,0.45)', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: C.green}}>
						<svg width={40} height={40} viewBox="-24 -26 48 50">
							<CommentIcon />
						</svg>
						DROP IT IN THE COMMENTS
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};
