import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from '../../brand/theme';
import {clamp, springAt, springs} from '../../lib/motion';
import {blendPose, type Expression, type Pose, type PoseName, poses} from './poses';

export type CharacterKey = {
	frame: number;
	pose?: PoseName | Pose;
	expression?: Expression;
	/** Transition length into this pose in frames (default 9). */
	duration?: number;
	/** Spring feel of the transition. */
	feel?: keyof typeof springs;
};

type Props = {
	/** Ground point (between the feet) in composition px. */
	x: number;
	y: number;
	/** Standing height in px (feet to top of cap). */
	height?: number;
	facing?: 1 | -1;
	keys: CharacterKey[];
	/** 0 = off, 1 = on the eyes, >1 slides down the nose. Drive with a spring. */
	sunglasses?: number;
	/** 0–1 sweat drop. */
	sweat?: number;
	holding?: 'phone' | null;
	/** Breathing + blinking. */
	alive?: boolean;
	style?: React.CSSProperties;
};

// Rig proportions (units at height = 480).
const R = {thigh: 86, shin: 84, torso: 138, upper: 74, fore: 68, neck: 54, head: 50, stroke: 14};
const BASE_HEIGHT = 426; // ground to top of cap at scale 1
const VB = {x: -260, y: -560, w: 520, h: 620};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number, len: number): [number, number] => [Math.sin(rad(a)) * len, Math.cos(rad(a)) * len];
const add = (p: [number, number], q: [number, number]): [number, number] => [p[0] + q[0], p[1] + q[1]];

const resolvePose = (p: PoseName | Pose | undefined, fallback: Pose) => (p === undefined ? fallback : typeof p === 'string' ? poses[p] : p);

/** Chain-blend keys so each transition starts from wherever the last one was. */
const usePose = (keys: CharacterKey[], frame: number, fps: number) => {
	const sorted = [...keys].sort((a, b) => a.frame - b.frame);
	let pose = resolvePose(sorted[0]?.pose, poses.idle);
	let expression: Expression = sorted[0]?.expression ?? 'neutral';
	let lastChange = sorted[0]?.frame ?? 0;
	for (const k of sorted.slice(1)) {
		if (frame < k.frame) break;
		if (k.pose !== undefined) {
			const t = springAt(frame, fps, k.frame, springs[k.feel ?? 'soft'], k.duration ?? 9);
			pose = blendPose(pose, resolvePose(k.pose, pose), t);
		}
		if (k.expression) {
			expression = k.expression;
			lastChange = k.frame;
		}
	}
	return {pose, expression, lastChange};
};

