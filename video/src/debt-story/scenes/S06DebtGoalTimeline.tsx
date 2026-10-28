import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeOut, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const START = 390;
const L = (g: number) => g - START;
const T = {x0: 400, x1: 920, y: 930};

export const S06DebtGoalTimeline: React.FC = () => {
	const f = useCurrentFrame();
	const fromGreen = tw(f, 0, 14, 1, 0, easeOut);
	const draw = tw(f, 12, 56, 0, 1);
	const flag = pop(f, L(VO.before2027) - 2, 11, 180);
	const panel = tw(f, 4, 18, 0, 1, easeOut);
	const sweep = ((f * 9) % 900) - 200;
	const out = tw(f, 116, 122, 1, 0);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -6}), expr: 'neutral'},
		{f: L(VO.age) + 6, pose: P({...POSES.pointSelf}), expr: 'happy', dur: 8, overshoot: true},
		{f: L(VO.goal) + 6, pose: P({...POSES.handChin, gaze: 0.9}), expr: 'determined', dur: 10},
		{f: L(VO.before2027) + 2, pose: P({armF: [128, 2], armB: [-12, 8], lean: -2, head: -18}), expr: 'determined', dur: 8, overshoot: true},
		{f: L(VO.goalEnd) + 4, pose: P({armF: [128, 2], armB: [-12, 8], lean: -2, head: -18}), expr: 'happy', dur: 6},
	]);

	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 700px 700px at 640px 920px, rgba(57,255,136,0.08), transparent 70%)'}} />
			<div
				style={{
					position: 'absolute',
					left: 320,
					top: 660,
					width: 690,
					height: 560,
					borderRadius: 36,
					background: 'linear-gradient(160deg, rgba(27,34,32,0.92), rgba(18,23,21,0.92))',
					border: '2px solid #26302C',
					boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
					opacity: panel,
					transform: `translateY(${(1 - panel) * 40}px)`,
					fontFamily: FONT,
				}}
			>
				<div style={{position: 'absolute', left: 80, top: 386, fontWeight: 800, fontSize: 22, letterSpacing: 3, color: C.gray}}>GOAL PROGRESS</div>
				<div
					style={{
						position: 'absolute',
						right: 80,
						top: 378,
						padding: '6px 14px',
						borderRadius: 999,
						fontWeight: 800,
						fontSize: 18,
						letterSpacing: 2,
						color: C.green,
						background: C.greenSoft,
					}}
				>
					IN PROGRESS
				</div>
				<div style={{position: 'absolute', left: 80, right: 80, top: 436, height: 26, borderRadius: 13, background: '#232B28', overflow: 'hidden'}}>
					<div style={{position: 'absolute', top: 0, bottom: 0, left: sweep, width: 200, background: 'linear-gradient(90deg, transparent, rgba(57,255,136,0.55), transparent)'}} />
				</div>
			</div>
			<Svg>
				{/* timeline */}
				<line x1={T.x0} x2={T.x1} y1={T.y} y2={T.y} stroke="#2E3834" strokeWidth={10} strokeLinecap="round" />
				<line x1={T.x0} x2={T.x0 + (T.x1 - T.x0) * draw} y1={T.y} y2={T.y} stroke={C.white} strokeWidth={10} strokeLinecap="round" />
				{Array.from({length: 11}, (_, i) => {
					const x = T.x0 + ((i + 1) / 12) * (T.x1 - T.x0);
					return <line key={i} x1={x} x2={x} y1={T.y + 16} y2={T.y + 30} stroke="#3A4642" strokeWidth={4} strokeLinecap="round" opacity={draw > (i + 1) / 12 ? 1 : 0.2} />;
				})}
				<circle cx={T.x0} cy={T.y} r={18 * tw(f, 8, 16, 0, 1, easeOut)} fill={C.white} />
				<text x={T.x0} y={T.y + 80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.white} opacity={tw(f, 10, 18)}>
					2026
				</text>
				<g opacity={tw(f, 50, 58)}>
					<circle cx={T.x1} cy={T.y} r={22} fill={C.bg} stroke={C.green} strokeWidth={8} />
					<text x={T.x1} y={T.y + 80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.green}>
						2027
					</text>
				</g>
				{/* milestone flag */}
				<g transform={`translate(${T.x1} ${T.y - 20})`}>
					<line x1={0} y1={0} x2={0} y2={-170 * flag} stroke={C.green} strokeWidth={7} strokeLinecap="round" />
					<g transform={`translate(0 ${-170 * flag}) scale(${flag})`} style={{transformOrigin: '0 0'}}>
						<circle cx={-60} cy={34} r={120 * flag} fill={C.green} opacity={0.1} />
						<path d="M 0 0 L -214 0 Q -224 0 -224 10 L -224 64 Q -224 74 -214 74 L 0 74 Z" fill={C.green} />
						<text x={-112} y={50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.bg} letterSpacing={1}>
							DEBT FREE
						</text>
					</g>
				</g>
				<Marcus x={175} y={1330} scale={1.02} pose={pose} expr={expr} frame={f + 390} seed={6} />
				<line x1={40} x2={320} y1={1332} y2={1332} stroke="#1E2523" strokeWidth={3} />
			</Svg>
			<AbsoluteFill style={{background: '#0F3A24', opacity: fromGreen * 0.95}} />
		</AbsoluteFill>
	);
};
