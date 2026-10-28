import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Car} from '../props/Car';
import {ExpenseCard} from '../props/Cards';
import {Doc} from '../props/Paper';
import {Cam, CircleReveal, Svg} from '../Stage';
import {C} from '../theme';
import {TIRE_SCREEN} from './S02FlatTire';

const FLOOR = 1420;
const CAR = {x: TIRE_SCREEN.x - 170 * 0.95, s: 0.95};
const MARCUS = {x: 770, y: 1510, s: 1.12};
/** Paper flies to fill the screen at this local frame; Scene 4 picks it up. */
export const FLY = {start: 34, end: 46};

const Shop: React.FC = () => (
	<>
		<defs>
			<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#141A1C" />
				<stop offset="1" stopColor="#1C2427" />
			</linearGradient>
			<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#252C30" />
				<stop offset="1" stopColor="#0E1214" />
			</linearGradient>
			<pattern id="peg" width={26} height={26} patternUnits="userSpaceOnUse">
				<circle cx={13} cy={13} r={3} fill="#1A1F1F" />
			</pattern>
			<pattern id="hazard" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<rect width={20} height={40} fill="#D7A928" />
				<rect x={20} width={20} height={40} fill="#16191A" />
			</pattern>
			<filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation={18} />
			</filter>
		</defs>
		<rect x={-100} y={0} width={1280} height={FLOOR} fill="url(#wall)" />
		{[620, 740, 860, 980, 1100, 1220, 1340].map((y) => (
			<line key={y} x1={-100} x2={1180} y1={y} y2={y} stroke="#11171A" strokeWidth={3} />
		))}
		{/* fluorescent strips */}
		{[180, 640].map((x) => (
			<g key={x}>
				<rect x={x} y={560} width={300} height={16} rx={8} fill="#EAF7F2" filter="url(#soft)" opacity={0.7} />
				<rect x={x} y={560} width={300} height={14} rx={7} fill="#F2FBF7" />
			</g>
		))}
		<polygon points="180,576 480,576 560,1420 100,1420" fill="#EAF7F2" opacity={0.025} />
		<polygon points="640,576 940,576 1020,1420 560,1420" fill="#EAF7F2" opacity={0.025} />
		{/* pegboard with tools */}
		<rect x={600} y={650} width={420} height={250} rx={8} fill="#2E3433" />
		<rect x={600} y={650} width={420} height={250} rx={8} fill="url(#peg)" />
		<g fill="#8A9290">
			<path d="M 640 690 L 652 690 L 652 840 Q 646 856 640 840 Z" />
			<circle cx={646} cy={690} r={16} />
			<circle cx={646} cy={690} r={7} fill="#2E3433" />
			<path d="M 690 700 L 702 700 L 702 850 L 690 850 Z" />
			<rect x={676} y={690} width={40} height={22} rx={5} />
			<path d="M 750 690 L 760 690 L 772 860 L 738 860 Z" fill="#C2513F" />
			<rect x={748} y={850} width={14} height={30} fill="#8A9290" />
			<path d="M 820 690 Q 840 760 826 860 L 836 862 Q 852 760 832 690 Z" />
			<path d="M 860 690 Q 840 760 854 860 L 844 862 Q 828 760 848 690 Z" />
			<rect x={900} y={700} width={90} height={16} rx={8} />
			<rect x={900} y={740} width={70} height={16} rx={8} />
			<rect x={900} y={780} width={80} height={16} rx={8} />
		</g>
		{/* tool cabinet */}
		<rect x={860} y={1130} width={200} height={290} rx={10} fill="#8E2B2B" />
		{[1150, 1205, 1260, 1315, 1370].map((y) => (
			<g key={y}>
				<rect x={872} y={y} width={176} height={44} rx={5} fill="#A33434" />
				<rect x={920} y={y + 18} width={80} height={7} rx={3.5} fill="#D8DDE0" />
			</g>
		))}
		{/* floor */}
		<rect x={-100} y={FLOOR} width={1280} height={600} fill="url(#floor)" />
		<rect x={-100} y={FLOOR} width={1280} height={4} fill="#323A3E" />
		<rect x={60} y={FLOOR + 10} width={780} height={22} fill="url(#hazard)" opacity={0.8} />
	</>
);

