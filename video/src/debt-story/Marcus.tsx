import React from 'react';
import {easeIO, lerp} from './anim';
import {C} from './theme';

/**
 * Marcus — white stickman, backward black cap.
 * Rig is authored facing right; `facing=-1` mirrors it. Limb angles are degrees from straight down,
 * positive = toward the facing direction. Elbows bend forward (+), knees bend backward (+).
 * The lowest foot is auto-grounded at y=0 so poses never float or sink.
 */
export type Expr =
	| 'neutral'
	| 'happy'
	| 'confused'
	| 'shocked'
	| 'frustrated'
	| 'sad'
	| 'determined'
	| 'relieved'
	| 'curious'
	| 'deadpan'
	| 'strain';

export type Pose = {
	lean: number;
	head: number;
	armB: [number, number];
	armF: [number, number];
	legB: [number, number];
	legF: [number, number];
	lift: number;
	/** 1 = profile (eyes toward facing), 0 = looking at camera */
	gaze: number;
};

export const BASE: Pose = {
	lean: 0,
	head: 0,
	armB: [-8, 6],
	armF: [8, 8],
	legB: [-6, 2],
	legF: [6, 2],
	lift: 0,
	gaze: 1,
};

export const P = (p: Partial<Pose>): Pose => ({...BASE, ...p});

// Common poses
export const POSES = {
	stand: P({}),
	lookUp: P({head: -22, armB: [-10, 4], armF: [10, 6]}),
	fistPump: P({head: -10, armF: [72, 104], armB: [-14, 10], lean: 3}),
	flinch: P({lean: -10, head: -14, armB: [-40, 60], armF: [42, 70], legB: [-12, 4], legF: [10, 6]}),
	confused: P({head: -16, armF: [30, 125], armB: [-10, 8], lean: -2}),
	inspect: P({lean: 38, head: 22, armF: [64, 18], armB: [40, 30], legB: [36, 118], legF: [74, 128]}),
	handsOnHead: P({lean: -4, head: -6, armF: [128, 92], armB: [-128, -92], legB: [-8, 2], legF: [8, 2], gaze: 0.5}),
	armsUp: P({lean: -6, head: -16, armF: [128, 24], armB: [-128, -24], legB: [-14, 2], legF: [14, 2], gaze: 0.4}),
	shrug: P({lean: 0, head: -4, armF: [38, 92], armB: [-38, -92], gaze: 0}),
	point: P({lean: 4, armF: [92, 4], armB: [-10, 8]}),
	pointSelf: P({lean: 0, armF: [52, 128], armB: [-10, 8], gaze: 0.35}),
	handChin: P({head: -8, armF: [28, 150], armB: [12, 70], lean: 2}),
	slump: P({lean: 16, head: 30, armF: [10, 4], armB: [-2, 4], legB: [-4, 4], legF: [4, 4]}),
	holdDoc: P({lean: 10, head: 24, armF: [58, 52], armB: [40, 70], legB: [-6, 2], legF: [6, 2]}),
	push: P({lean: 38, head: 4, armF: [100, 6], armB: [92, 10], legB: [-34, 6], legF: [24, 30]}),
	sitDesk: P({lean: 6, head: 6, armF: [62, 40], armB: [56, 46], legB: [84, 86], legF: [90, 90]}),
	sitBack: P({lean: -16, head: -12, armF: [12, 6], armB: [4, 6], legB: [84, 86], legF: [92, 92]}),
	thumbsUp: P({head: -4, armF: [56, 100], armB: [-8, 6], gaze: 0.4}),
	cheer: P({head: -14, armF: [150, 10], armB: [-20, 10], lean: -2}),
};

const L = {spine: 150, neck: 12, headR: 44, uArm: 78, fArm: 72, thigh: 92, shin: 90, foot: 22};

const rad = (d: number) => (d * Math.PI) / 180;
type V = {x: number; y: number};
const add = (a: V, d: number, len: number): V => ({x: a.x + Math.sin(rad(d)) * len, y: a.y + Math.cos(rad(d)) * len});

export type Joints = {
	hip: V;
	neck: V;
	shoulder: V;
	head: V;
	headAngle: number;
	elbowB: V;
	handB: V;
	elbowF: V;
	handF: V;
	kneeB: V;
	ankleB: V;
	footB: V;
	kneeF: V;
	ankleF: V;
	footF: V;
};

