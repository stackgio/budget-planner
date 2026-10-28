import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES, walk} from '../Marcus';
import {CheckBadge} from '../props/Icons';
import {Cash, Jar} from '../props/Jar';
import {Doc} from '../props/Paper';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

/*
 * STEP 1 "PAYING OFF DEBT"      grey/red world: Marcus shoves the DEBT block out of frame
 * STEP 2 "STAYING OUT OF DEBT"  green wipe: a new surprise bill gets paid from the jar → check
 */
const START = 952;
const L = (g: number) => g - START;
const FLOOR = 1450;
const WIPE = L(VO.staying) - 6;
const GOAL = L(VO.realGoal);
const BILL_DROP = WIPE + 12;
const PAY = BILL_DROP + 10;

const Title: React.FC<{step: string; lines: string[]; color: string; p: number; size: number}> = ({step, lines, color, p, size}) => (
	<g opacity={Math.min(1, p * 1.4)} transform={`translate(540 ${440 + (1 - p) * 30})`}>
		<rect x={-80} y={-34} width={160} height={50} rx={25} fill="none" stroke={color} strokeWidth={3} />
		<text x={0} y={2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} letterSpacing={4} fill={color}>
			{step}
		</text>
		{lines.map((l, i) => (
			<text key={i} x={0} y={30 + size * 0.95 * (i + 1)} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} letterSpacing={-1.5} fill={i === 0 ? color : C.white}>
				{l}
			</text>
		))}
	</g>
);

