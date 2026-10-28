import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const START = 390;
const L = (g: number) => g - START;
const AGE = L(VO.age);
const GOAL = L(VO.goal);
const TEAR = L(VO.before2027) - 2;
const CAL = {x: 790, y: 900, w: 400, h: 450};

const Page: React.FC<{year: string}> = ({year}) => (
	<g>
		<rect x={-CAL.w / 2} y={-CAL.h / 2} width={CAL.w} height={CAL.h} rx={10} fill="#F6F3EC" />
		<rect x={-CAL.w / 2} y={-CAL.h / 2} width={CAL.w} height={86} rx={10} fill={C.red} />
		<rect x={-CAL.w / 2} y={-CAL.h / 2 + 70} width={CAL.w} height={16} fill={C.red} />
		<text x={0} y={-CAL.h / 2 + 58} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} letterSpacing={6} fill="#FFFFFF">
			GOAL YEAR
		</text>
		<text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} letterSpacing={-4} fill="#15191A">
			{year}
		</text>
		{Array.from({length: 7}, (_, i) => (
			<rect key={i} x={-CAL.w / 2 + 34 + i * 49} y={110} width={30} height={22} rx={4} fill="#DCD7CC" />
		))}
		{Array.from({length: 7}, (_, i) => (
			<rect key={i} x={-CAL.w / 2 + 34 + i * 49} y={146} width={30} height={22} rx={4} fill="#DCD7CC" />
		))}
	</g>
);

export const S06DebtGoalTimeline: React.FC = () => {
	const f = useCurrentFrame();
	const fromGreen = tw(f, 0, 14, 1, 0, easeOut);
	const age = pop(f, AGE, 14, 150);
	const ageBack = tw(f, GOAL - 4, GOAL + 10);
	const cal = pop(f, GOAL - 4, 15, 150);
	const tear = tw(f, TEAR, TEAR + 12, 0, 1, easeIn);
	const stamp = pop(f, TEAR + 7, 9, 220);
	const out = tw(f, 116, 122, 1, 0);
	const push = 1.04 + 0.05 * tw(f, TEAR - 6, 122);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -4, gaze: 0.6}), expr: 'neutral'},
		{f: AGE + 6, pose: P({...POSES.pointSelf}), expr: 'happy', dur: 7, overshoot: true},
		{f: GOAL + 8, pose: P({...POSES.handChin, gaze: 0.9, head: -8}), expr: 'determined', dur: 10},
		{f: TEAR + 4, pose: P({armF: [126, 4], armB: [-12, 8], lean: -2, head: -14}), expr: 'determined', dur: 7, overshoot: true},
		{f: TEAR + 16, pose: P({armF: [126, 4], armB: [-12, 8], lean: -2, head: -14}), expr: 'happy', dur: 6},
	]);

	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 760px 760px at 560px 1000px, rgba(57,255,136,0.07), transparent 70%)'}} />
			<AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 1480px'}}>
				<Svg>
					{/* wall + floor */}
					<rect x={-100} y={1500} width={1280} height={700} fill="#101412" />
					<line x1={-100} x2={1280} y1={1500} y2={1500} stroke="#26302C" strokeWidth={3} />
					{/* huge age numerals */}
					<g transform={`translate(${lerp(400, 300, ageBack)} ${lerp(1060, 1000, ageBack)}) scale(${(0.6 + 0.4 * age) * lerp(1, 0.78, ageBack)})`} opacity={age * lerp(1, 0.35, ageBack)}>
						<text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={560} letterSpacing={-30} fill="none" stroke={C.green} strokeWidth={6}>
							22
						</text>
						<text x={0} y={90} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} letterSpacing={14} fill={C.gray}>
							YEARS OLD
						</text>
					</g>
					{/* tear-off calendar */}
					{cal > 0 ? (
						<g transform={`translate(${CAL.x} ${CAL.y + (1 - cal) * 120}) rotate(${(1 - cal) * 6})`} opacity={Math.min(1, cal * 1.6)}>
							<line x1={0} y1={-CAL.h / 2 - 60} x2={0} y2={-CAL.h / 2} stroke="#3A4441" strokeWidth={4} />
							<circle cx={0} cy={-CAL.h / 2 - 62} r={8} fill="#5B6662" />
							<rect x={-CAL.w / 2 + 10} y={-CAL.h / 2 + 14} width={CAL.w} height={CAL.h} rx={10} fill="#000" opacity={0.45} />
							<Page year="2027" />
							{stamp > 0 ? (
								<g transform={`translate(0 ${CAL.h / 2 - 50}) rotate(-7) scale(${1.6 - 0.6 * stamp})`} opacity={Math.min(1, stamp * 1.4)}>
									<rect x={-150} y={-38} width={300} height={76} rx={12} fill="none" stroke={C.greenDeep} strokeWidth={7} />
									<text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} letterSpacing={3} fill={C.greenDeep}>
										DEBT FREE
									</text>
								</g>
							) : null}
							{tear < 1 ? (
								<g
									transform={`translate(${tear * 160} ${tear * 520}) rotate(${tear * 70} ${-CAL.w / 2} ${-CAL.h / 2 + 86})`}
									opacity={1 - tw(f, TEAR + 7, TEAR + 12)}
								>
									<Page year="2026" />
								</g>
							) : null}
							{[-120, -40, 40, 120].map((x) => (
								<rect key={x} x={x - 8} y={-CAL.h / 2 - 16} width={16} height={34} rx={8} fill="#5B6662" />
							))}
						</g>
					) : null}
					<Marcus x={300} y={1506} scale={1.28} pose={pose} expr={expr} frame={f + 390} fx={f > TEAR + 12 ? ['sparkle'] : []} seed={6} />
				</Svg>
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#0F3A24', opacity: fromGreen * 0.95}} />
		</AbsoluteFill>
	);
};
