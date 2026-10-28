import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES, walk} from '../Marcus';
import {FundCard} from '../props/Cards';
import {CheckBadge} from '../props/Icons';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const START = 952;
const L = (g: number) => g - START;
const FLOOR = 1400;
const N1 = 400;
const N2 = 780;
const TRACK = {x0: 110, x1: 970};
const STAY = L(VO.staying);
const GOAL = L(VO.realGoal);

export const S10DebtMilestone: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = tw(f, 0, 8, 0, 1, easeOut);
	// part A: push the block
	const push = tw(f, 6, 58, 0, 1, (t) => t * t * 0.6 + t * 0.4);
	const blockX = lerp(470, 1420, push);
	const mxA = Math.min(blockX - 175, N1);
	const barFill = tw(f, 8, 58, 0, 1);
	// part B: bar → two-stage track
	const morph = tw(f, STAY - 10, STAY + 4, 0, 1);
	const barY = 770;
	const walkT = tw(f, STAY + 4, GOAL - 2, 0, 1);
	const mx = f < STAY ? mxA : lerp(N1, N2 - 50, walkT);
	const stage2 = walkT;
	const done = pop(f, GOAL, 10, 200);
	const card = tw(f, GOAL - 8, GOAL + 6, 0, 1, easeOut);

	const pushing = f > 4 && mxA < N1 - 2;
	const walking = (pushing ? 1 : 0) * 0.6 + (f > STAY + 4 && walkT < 1 ? 1 : 0);
	const keyed = animate(f, [
		{f: 0, pose: P({...POSES.push}), expr: 'strain'},
		{f: 40, pose: P({...POSES.push}), expr: 'strain'},
		{f: 52, pose: P({...POSES.stand, head: -4}), expr: 'happy', dur: 10},
		{f: STAY - 2, pose: P({...POSES.stand, head: -20}), expr: 'curious', dur: 8},
		{f: STAY + 8, pose: P({...POSES.stand, head: -6}), expr: 'determined', dur: 6},
		{f: GOAL + 4, pose: P({...POSES.cheer}), expr: 'happy', dur: 7, overshoot: true},
	]);
	const pose = walking > 0 ? walk(keyed.pose, f * 0.32, Math.min(1, walking)) : keyed.pose;
	const segA = TRACK.x0 + (N1 - TRACK.x0) * (morph > 0 ? 1 : barFill);

	return (
		<AbsoluteFill style={{opacity: fadeIn * tw(f, 146, 154, 1, 0)}}>
			<Svg>
				<rect x={-100} y={FLOOR} width={1280} height={600} fill="#101412" />
				<line x1={-100} x2={1280} y1={FLOOR} y2={FLOOR} stroke="#26302C" strokeWidth={3} />
				{/* progress bar / track */}
				<g>
					<rect x={TRACK.x0} y={barY - 15} width={TRACK.x1 - TRACK.x0} height={30} rx={15} fill="#232B28" />
					{morph < 1 ? (
						<rect x={TRACK.x0} y={barY - 15} width={(TRACK.x1 - TRACK.x0) * barFill * (1 - morph) + (N1 - TRACK.x0) * morph} height={30} rx={15} fill={C.green} />
					) : (
						<rect x={TRACK.x0} y={barY - 15} width={segA - TRACK.x0 + (N2 - N1) * stage2} height={30} rx={15} fill={C.green} />
					)}
					{morph > 0 ? (
						<g opacity={morph}>
							{[
								{x: N1, label: 'PAY OFF DEBT', on: 1},
								{x: N2, label: 'STAY OUT OF DEBT', on: done},
							].map((n, i) => (
								<g key={i} transform={`translate(${n.x} ${barY})`}>
									<circle r={30} fill={C.bg} stroke={n.on > 0.5 ? C.green : '#3A4642'} strokeWidth={8} />
									{n.on > 0 ? <CheckBadge r={22} p={Math.min(1, n.on)} /> : null}
									<text y={-62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={i ? 34 : 30} letterSpacing={1} fill={i ? C.white : C.gray}>
										{n.label}
									</text>
									<text y={-102} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} letterSpacing={3} fill={i ? C.green : C.grayDim}>
										{i ? 'STAGE 2' : 'STAGE 1'}
									</text>
								</g>
							))}
						</g>
					) : null}
				</g>
				{/* the debt block */}
				{blockX < 1400 ? (
					<g transform={`translate(${blockX} ${FLOOR})`}>
						<rect x={-150} y={-280} width={300} height={280} rx={16} fill="#2A2D2E" stroke="#3E4344" strokeWidth={4} />
						<rect x={-150} y={-280} width={300} height={36} rx={16} fill="#34383A" />
						<text x={0} y={-112} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={76} letterSpacing={4} fill={C.red}>
							DEBT
						</text>
						{[-110, -60, 60, 110].map((x) => (
							<line key={x} x1={x} y1={-20} x2={x - 10} y2={-6} stroke="#1E2122" strokeWidth={4} />
						))}
					</g>
				) : null}
				{pushing
					? [0, 1, 2].map((i) => {
							const t = ((f + i * 5) % 15) / 15;
							return <circle key={i} cx={mx - 70 - t * 60} cy={FLOOR - 8 - t * 20} r={10 * (1 - t)} fill="#3A403E" opacity={1 - t} />;
						})
					: null}
				{done > 0
					? Array.from({length: 12}, (_, i) => {
							const a = (i / 12) * Math.PI * 2;
							const r = 40 + tw(f, GOAL, GOAL + 14, 0, 70, easeOut);
							return <line key={i} x1={N2 + Math.cos(a) * r} y1={barY + Math.sin(a) * r} x2={N2 + Math.cos(a) * (r + 22)} y2={barY + Math.sin(a) * (r + 22)} stroke={C.green} strokeWidth={5} strokeLinecap="round" opacity={1 - tw(f, GOAL + 4, GOAL + 16)} />;
						})
					: null}
				<Marcus x={mx} y={FLOOR + 4} scale={1.08} pose={pose} expr={keyed.expr} frame={f + 952} seed={10} />
			</Svg>
			{/* emergency fund settles beside him */}
			{card > 0 ? (
				<div style={{position: 'absolute', left: 800, top: lerp(1080, 1170, card), opacity: card, transform: `rotate(${lerp(-8, 0, card)}deg)`}}>
					<FundCard w={230} meter={0.78} glow={0.8} />
				</div>
			) : null}
		</AbsoluteFill>
	);
};