export const S10DebtMilestone: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = tw(f, 0, 5, 0, 1, easeOut);
	const out = tw(f, 146, 154, 1, 0);

	// STEP 1
	const push = tw(f, 4, 60, 0, 1, (t) => t * t * 0.6 + t * 0.4);
	const blockX = lerp(560, 1500, push);
	const mxA = Math.min(blockX - 215, 560);
	const pushing = f > 2 && mxA < 558;
	// STEP 2
	const wipe = tw(f, WIPE, WIPE + 9, 0, 1, easeIn);
	const inB = f >= WIPE + 9;
	const billT = tw(f, BILL_DROP, BILL_DROP + 9, 0, 1, easeIn);
	const paid = pop(f, PAY + 10, 9, 230);
	const billAway = tw(f, PAY + 14, PAY + 24, 0, 1, easeIn);
	const goal = pop(f, GOAL, 11, 190);

	const keyedA = animate(f, [
		{f: 0, pose: P({...POSES.push}), expr: 'strain'},
		{f: 44, pose: P({...POSES.push}), expr: 'strain'},
		{f: 56, pose: P({...POSES.stand, head: -4}), expr: 'happy', dur: 10},
	]);
	const poseA = pushing ? walk(keyedA.pose, f * 0.3, 0.6) : keyedA.pose;
	const keyedB = animate(f, [
		{f: WIPE, pose: P({...POSES.stand, head: -6}), expr: 'determined'},
		{f: BILL_DROP + 6, pose: P({...POSES.lookUp, head: -24}), expr: 'curious', dur: 6},
		{f: PAY + 12, pose: P({...POSES.thumbsUp, gaze: 0.6}), expr: 'happy', dur: 8, overshoot: true},
		{f: GOAL + 4, pose: P({...POSES.cheer}), expr: 'happy', dur: 7, overshoot: true},
	]);

	return (
		<AbsoluteFill style={{opacity: fadeIn * out}}>
			{/* STEP 1 world */}
			{!inB ? (
				<AbsoluteFill>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 760px 700px at 540px 1150px, #1E1717 0%, #0B0D0C 75%)'}} />
					<Svg>
						<Title step="STEP 1" lines={['PAYING OFF', 'DEBT']} color={C.white} p={tw(f, 4, 14, 0, 1, easeOut)} size={92} />
						<rect x={-100} y={FLOOR} width={1280} height={900} fill="#101412" />
						<line x1={-100} x2={1280} y1={FLOOR} y2={FLOOR} stroke="#2A2626" strokeWidth={3} />
						{blockX < 1500 ? (
							<g transform={`translate(${blockX} ${FLOOR})`}>
								<rect x={-170} y={-340} width={340} height={340} rx={18} fill="#2A2D2E" stroke="#3E4344" strokeWidth={5} />
								<rect x={-170} y={-340} width={340} height={42} rx={18} fill="#34383A" />
								<text x={0} y={-135} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={92} letterSpacing={4} fill={C.red}>
									DEBT
								</text>
							</g>
						) : null}
						{pushing
							? [0, 1, 2].map((i) => {
									const t = ((f + i * 5) % 15) / 15;
									return <circle key={i} cx={mxA - 90 - t * 60} cy={FLOOR - 8 - t * 20} r={12 * (1 - t)} fill="#3A403E" opacity={1 - t} />;
								})
							: null}
						<Marcus x={mxA} y={FLOOR + 4} scale={1.3} pose={poseA} expr={keyedA.expr} frame={f + 952} fx={pushing ? ['sweat'] : []} seed={10} />
					</Svg>
				</AbsoluteFill>
			) : null}
			{/* STEP 2 world */}
			{f >= WIPE ? (
				<AbsoluteFill style={{clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 800px 760px at 540px 1150px, #10301F 0%, #0B0D0C 78%)'}} />
					<Svg>
						<Title step="STEP 2" lines={['STAYING OUT', 'OF DEBT']} color={C.green} p={tw(f, WIPE + 4, WIPE + 14, 0, 1, easeOut)} size={92} />
						<rect x={-100} y={FLOOR} width={1280} height={900} fill="#0E1712" />
						<line x1={-100} x2={1280} y1={FLOOR} y2={FLOOR} stroke="#1F3A2A" strokeWidth={3} />
						<g transform={`translate(760 ${FLOOR})`}>
							<Jar w={320} fill={0.55 - 0.1 * tw(f, PAY, PAY + 10)} />
						</g>
						{/* a new surprise bill — paid from the jar this time */}
						{f >= BILL_DROP && billAway < 1 ? (
							<g transform={`translate(${billAway > 0 ? lerp(570, 1300, billAway) : lerp(1300, 570, billT)} ${830 - billAway * 120}) rotate(${lerp(24, -6, billT) + billAway * 40}) scale(1.5)`}>
								<Doc w={150} title="SURPRISE BILL" accent={paid > 0.5 ? C.greenDeep : C.red} />
								{paid > 0 ? (
									<g transform={`translate(4 10) rotate(-14) scale(${1.6 - 0.6 * paid})`} opacity={Math.min(1, paid * 1.5)}>
										<rect x={-56} y={-22} width={112} height={44} rx={6} fill="rgba(255,255,255,0.88)" stroke={C.greenDeep} strokeWidth={4} />
										<text x={0} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} letterSpacing={2} fill={C.greenDeep}>
											PAID
										</text>
									</g>
								) : null}
							</g>
						) : null}
						{[0, 1].map((i) => {
							const t = tw(f, PAY + i * 4, PAY + i * 4 + 10, 0, 1, easeIn);
							if (t <= 0 || t >= 1) return null;
							return (
								<g key={i} transform={`translate(${lerp(760, 590, t)} ${lerp(1150, 860, t) - Math.sin(t * Math.PI) * 160}) rotate(${t * 30})`}>
									<Cash w={150} />
								</g>
							);
						})}
						{goal > 0 ? (
							<g>
								<g transform={`translate(540 ${745}) scale(${goal})`}>
									<rect x={-210} y={-44} width={420} height={88} rx={44} fill={C.green} />
									<text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} letterSpacing={2} fill={C.bg}>
										THE REAL GOAL
									</text>
								</g>
								<g transform={`translate(760 ${FLOOR - 480}) scale(${goal})`}>
									<CheckBadge r={52} p={tw(f, GOAL + 2, GOAL + 10)} />
								</g>
							</g>
						) : null}
						<Marcus x={290} y={FLOOR + 4} scale={1.3} pose={keyedB.pose} expr={keyedB.expr} frame={f + 952} fx={f > GOAL ? ['sparkle'] : []} seed={10} />
					</Svg>
					{/* wipe edge */}
					{wipe < 1 ? <div style={{position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 14, marginLeft: -14, background: C.green}} /> : null}
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
