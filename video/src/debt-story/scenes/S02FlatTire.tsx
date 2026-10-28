import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, noise, pop, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Car, FRONT_WHEEL} from '../props/Car';
import {Cam, CircleReveal, Svg} from '../Stage';
import {C} from '../theme';
import {HOOK_WARN} from '../layout';

export const CAR = {x: 250, y: 1400, s: 1.25};
export const TIRE_SCREEN = {x: CAR.x + FRONT_WHEEL.x * CAR.s, y: CAR.y + FRONT_WHEEL.y * CAR.s + 14};

/** Night skyline + street, parallax by camera progress `p`. */
export const Street: React.FC<{p: number}> = ({p}) => {
	const bldg = [
		[0, 860, 150],
		[140, 760, 120],
		[250, 900, 170],
		[410, 700, 130],
		[530, 820, 160],
		[680, 740, 120],
		[790, 880, 150],
		[930, 780, 160],
	];
	return (
		<>
			<defs>
				<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#0B0D0C" />
					<stop offset="1" stopColor="#111A1E" />
				</linearGradient>
				<linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1B1F21" />
					<stop offset="1" stopColor="#0C0E0F" />
				</linearGradient>
				<radialGradient id="lamp">
					<stop offset="0" stopColor="#FFE2A8" stopOpacity={0.35} />
					<stop offset="1" stopColor="#FFE2A8" stopOpacity={0} />
				</radialGradient>
			</defs>
			<rect x={-200} y={0} width={1480} height={1300} fill="url(#sky)" />
			<g transform={`translate(${-p * 30} 0)`}>
				{bldg.map(([x, top, w], i) => (
					<g key={i}>
						<rect x={x} y={top} width={w} height={1300 - top} fill={i % 2 ? '#131917' : '#161D1B'} />
						{Array.from({length: Math.floor((1250 - top) / 46)}, (_, r) =>
							Array.from({length: Math.floor(w / 36)}, (_, c) =>
								noise(i * 97 + r * 13 + c) > 0.45 ? (
									<rect key={`${r}-${c}`} x={x + 12 + c * 36} y={top + 22 + r * 46} width={14} height={20} fill="#E8C987" opacity={0.18 + 0.12 * noise(r + c * 7 + i)} />
								) : null,
							),
						)}
					</g>
				))}
			</g>
			{/* street lamp */}
			<g transform={`translate(${880 - p * 60} 0)`}>
				<circle cx={0} cy={960} r={210} fill="url(#lamp)" />
				<rect x={-6} y={950} width={12} height={350} fill="#262C2D" />
				<path d="M 0 952 Q 0 930 -40 930 L -60 930" stroke="#262C2D" strokeWidth={10} fill="none" />
				<rect x={-80} y={926} width={40} height={14} rx={5} fill="#FFE9BE" />
			</g>
			{/* sidewalk + road */}
			<rect x={-200} y={1300} width={1480} height={34} fill="#22282A" />
			<rect x={-200} y={1334} width={1480} height={700} fill="url(#road)" />
			<rect x={-200} y={1334} width={1480} height={4} fill="#2E3537" />
			{Array.from({length: 9}, (_, i) => (
				<rect key={i} x={-200 + i * 200 - p * 80} y={1600} width={110} height={10} rx={5} fill="#D9DAD2" opacity={0.22} />
			))}
		</>
	);
};

export const S02FlatTire: React.FC = () => {
	const f = useCurrentFrame();
	const flat = tw(f, 11, 32, 0, 1, (t) => 1 - Math.pow(1 - t, 2.2));
	const zoom = tw(f, 4, 40, 1, 1.32);
	const reveal = tw(f, 0, 13, 40, 2300, easeIn);
	const ring = tw(f, 36, 50, 0, 1, easeOut);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: 14}), expr: 'neutral'},
		{f: 12, pose: P({...POSES.stand, head: 24, lean: 6}), expr: 'curious'},
		{f: 24, pose: POSES.inspect, expr: 'shocked', dur: 10},
		{f: 38, pose: POSES.handsOnHead, expr: 'frustrated', dur: 10, overshoot: true},
	]);

	return (
		<CircleReveal cx={HOOK_WARN.x} cy={HOOK_WARN.y} r={reveal} ring={C.red}>
			<AbsoluteFill style={{background: C.bg}}>
				<Cam zoom={zoom} fx={TIRE_SCREEN.x} fy={TIRE_SCREEN.y}>
					<Svg>
						<Street p={tw(f, 0, 50)} />
						<g transform={`translate(${CAR.x} ${CAR.y}) scale(${CAR.s})`}>
							<Car flat={flat} id="s2" />
						</g>
						{/* air hiss */}
						{f > 11 && f < 36
							? [0, 1, 2].map((i) => {
									const t = ((f - 11 + i * 4) % 12) / 12;
									return (
										<path
											key={i}
											d={`M ${TIRE_SCREEN.x - 70 - t * 70} ${TIRE_SCREEN.y + 50 - i * 22} q -22 -8 -40 0`}
											stroke={C.white}
											strokeWidth={4}
											fill="none"
											strokeLinecap="round"
											opacity={(1 - t) * 0.6}
										/>
									);
								})
							: null}
						<Marcus x={250} y={1450} scale={1.05} pose={pose} expr={expr} frame={f + 140} fx={f > 30 ? ['sweat', 'anger'] : f > 18 ? ['shock'] : []} seed={2} />
						{/* inspection reticle forming around the tyre */}
						{ring > 0 ? (
							<g transform={`translate(${TIRE_SCREEN.x} ${TIRE_SCREEN.y}) rotate(${ring * 60})`} opacity={ring}>
								<circle r={92 + ring * 16} fill="none" stroke={C.green} strokeWidth={4} strokeDasharray="18 12" />
								{[0, 90, 180, 270].map((a) => (
									<line key={a} x1={0} y1={-112 - ring * 16} x2={0} y2={-134 - ring * 16} stroke={C.green} strokeWidth={5} transform={`rotate(${a})`} />
								))}
							</g>
						) : null}
					</Svg>
				</Cam>
				{/* tyre-pressure warning light */}
				{f >= 22 ? (
					<Svg>
						<g transform={`translate(${TIRE_SCREEN.x + 210} ${TIRE_SCREEN.y - 330}) scale(${pop(f, 22, 10, 220)})`}>
							<rect x={-82} y={-82} width={164} height={164} rx={34} fill="#141716" stroke="#2C3230" strokeWidth={4} />
							<circle r={70} fill={C.orange} opacity={0.12 + 0.1 * Math.sin(f / 2)} />
							<path d="M -40 -30 Q -52 0 -36 34 L 36 34 Q 52 0 40 -30" fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" />
							{[-24, -8, 8, 24].map((x) => (
								<line key={x} x1={x} y1={34} x2={x} y2={46} stroke={C.orange} strokeWidth={7} strokeLinecap="round" />
							))}
							<rect x={-5} y={-24} width={10} height={32} rx={5} fill={C.orange} />
							<circle cx={0} cy={20} r={6} fill={C.orange} />
						</g>
					</Svg>
				) : null}
			</AbsoluteFill>
		</CircleReveal>
	);
};