export const S03RepairShop: React.FC = () => {
	const f = useCurrentFrame();
	const reveal = tw(f, 0, 13, 110, 2300, easeIn);
	const lift = tw(f, 2, 24, 0, 80);
	const carY = FLOOR - lift;
	const handIn = tw(f, 6, 16, 0, 1, easeOut);
	const handOut = tw(f, 26, 34, 0, 1, easeIn);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.lookUp, head: -6, gaze: 0.8}), expr: 'curious'},
		{f: 18, pose: P({armF: [84, 4], armB: [-6, 8], lean: 6, head: 4}), expr: 'neutral', dur: 7},
		{f: 26, pose: P({...POSES.holdDoc}), expr: 'confused', dur: 6},
		{f: 36, pose: P({...POSES.holdDoc, lean: 20, head: 34, armF: [44, 56], armB: [28, 66], gaze: 0.85}), expr: 'sad', dur: 9},
	]);
	const facing: 1 | -1 = f < 10 ? -1 : 1;

	// mechanic hand (screen space), Marcus's hand anchor is resolved inside Marcus children
	const mechHand = {x: lerp(1180, 960, handIn) + handOut * 140, y: 1176};

	return (
		<CircleReveal cx={TIRE_SCREEN.x} cy={TIRE_SCREEN.y} r={reveal} ring={C.green} ringW={6}>
			<AbsoluteFill style={{background: C.bg}}>
				<Cam zoom={tw(f, 0, 46, 1.04, 1)} fx={540} fy={1100}>
					<Svg>
						<Shop />
						{/* two-post lift */}
						<rect x={CAR.x - 30} y={760} width={36} height={FLOOR - 760} fill="#3B4650" />
						<rect x={CAR.x - 36} y={FLOOR - 30} width={48} height={30} fill="#2A3239" />
						<g transform={`translate(${CAR.x} ${carY}) scale(${CAR.s})`}>
							<Car id="s3" color={['#5A82BE', '#1C2F52']} headlight={0} />
						</g>
						<rect x={CAR.x - 30} y={carY - 46} width={720} height={16} rx={6} fill="#53606B" />
						<rect x={CAR.x + 60} y={carY - 50} width={40} height={10} fill="#1E2328" />
						<rect x={CAR.x + 520} y={carY - 50} width={40} height={10} fill="#1E2328" />
						{/* mechanic sleeve + hand */}
						{f < 36 ? (
							<g transform={`translate(${mechHand.x} ${mechHand.y})`}>
								<rect x={20} y={-26} width={200} height={52} rx={18} fill="#1F3A5F" />
								<rect x={14} y={-28} width={22} height={56} rx={8} fill="#284A78" />
								<ellipse cx={0} cy={0} rx={26} ry={22} fill="#C68A5E" />
								<rect x={-30} y={-8} width={26} height={14} rx={7} fill="#B57A50" />
							</g>
						) : null}
						{f < 22 ? (
							<g transform={`translate(${mechHand.x - 40} ${mechHand.y - 70}) rotate(-8)`}>
								<Doc w={150} title="ESTIMATE" accent={C.orange} />
							</g>
						) : null}
						<Marcus
							x={MARCUS.x}
							y={MARCUS.y}
							scale={MARCUS.s}
							facing={facing}
							pose={pose}
							expr={expr}
							frame={f + 180}
							seed={3}
						>
							{(j) =>
								f >= 22 && f < FLY.start ? (
									<g transform={`translate(${j.handF.x - 10} ${j.handF.y - 80}) rotate(${-6 + tw(f, 22, 30, 0, 8)})`}>
										<Doc w={150 / MARCUS.s} title="ESTIMATE" accent={C.orange} />
									</g>
								) : null
							}
						</Marcus>
					</Svg>
				</Cam>
				{/* red expense card */}
				<div style={{position: 'absolute', left: 60 - (1 - pop(f, 18, 16, 170)) * 560, top: 610}}>
					<ExpenseCard w={450} title="UNEXPECTED EXPENSE" />
				</div>
				{/* estimate → bill flying toward the camera */}
				{f >= FLY.start ? <FlyingDoc f={f} /> : null}
			</AbsoluteFill>
		</CircleReveal>
	);
};

/** Shared with Scene 4: the paper that fills the frame. */
export const FlyingDoc: React.FC<{f: number}> = ({f}) => {
	const t = tw(f, FLY.start, FLY.end, 0, 1, easeIn);
	const x = lerp(MARCUS.x + 90, 540, t);
	const y = lerp(1080, 960, t);
	const s = lerp(1, 9.5, t);
	const morph = tw(f, FLY.start + 2, FLY.start + 8);
	return (
		<Svg>
			<g transform={`translate(${x} ${y}) scale(${s}) rotate(${lerp(2, -4, t)})`}>
				<g opacity={1 - morph}>
					<Doc w={150} title="ESTIMATE" accent={C.orange} />
				</g>
				<g opacity={morph}>
					<Doc w={150} title="BILL" accent={C.red} />
				</g>
			</g>
		</Svg>
	);
};