export const solve = (p: Pose): Joints => {
	const hip = {x: 0, y: 0};
	const up = (d: number, len: number, o: V): V => ({x: o.x + Math.sin(rad(d)) * len, y: o.y - Math.cos(rad(d)) * len});
	const neck = up(p.lean, L.spine, hip);
	const shoulder = up(p.lean, L.spine - 12, hip);
	const headAngle = p.lean + p.head;
	const head = up(headAngle, L.neck + L.headR, neck);
	const elbowB = add(shoulder, p.armB[0], L.uArm);
	const handB = add(elbowB, p.armB[0] + p.armB[1], L.fArm);
	const elbowF = add(shoulder, p.armF[0], L.uArm);
	const handF = add(elbowF, p.armF[0] + p.armF[1], L.fArm);
	const kneeB = add(hip, p.legB[0], L.thigh);
	const ankleB = add(kneeB, p.legB[0] - p.legB[1], L.shin);
	const kneeF = add(hip, p.legF[0], L.thigh);
	const ankleF = add(kneeF, p.legF[0] - p.legF[1], L.shin);
	const footB = {x: ankleB.x + L.foot, y: ankleB.y + 2};
	const footF = {x: ankleF.x + L.foot, y: ankleF.y + 2};
	// auto-ground: lowest ankle sits on y = 0
	const ground = Math.max(ankleB.y, ankleF.y) + 6;
	const dy = -ground - p.lift;
	const sh = (v: V): V => ({x: v.x, y: v.y + dy});
	return {
		hip: sh(hip),
		neck: sh(neck),
		shoulder: sh(shoulder),
		head: sh(head),
		headAngle,
		elbowB: sh(elbowB),
		handB: sh(handB),
		elbowF: sh(elbowF),
		handF: sh(handF),
		kneeB: sh(kneeB),
		ankleB: sh(ankleB),
		footB: sh(footB),
		kneeF: sh(kneeF),
		ankleF: sh(ankleF),
		footF: sh(footF),
	};
};

const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
	lean: lerp(a.lean, b.lean, t),
	head: lerp(a.head, b.head, t),
	armB: [lerp(a.armB[0], b.armB[0], t), lerp(a.armB[1], b.armB[1], t)],
	armF: [lerp(a.armF[0], b.armF[0], t), lerp(a.armF[1], b.armF[1], t)],
	legB: [lerp(a.legB[0], b.legB[0], t), lerp(a.legB[1], b.legB[1], t)],
	legF: [lerp(a.legF[0], b.legF[0], t), lerp(a.legF[1], b.legF[1], t)],
	lift: lerp(a.lift, b.lift, t),
	gaze: lerp(a.gaze, b.gaze, t),
});

/** A pose target reached at frame `f`, travelling from the previous key over `dur` frames (default: all the way). */
export type Key = {f: number; pose: Pose; expr?: Expr; dur?: number; overshoot?: boolean};

const backOut = (t: number) => {
	const c = 1.4;
	return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export const animate = (frame: number, keys: Key[]): {pose: Pose; expr: Expr} => {
	let pose = keys[0].pose;
	let expr: Expr = keys[0].expr ?? 'neutral';
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		const dur = k.dur ?? k.f - keys[i - 1].f;
		const start = k.f - dur;
		if (frame <= start) break;
		const raw = Math.min(1, (frame - start) / Math.max(1, dur));
		const t = k.overshoot ? backOut(raw) : easeIO(raw);
		pose = lerpPose(pose, k.pose, t);
		if (k.expr && raw > 0.25) expr = k.expr;
		if (raw < 1) break;
	}
	return {pose, expr};
};

/** Walk cycle overlay. `phase` advances ~0.09/frame for a relaxed walk. */
export const walk = (p: Pose, phase: number, amt = 1): Pose => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	return {
		...p,
		legF: [p.legF[0] * (1 - amt) + amt * (24 * s), p.legF[1] * (1 - amt) + amt * Math.max(0, 40 * -c + 6)],
		legB: [p.legB[0] * (1 - amt) + amt * (-24 * s), p.legB[1] * (1 - amt) + amt * Math.max(0, 40 * c + 6)],
		armF: [lerp(p.armF[0], -22 * s, amt), lerp(p.armF[1], 18, amt)],
		armB: [lerp(p.armB[0], 22 * s, amt), lerp(p.armB[1], 18, amt)],
		lean: p.lean + amt * 4,
		head: p.head - amt * 2,
	};
};

// ---------- face ----------