export const Stickman: React.FC<Props> = ({
	x,
	y,
	height = 640,
	facing = 1,
	keys,
	sunglasses = 0,
	sweat = 0,
	holding = null,
	alive = true,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {pose: p, expression, lastChange} = usePose(keys, frame, fps);

	// Idle life: slow breathing in the torso and shoulders.
	const breath = alive ? Math.sin(frame / 19) : 0;
	const lean = p.lean + breath * 0.8;
	const shrug = p.shrug + (breath + 1) * 1.2;

	// Forward kinematics, facing right, y down, origin = ground between feet.
	const legExtent = (l: {h: number; k: number}) => dir(l.h, R.thigh)[1] + dir(l.h - l.k, R.shin)[1];
	const hip: [number, number] = [0, -Math.max(legExtent(p.legNear), legExtent(p.legFar)) - p.lift];
	const neck = add(hip, dir(180 - lean, R.torso));
	const shoulder: [number, number] = [neck[0] + (hip[0] - neck[0]) * 0.1, neck[1] + (hip[1] - neck[1]) * 0.1 - shrug];
	const arm = (a: {s: number; e: number}, wobble: number) => {
		const elbow = add(shoulder, dir(a.s - lean + wobble, R.upper));
		const hand = add(elbow, dir(a.s + a.e - lean + wobble, R.fore));
		return {elbow, hand};
	};
	const leg = (l: {h: number; k: number}) => {
		const knee = add(hip, dir(l.h, R.thigh));
		const ankle = add(knee, dir(l.h - l.k, R.shin));
		const toe = add(ankle, [20, p.lift > 5 ? 6 : 1]);
		return {knee, ankle, toe};
	};
	const nearArm = arm(p.armNear, breath * 1.5);
	const farArm = arm(p.armFar, -breath * 1.2);
	const nearLeg = leg(p.legNear);
	const farLeg = leg(p.legFar);
	const head = add(neck, dir(180 - lean - p.tilt * 0.3, R.neck));
	const headRot = lean + p.tilt + (alive ? Math.sin(frame / 31) * 1.2 : 0);

	// Blink every ~3.2s, never during the first frames of a new expression.
	const blinkPhase = (frame + 40) % 96;
	const blink = alive && frame - lastChange > 6 ? interpolate(blinkPhase, [0, 2, 4], [1, 0.12, 1], clamp) : 1;

	const s = height / BASE_HEIGHT;
	const line = (pts: [number, number][], color: string = colors.white) => (
		<polyline
			points={pts.map((q) => q.join(',')).join(' ')}
			fill="none"
			stroke={color}
			strokeWidth={R.stroke}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	);
	const far = '#CFCFCA';

	return (
		<svg
			viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
			width={VB.w * s}
			height={VB.h * s}
			style={{position: 'absolute', left: x - (-VB.x) * s, top: y - (-VB.y) * s, overflow: 'visible', ...style}}
		>
			{/* Contact shadow shrinks as he leaves the ground */}
			<ellipse
				cx={0}
				cy={4}
				rx={interpolate(p.lift, [0, 100], [70, 40], clamp)}
				ry={10}
				fill="black"
				opacity={interpolate(p.lift, [0, 100], [0.45, 0.18], clamp)}
			/>
			<g transform={`scale(${facing}, 1)`}>
				{line([shoulder, farArm.elbow, farArm.hand], far)}
				{line([hip, farLeg.knee, farLeg.ankle, farLeg.toe], far)}
				{line([hip, neck])}
				{line([hip, nearLeg.knee, nearLeg.ankle, nearLeg.toe])}
				{p.nearArmBehind ? line([shoulder, nearArm.elbow, nearArm.hand]) : null}
				<g transform={`translate(${head[0]} ${head[1]}) rotate(${headRot})`}>
					<circle r={R.head} fill={colors.white} />
					<Face expression={expression} blink={blink} />
					<Cap />
					{sunglasses > 0 ? <Sunglasses amount={sunglasses} /> : null}
					{sweat > 0 ? <Sweat amount={sweat} /> : null}
				</g>
				{p.nearArmBehind ? null : line([shoulder, nearArm.elbow, nearArm.hand])}
				{holding === 'phone' ? <HeldPhone at={nearArm.hand} /> : null}
			</g>
		</svg>
	);
};

const INK = '#0B0B0C';

const Face: React.FC<{expression: Expression; blink: number}> = ({expression, blink}) => {
	const stroke = {stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none'};
	const eyes = (rx: number, ry: number) => (
		<g>
			<ellipse cx={10} cy={2} rx={rx} ry={ry * blink} fill={INK} />
			<ellipse cx={32} cy={0} rx={rx} ry={ry * blink} fill={INK} />
		</g>
	);
	switch (expression) {
		case 'happy':
			return (
				<g>
					<path d="M 3 1 Q 10 -10 17 1" {...stroke} />
					<path d="M 25 -1 Q 32 -12 39 -1" {...stroke} />
					<path d="M 8 15 Q 24 40 42 12 Z" fill={INK} />
				</g>
			);
		case 'shocked':
			return (
				<g>
					<circle cx={9} cy={-4} r={9.5 * blink} fill={INK} />
					<circle cx={33} cy={-6} r={9.5 * blink} fill={INK} />
					<circle cx={12} cy={-7} r={2.6} fill="white" opacity={blink} />
					<circle cx={36} cy={-9} r={2.6} fill="white" opacity={blink} />
					<path d="M -1 -22 L 14 -27" {...stroke} />
					<path d="M 26 -29 L 41 -27" {...stroke} />
					<ellipse cx={24} cy={25} rx={8} ry={11} fill={INK} />
				</g>
			);
		case 'deadpan':
			return (
				<g>
					<path d="M 2 -4 L 18 -4" {...stroke} />
					<path d="M 24 -6 L 40 -6" {...stroke} />
					<ellipse cx={10} cy={-0.5} rx={4.5} ry={3.2} fill={INK} />
					<ellipse cx={32} cy={-2.5} rx={4.5} ry={3.2} fill={INK} />
					<path d="M 14 25 L 35 24" {...stroke} />
				</g>
			);
		case 'smug':
			return (
				<g>
					<path d="M 3 -3 Q 10 3 17 -3" {...stroke} />
					<path d="M 25 -5 Q 32 1 39 -5" {...stroke} />
					<path d="M 24 -20 L 40 -23" {...stroke} />
					<path d="M 13 22 Q 28 29 39 15" {...stroke} />
				</g>
			);
		case 'worried':
			return (
				<g>
					{eyes(5, 7.5)}
					<path d="M 2 -17 L 15 -13" {...stroke} />
					<path d="M 26 -15 L 40 -20" {...stroke} />
					<path d="M 12 26 Q 18 20 24 26 Q 30 32 37 25" {...stroke} />
				</g>
			);
		default:
			return (
				<g>
					{eyes(5, 7.5)}
					<path d="M 14 22 Q 24 27 34 21" {...stroke} />
				</g>
			);
	}
};

// Backward black cap: dome over the crown, brim pointing behind the head,
// snapback opening at the forehead. Edges get a soft rim so it reads on black.
const Cap: React.FC = () => (
	<g>
		<path d="M -40 -15 Q -80 -23 -100 -8 Q -96 2 -40 -4 Z" fill="#0E0E10" stroke="#3A3A41" strokeWidth={3} strokeLinejoin="round" />
		<path d="M -51.5 -8 A 53 53 0 0 1 49 -19 Q 2 -6 -51.5 -8 Z" fill="#0E0E10" stroke="#3A3A41" strokeWidth={3} />
		<path d="M -2 -52 Q 4 -30 2 -6" stroke="#26262B" strokeWidth={2.5} fill="none" />
		<path d="M -30 -43 Q -18 -26 -22 -6" stroke="#26262B" strokeWidth={2.5} fill="none" />
		<circle cx={0} cy={-53} r={5} fill="#0E0E10" stroke="#3A3A41" strokeWidth={2} />
	</g>
);

const Sunglasses: React.FC<{amount: number}> = ({amount}) => {
	const drop = interpolate(amount, [0, 1], [-150, 0], clamp);
	const slide = amount > 1 ? (amount - 1) * 24 : 0;
	return (
		<g transform={`translate(0 ${drop + slide})`} opacity={interpolate(amount, [0, 0.3], [0, 1], clamp)}>
			<path d="M -6 -8 L -44 -12" stroke={INK} strokeWidth={5} strokeLinecap="round" />
			<rect x={-4} y={-12} width={25} height={17} rx={6} fill={INK} />
			<rect x={25} y={-14} width={25} height={17} rx={6} fill={INK} />
			<path d="M 20 -6 L 26 -7" stroke={INK} strokeWidth={5} />
			<path d="M 2 -8 L 10 -8" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
			<path d="M 31 -10 L 39 -10" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
		</g>
	);
};

const Sweat: React.FC<{amount: number}> = ({amount}) => (
	<g transform={`translate(${54} ${-30 + amount * 14}) scale(${amount})`} opacity={interpolate(amount, [0, 0.2], [0, 1], clamp)}>
		<path d="M 0 -14 Q 9 0 0 6 Q -9 0 0 -14 Z" fill="#9AD8FF" stroke={INK} strokeWidth={2} />
	</g>
);

const HeldPhone: React.FC<{at: [number, number]}> = ({at}) => (
	<g transform={`translate(${at[0]} ${at[1]}) rotate(-8)`}>
		<rect x={-14} y={-46} width={28} height={50} rx={6} fill="#111113" stroke="#3A3A41" strokeWidth={2.5} />
		<rect x={-10} y={-41} width={20} height={38} rx={3} fill={colors.green} opacity={0.85} />
	</g>
);