const Face: React.FC<{expr: Expr; gaze: number; blink: number}> = ({expr, gaze, blink}) => {
	const ex1 = lerp(-13, 6, gaze);
	const ex2 = lerp(13, 27, gaze);
	const mx = lerp(0, 17, gaze);
	const ink = C.ink;
	let eyeR = 5.6;
	let open = 1;
	let brow: [number, number, number, number] = [0, 0, 0, 0]; // dy1, rot1, dy2, rot2
	let browShow = false;
	let mouth: React.ReactNode = <path d={`M ${mx - 8} 19 Q ${mx} 21 ${mx + 8} 19`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
	let arcEyes: 'up' | 'down' | null = null;
	let lids = false;
	switch (expr) {
		case 'happy':
			arcEyes = 'up';
			mouth = <path d={`M ${mx - 13} 14 Q ${mx} 30 ${mx + 13} 14`} stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
			break;
		case 'relieved':
			arcEyes = 'down';
			mouth = <path d={`M ${mx - 10} 16 Q ${mx} 25 ${mx + 10} 16`} stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
			break;
		case 'confused':
			browShow = true;
			brow = [-8, -12, 0, 6];
			mouth = <path d={`M ${mx - 9} 20 Q ${mx - 4} 15 ${mx} 20 Q ${mx + 4} 25 ${mx + 9} 19`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
			break;
		case 'curious':
			browShow = true;
			brow = [-6, -8, -2, 0];
			eyeR = 6.4;
			mouth = <circle cx={mx + 1} cy={20} r={4} fill={ink} />;
			break;
		case 'shocked':
			browShow = true;
			brow = [-10, -10, -10, 10];
			eyeR = 7.6;
			mouth = <ellipse cx={mx} cy={21} rx={7.5} ry={9.5} fill={ink} />;
			break;
		case 'frustrated':
			browShow = true;
			brow = [2, 20, 2, -20];
			mouth = (
				<g>
					<path d={`M ${mx - 13} 15 L ${mx + 13} 15 L ${mx + 10} 26 L ${mx - 10} 26 Z`} fill={ink} />
					<line x1={mx - 10} y1={20.5} x2={mx + 10} y2={20.5} stroke={C.white} strokeWidth={2.5} />
				</g>
			);
			break;
		case 'strain':
			browShow = true;
			brow = [2, 18, 2, -18];
			open = 0.25;
			mouth = (
				<g>
					<path d={`M ${mx - 12} 16 L ${mx + 12} 16 L ${mx + 10} 24 L ${mx - 10} 24 Z`} fill={ink} />
					<line x1={mx - 10} y1={20} x2={mx + 10} y2={20} stroke={C.white} strokeWidth={2.5} />
				</g>
			);
			break;
		case 'sad':
			browShow = true;
			brow = [-2, -18, -2, 18];
			mouth = <path d={`M ${mx - 10} 23 Q ${mx} 14 ${mx + 10} 23`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
			break;
		case 'determined':
			browShow = true;
			brow = [0, 12, 0, -12];
			mouth = <path d={`M ${mx - 10} 19 Q ${mx + 2} 22 ${mx + 10} 16`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
			break;
		case 'deadpan':
			lids = true;
			open = 0.55;
			mouth = <line x1={mx - 9} y1={20} x2={mx + 9} y2={20} stroke={ink} strokeWidth={4} strokeLinecap="round" />;
			break;
		default:
			break;
	}
	const o = Math.max(0.08, open * blink);
	const eye = (x: number) => {
		if (arcEyes === 'up') return <path key={x} d={`M ${x - 6} 2 Q ${x} -6 ${x + 6} 2`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
		if (arcEyes === 'down') return <path key={x} d={`M ${x - 6} -1 Q ${x} 6 ${x + 6} -1`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
		return (
			<g key={x}>
				<ellipse cx={x} cy={0} rx={eyeR} ry={eyeR * o} fill={ink} />
				{lids ? <line x1={x - 8} y1={-eyeR * o} x2={x + 8} y2={-eyeR * o} stroke={ink} strokeWidth={3.5} strokeLinecap="round" /> : null}
			</g>
		);
	};
	return (
		<g>
			{eye(ex1)}
			{eye(ex2)}
			{browShow ? (
				<g stroke={ink} strokeWidth={4} strokeLinecap="round">
					<line x1={ex1 - 7} y1={-13 + brow[0]} x2={ex1 + 7} y2={-13 + brow[0]} transform={`rotate(${brow[1]} ${ex1} ${-13 + brow[0]})`} />
					<line x1={ex2 - 7} y1={-13 + brow[2]} x2={ex2 + 7} y2={-13 + brow[2]} transform={`rotate(${brow[3]} ${ex2} ${-13 + brow[2]})`} />
				</g>
			) : null}
			{mouth}
		</g>
	);
};

/** Backward snapback: dome on the head, brim pointing behind him. */
const Cap: React.FC<{gaze: number}> = ({gaze}) => {
	const brim = lerp(0.45, 1, gaze);
	return (
		<g>
			{/* brim (behind = -x) */}
			<path
				d={`M -30 -22 Q ${-30 - 36 * brim} -26 ${-36 - 46 * brim} -14 Q ${-38 - 48 * brim} -6 ${-30 - 44 * brim} -5 Q ${-30 - 22 * brim} -10 -26 -12 Z`}
				fill="#141817"
				stroke="#4C5552"
				strokeWidth={2.5}
				strokeLinejoin="round"
			/>
			{/* dome */}
			<path d="M -47 -10 C -50 -62 50 -66 47 -10 Q 0 -20 -47 -10 Z" fill="#141817" stroke="#4C5552" strokeWidth={2.5} strokeLinejoin="round" />
			{/* panel seams + rim light */}
			<path d="M 0 -56 Q -14 -36 -20 -15" stroke="#2C3331" strokeWidth={2} fill="none" />
			<path d="M 0 -56 Q 16 -36 22 -15" stroke="#2C3331" strokeWidth={2} fill="none" />
			<path d="M -36 -42 Q -10 -60 22 -56" stroke="rgba(255,255,255,0.16)" strokeWidth={3} fill="none" strokeLinecap="round" />
			{/* snapback opening at the front */}
			<path d={`M ${lerp(-10, 26, gaze)} -12 Q ${lerp(0, 34, gaze)} -22 ${lerp(10, 42, gaze)} -12`} fill={C.white} stroke="#4C5552" strokeWidth={2} />
			<circle cx={0} cy={-57} r={4.5} fill="#141817" stroke="#4C5552" strokeWidth={2} />
		</g>
	);
};

const seg = (pts: V[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

export type MarcusProps = {
	x: number;
	y: number;
	scale?: number;
	facing?: 1 | -1;
	pose: Pose;
	expr?: Expr;
	frame: number;
	/** subtle idle breathing */
	idle?: boolean;
	/** hide legs (seated behind a desk) */
	noLegs?: boolean;
	shadow?: boolean;
	opacity?: number;
	/** props drawn in Marcus-local, already-mirrored coordinates (scaled with him) */
	children?: (j: Joints) => React.ReactNode;
	/** draws held props between the back arm and the body */
	behind?: (j: Joints) => React.ReactNode;
	seed?: number;
};

export const Marcus: React.FC<MarcusProps> = ({
	x,
	y,
	scale = 1,
	facing = 1,
	pose,
	expr = 'neutral',
	frame,
	idle = true,
	noLegs = false,
	shadow = true,
	opacity = 1,
	children,
	behind,
	seed = 0,
}) => {
	const br = idle ? Math.sin((frame + seed * 13) / 21) : 0;
	const p: Pose = {
		...pose,
		lean: pose.lean + br * 0.9,
		head: pose.head + Math.sin((frame + seed * 7) / 29) * 1.4,
		armF: [pose.armF[0] + br * 1.6, pose.armF[1]],
		armB: [pose.armB[0] - br * 1.4, pose.armB[1]],
	};
	const j = solve(p);
	// blink every ~3.3s, 5 frames
	const cyc = (frame + seed * 37) % 99;
	const blink = cyc < 5 ? Math.abs(cyc - 2.5) / 2.5 : 1;
	const sw = 13;
	const back = '#BCC4C0';
	const mir = (v: V): V => ({x: v.x * facing, y: v.y});
	const mj: Joints = Object.fromEntries(
		Object.entries(j).map(([k, v]) => [k, typeof v === 'number' ? v : mir(v as V)]),
	) as Joints;
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
			{shadow && !noLegs ? <ellipse cx={0} cy={2} rx={70} ry={9} fill="#000" opacity={0.55} /> : null}
			<g transform={`scale(${facing} 1)`} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={seg([j.shoulder, j.elbowB, j.handB])} stroke={back} strokeWidth={sw} />
				<circle cx={j.handB.x} cy={j.handB.y} r={7.5} fill={back} />
				{!noLegs ? <path d={seg([j.hip, j.kneeB, j.ankleB, j.footB])} stroke={back} strokeWidth={sw} /> : null}
			</g>
			{behind ? behind(mj) : null}
			<g transform={`scale(${facing} 1)`} strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d={seg([j.hip, j.neck])} stroke={C.white} strokeWidth={sw + 1} />
				{!noLegs ? <path d={seg([j.hip, j.kneeF, j.ankleF, j.footF])} stroke={C.white} strokeWidth={sw} /> : null}
				<g transform={`translate(${j.head.x} ${j.head.y}) rotate(${j.headAngle * 0.6})`}>
					<circle cx={0} cy={0} r={L.headR} fill={C.white} />
					<g transform="translate(0 5)"><Face expr={expr} gaze={p.gaze} blink={blink} /></g>
					<g transform="translate(0 -7)"><Cap gaze={p.gaze} /></g>
				</g>
				<path d={seg([j.shoulder, j.elbowF, j.handF])} stroke={C.white} strokeWidth={sw} />
				<circle cx={j.handF.x} cy={j.handF.y} r={7.5} fill={C.white} />
			</g>
			{children ? children(mj) : null}
		</g>
	);
};
