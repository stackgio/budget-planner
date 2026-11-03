import React from 'react';
import {spring, useCurrentFrame, useVideoConfig, type SpringConfig} from 'remotion';
import {mix, springs, wobble} from '../lib/motion';
import {story} from '../theme';

/**
 * MARCUS — Stack With Gio's recurring character.
 * White stickman, black outline, backward black cap. Never change his
 * proportions per video; animate him with `track` keys instead.
 *
 * Rig (facing right, degrees): limb angles are absolute, 0 = straight down,
 * +90 = toward where he faces, 180 = straight up. Elbow/knee angles are
 * relative to the parent limb. He is auto-grounded: the lowest foot always
 * rests on (x, y) unless a pose or cycle lifts him.
 */

export type Pose = {
	lean: number; // torso, + = forward
	head: number; // head tilt, + = nod forward
	fs: number; // front shoulder
	fe: number; // front elbow (relative)
	bs: number; // back shoulder
	be: number; // back elbow
	fh: number; // front hip
	fk: number; // front knee (relative, negative bends back)
	bh: number;
	bk: number;
	lift: number; // px off the ground (jumps)
};

export type Face = {
	browTilt: number; // + angry/determined, - worried/surprised
	browY: number;
	eyeH: number;
	mouthCurve: number; // + smile, - frown
	mouthOpen: number;
	mouthW: number;
	lookX: number;
	lookY: number;
	sweat: number; // 0..1
};

export const POSES = {
	idle: {lean: 2, head: 0, fs: 10, fe: 8, bs: -12, be: -8, fh: 9, fk: -3, bh: -9, bk: -3, lift: 0},
	relaxed: {lean: 0, head: 4, fs: 14, fe: 22, bs: -14, be: -22, fh: 8, fk: -2, bh: -8, bk: -2, lift: 0},
	shock: {lean: -14, head: -12, fs: 100, fe: 52, bs: -98, be: -52, fh: 16, fk: -20, bh: -14, bk: -14, lift: 0},
	flinch: {lean: -20, head: -16, fs: 96, fe: 66, bs: 62, be: 72, fh: 22, fk: -26, bh: -20, bk: -10, lift: 0},
	worried: {lean: -4, head: -6, fs: 120, fe: 95, bs: -120, be: -95, fh: 8, fk: -4, bh: -8, bk: -4, lift: 0},
	point: {lean: 4, head: -6, fs: 112, fe: 4, bs: -14, be: -12, fh: 10, fk: -3, bh: -10, bk: -3, lift: 0},
	present: {lean: 3, head: 4, fs: 62, fe: 38, bs: -14, be: -10, fh: 9, fk: -3, bh: -9, bk: -3, lift: 0},
	hold: {lean: 2, head: 6, fs: 40, fe: 58, bs: 34, be: 64, fh: 8, fk: -2, bh: -8, bk: -2, lift: 0},
	feed: {lean: 10, head: 10, fs: 82, fe: 6, bs: -18, be: -14, fh: 16, fk: -6, bh: -12, bk: -6, lift: 0},
	push: {lean: 16, head: 4, fs: 86, fe: 4, bs: 80, be: 8, fh: 26, fk: -10, bh: -24, bk: -14, lift: 0},
	stop: {lean: -6, head: -4, fs: 92, fe: 82, bs: -22, be: -18, fh: 12, fk: -4, bh: -12, bk: -4, lift: 0},
	celebrate: {lean: -3, head: -10, fs: 138, fe: 18, bs: -138, be: -18, fh: 12, fk: -6, bh: -12, bk: -6, lift: 0},
	fist: {lean: 2, head: -4, fs: 30, fe: 120, bs: -16, be: -12, fh: 12, fk: -4, bh: -12, bk: -4, lift: 0},
	think: {lean: 0, head: 8, fs: 26, fe: 128, bs: 30, be: 70, fh: 8, fk: -2, bh: -8, bk: -2, lift: 0},
	shrug: {lean: 0, head: 6, fs: 42, fe: 78, bs: -42, be: -78, fh: 9, fk: -3, bh: -9, bk: -3, lift: 0},
	sit: {lean: 6, head: 8, fs: 22, fe: 64, bs: 18, be: 70, fh: 88, fk: -88, bh: 82, bk: -84, lift: 0},
	sitType: {lean: 12, head: 14, fs: 34, fe: 66, bs: 28, be: 72, fh: 88, fk: -88, bh: 82, bk: -84, lift: 0},
	walk: {lean: 4, head: 0, fs: 0, fe: 10, bs: 0, be: -10, fh: 0, fk: -8, bh: 0, bk: -8, lift: 0},
} satisfies Record<string, Pose>;

export const FACES = {
	neutral: {browTilt: 0, browY: 0, eyeH: 1, mouthCurve: 3, mouthOpen: 0, mouthW: 1, lookX: 0, lookY: 0, sweat: 0},
	happy: {browTilt: -6, browY: -3, eyeH: 0.92, mouthCurve: 11, mouthOpen: 5, mouthW: 1.25, lookX: 0, lookY: 0, sweat: 0},
	joy: {browTilt: -10, browY: -5, eyeH: 0.75, mouthCurve: 13, mouthOpen: 10, mouthW: 1.35, lookX: 0, lookY: -1, sweat: 0},
	shock: {browTilt: -14, browY: -7, eyeH: 1.4, mouthCurve: 0, mouthOpen: 13, mouthW: 0.72, lookX: 0, lookY: 0, sweat: 0.6},
	worried: {browTilt: -16, browY: -3, eyeH: 1.08, mouthCurve: -7, mouthOpen: 0, mouthW: 0.9, lookX: 0, lookY: 0, sweat: 1},
	determined: {browTilt: 16, browY: 2, eyeH: 0.86, mouthCurve: -1, mouthOpen: 0, mouthW: 0.85, lookX: 1, lookY: 0, sweat: 0},
	focused: {browTilt: 9, browY: 1, eyeH: 0.82, mouthCurve: 0, mouthOpen: 0, mouthW: 0.7, lookX: 1, lookY: 2, sweat: 0},
	smug: {browTilt: 6, browY: -1, eyeH: 0.78, mouthCurve: 8, mouthOpen: 0, mouthW: 1.05, lookX: 0, lookY: 0, sweat: 0},
	curious: {browTilt: -8, browY: -4, eyeH: 1.06, mouthCurve: 2, mouthOpen: 2, mouthW: 0.7, lookX: 1, lookY: -1, sweat: 0},
} satisfies Record<string, Face>;

export type PoseName = keyof typeof POSES;
export type FaceName = keyof typeof FACES;
export type Cycle = 'none' | 'walk' | 'type' | 'cheer' | 'breathe-hard';

export type MarcusKey = {
	at: number; // scene-local frame
	pose?: PoseName | Partial<Pose> | [PoseName, Partial<Pose>];
	face?: FaceName | Partial<Face>;
	cycle?: Cycle;
	/** spring for this transition; default 'limb' */
	spring?: keyof typeof springs | Partial<SpringConfig>;
};

const L = {torso: 150, neck: 16, R: 48, ua: 82, fa: 76, th: 92, sh: 90, foot: 20, W: 15, O: 7};
const JOINTS: (keyof Pose)[] = ['lean', 'head', 'fs', 'fe', 'bs', 'be', 'fh', 'fk', 'bh', 'bk', 'lift'];
// Overlapping action: torso leads, head and arms follow, forearms trail.
const DELAY: Record<keyof Pose, number> = {lean: 0, head: 2, fs: 1, fe: 3, bs: 2, be: 4, fh: 0, fk: 1, bh: 0, bk: 1, lift: 0};
const FACE_KEYS = Object.keys(FACES.neutral) as (keyof Face)[];
const CYCLES: Cycle[] = ['walk', 'type', 'cheer', 'breathe-hard'];

const resolvePose = (p: MarcusKey['pose'], prev: Pose): Pose => {
	if (!p) return prev;
	if (typeof p === 'string') return POSES[p];
	if (Array.isArray(p)) return {...POSES[p[0]], ...p[1]};
	return {...prev, ...p};
};
const resolveFace = (f: MarcusKey['face'], prev: Face): Face => {
	if (!f) return prev;
	if (typeof f === 'string') return FACES[f];
	return {...prev, ...f};
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number): [number, number] => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p: [number, number], a: number, len: number): [number, number] => {
	const [dx, dy] = dir(a);
	return [p[0] + dx * len, p[1] + dy * len];
};

export type MarcusProps = {
	x: number;
	y: number; // ground line
	scale?: number;
	facing?: 1 | -1;
	track: MarcusKey[];
	seed?: number;
	/** override frame (e.g. for motion blur samples); defaults to current frame */
	frame?: number;
	shadow?: boolean;
	/** something held in the front hand, drawn in hand space (SVG) */
	frontProp?: React.ReactNode;
	backProp?: React.ReactNode;
	/** on dark backgrounds the outline gets a faint rim so he never disappears */
	onDark?: boolean;
	opacity?: number;
};

export const Marcus: React.FC<MarcusProps> = ({
	x,
	y,
	scale = 1,
	facing = 1,
	track,
	seed = 0,
	frame: frameOverride,
	shadow = true,
	frontProp,
	backProp,
	onDark = false,
	opacity = 1,
}) => {
	const current = useCurrentFrame();
	const {fps} = useVideoConfig();
	const frame = frameOverride ?? current;
	const keys = [...track].sort((a, b) => a.at - b.at);

	// --- pose: each key blends from wherever the previous blend was (spring, may overshoot)
	const pose = {} as Pose;
	const firstPose = resolvePose(keys[0]?.pose ?? 'idle', POSES.idle);
	const targets: Pose[] = [];
	keys.forEach((k, i) => targets.push(i === 0 ? firstPose : resolvePose(k.pose, targets[i - 1])));
	const progress = (k: MarcusKey, delay: number) => {
		const cfg = k.spring ? (typeof k.spring === 'string' ? springs[k.spring] : k.spring) : springs.limb;
		return spring({frame: frame - k.at - delay, fps, config: cfg});
	};
	for (const j of JOINTS) {
		let v = targets[0][j];
		for (let i = 1; i < keys.length; i++) v = mix(v, targets[i][j], progress(keys[i], DELAY[j]));
		pose[j] = v;
	}

	// --- face
	const faces: Face[] = [];
	keys.forEach((k, i) => faces.push(resolveFace(k.face ?? (i === 0 ? 'neutral' : undefined), i === 0 ? FACES.neutral : faces[i - 1])));
	const face = {} as Face;
	for (const fk of FACE_KEYS) {
		let v = faces[0][fk];
		for (let i = 1; i < keys.length; i++) v = mix(v, faces[i][fk], progress(keys[i], 1));
		face[fk] = v;
	}

	// --- procedural cycles, weighted by the same springs
	const w: Record<Cycle, number> = {none: 0, walk: 0, type: 0, cheer: 0, 'breathe-hard': 0};
	for (const c of CYCLES) {
		let v = keys[0]?.cycle === c ? 1 : 0;
		for (let i = 1; i < keys.length; i++) {
			const target = (keys[i].cycle ?? 'none') === c ? 1 : 0;
			v = mix(v, target, Math.min(1, progress(keys[i], 0)));
		}
		w[c] = v;
	}
	const P = {...pose};
	// breathing + idle micro-motion so he is never frozen (but never "floaty")
	const breath = Math.sin((frame + seed * 17) * ((2 * Math.PI) / 84));
	P.lean += breath * 0.9 + wobble(frame, seed, 1, 1.2);
	P.head += wobble(frame, seed + 2, 1.2, 2.2);
	P.fs += wobble(frame, seed + 4, 1, 2.5);
	P.bs += wobble(frame, seed + 6, 1, 2.5);
	if (w.walk > 0) {
		const ph = (frame * 2 * Math.PI) / 16;
		const s = Math.sin(ph);
		P.fh += w.walk * 24 * s;
		P.bh += w.walk * -24 * s;
		P.fk += w.walk * -26 * Math.max(0, Math.cos(ph));
		P.bk += w.walk * -26 * Math.max(0, -Math.cos(ph));
		P.fs += w.walk * -22 * s;
		P.bs += w.walk * 22 * s;
		P.lift += w.walk * 7 * Math.abs(Math.sin(2 * ph));
	}
	if (w.type > 0) {
		P.fe += w.type * 9 * Math.sin(frame * 1.25);
		P.be += w.type * 9 * Math.sin(frame * 1.25 + 2.1);
		P.head += w.type * 2.5 * Math.sin(frame * 0.18);
	}
	let squash = 1;
	if (w.cheer > 0) {
		const ph = (frame * 2 * Math.PI) / 20;
		const hop = Math.abs(Math.sin(ph));
		P.lift += w.cheer * 64 * hop;
		P.fs += w.cheer * 10 * Math.sin(ph * 2);
		P.bs += w.cheer * -10 * Math.sin(ph * 2);
		P.fk += w.cheer * -18 * (1 - hop);
		P.bk += w.cheer * -18 * (1 - hop);
		squash = 1 - w.cheer * 0.05 * Math.pow(1 - hop, 6);
	}
	if (w['breathe-hard'] > 0) {
		const b = Math.sin(frame * 0.5);
		P.lean += w['breathe-hard'] * (6 + 3 * b);
		P.head += w['breathe-hard'] * 3 * b;
	}

	// --- forward kinematics (facing right, hip at origin)
	const H: [number, number] = [0, 0];
	const N = add(H, 180 - P.lean, L.torso); // 180 = up, minus lean tips toward facing
	const S = add(H, 180 - P.lean, L.torso - 10);
	const headC = add(N, 180 - P.lean - P.head * 0.35, L.neck + L.R);
	const fE = add(S, P.fs, L.ua);
	const fW = add(fE, P.fs + P.fe, L.fa);
	const bE = add(S, P.bs, L.ua);
	const bW = add(bE, P.bs + P.be, L.fa);
	const fK = add(H, P.fh, L.th);
	const fA = add(fK, P.fh + P.fk, L.sh);
	const bK = add(H, P.bh, L.th);
	const bA = add(bK, P.bh + P.bk, L.sh);
	const footEnd = (a: [number, number]): [number, number] => [a[0] + L.foot, a[1] + 2];
	const groundY = Math.max(fA[1], bA[1]) + L.W / 2;
	const lift = Math.max(0, P.lift);

	const blinkPhase = (frame + seed * 31) % 113;
	const blink = blinkPhase < 5 ? [1, 0.45, 0.1, 0.35, 0.8][blinkPhase] : 1;

	const C = story.marcus;
	const limb = (pts: [number, number][], key: string) => {
		const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
		return (
			<g key={key}>
				<path d={d} stroke={C.outline} strokeWidth={L.W + L.O * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
				<path d={d} stroke={C.body} strokeWidth={L.W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
			</g>
		);
	};

	const headRot = -(P.lean + P.head);
	const R = L.R;
	const edgeY = (px: number) => -4 - 16 * ((px + R + 6) / (2 * R + 12));
	const eye = (cx: number, size: number) => (
		<ellipse cx={cx + face.lookX * 2} cy={8 + face.lookY * 2} rx={5.2 * size} ry={Math.max(0.8, 7.2 * face.eyeH * blink * size)} fill={C.outline} />
	);
	const browDy = Math.tan(rad(face.browTilt)) * 8;
	const by = -5 + face.browY;
	const mx = 22;
	const my = 29;
	const mw = 22 * face.mouthW;
	const mouth =
		face.mouthOpen > 1.5 ? (
			<path
				d={`M${mx - mw / 2},${my - face.mouthOpen * 0.25}Q${mx},${my - face.mouthOpen * 0.25 + face.mouthCurve * 0.6} ${mx + mw / 2},${my - face.mouthOpen * 0.25}Q${mx},${my + face.mouthOpen + face.mouthCurve} ${mx - mw / 2},${my - face.mouthOpen * 0.25}Z`}
				fill={C.outline}
			/>
		) : (
			<path
				d={`M${mx - mw / 2},${my}Q${mx},${my + face.mouthCurve * 1.4} ${mx + mw / 2},${my - face.mouthCurve * 0.15}`}
				stroke={C.outline}
				strokeWidth={5}
				fill="none"
				strokeLinecap="round"
			/>
		);

	const head = (
		<g transform={`translate(${headC[0]},${headC[1]}) rotate(${headRot})`}>
			<circle r={R} fill={C.body} stroke={C.outline} strokeWidth={L.O} />
			{/* face (3/4 view toward facing side) */}
			{eye(5, 1)}
			{eye(29, 1.05)}
			<line x1={-3} y1={by + browDy * 0.2} x2={12} y2={by + browDy} stroke={C.outline} strokeWidth={4.5} strokeLinecap="round" />
			<line x1={22} y1={by + browDy} x2={37} y2={by - browDy * 0.6} stroke={C.outline} strokeWidth={4.5} strokeLinecap="round" />
			{mouth}
			{/* backward cap */}
			<clipPath id={`cap-${seed}`}>
				<circle r={R + L.O / 2 + 0.5} />
			</clipPath>
			<g clipPath={`url(#cap-${seed})`}>
				<path d={`M${-R - 6},${edgeY(-R - 6)}L${R + 6},${edgeY(R + 6)}L${R + 6},${-R - 12}L${-R - 6},${-R - 12}Z`} fill={C.cap} />
				<path d={`M-8,${-R + 2}Q14,-34 ${R - 12},${edgeY(R - 12) - 2}`} stroke="#34373D" strokeWidth={3} fill="none" />
			</g>
			{/* snapback opening — reads as "worn backwards" */}
			<path
				d={`M${R * 0.36 - 10},${edgeY(R * 0.36 - 10)}A10 10 0 0 1 ${R * 0.36 + 10},${edgeY(R * 0.36 + 10)}Z`}
				fill={C.body}
				stroke={C.cap}
				strokeWidth={2}
			/>
			<line x1={R * 0.36 - 9} y1={edgeY(R * 0.36) - 3} x2={R * 0.36 + 9} y2={edgeY(R * 0.36) - 5} stroke={C.cap} strokeWidth={3} />
			<circle cx={-4} cy={-R - 1} r={5} fill={C.cap} />
			{/* brim, pointing back */}
			<path d={`M${-R + 10},-12L${-R - 30},-7Q${-R - 40},-4 ${-R - 31},2L${-R + 10},-1Z`} fill={C.cap} />
			{face.sweat > 0.05 && (
				<path
					d="M0,0C-6,9 -7,14 0,16C7,14 6,9 0,0Z"
					transform={`translate(${-R + 2},${10 - (1 - face.sweat) * 8}) scale(${0.8 + face.sweat * 0.5})`}
					fill="#8FD3FF"
					stroke={C.outline}
					strokeWidth={2.5}
					opacity={Math.min(1, face.sweat * 1.4)}
				/>
			)}
		</g>
	);

	const VB = {x: -320, y: -620, w: 640, h: 680};
	const shadowS = Math.max(0.35, 1 - lift / 220);
	return (
		<div
			style={{
				position: 'absolute',
				left: x - (-VB.x) * scale,
				top: y - (-VB.y) * scale,
				width: VB.w * scale,
				height: VB.h * scale,
				opacity,
				pointerEvents: 'none',
			}}
		>
			<svg width={VB.w * scale} height={VB.h * scale} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{overflow: 'visible'}}>
				{shadow && <ellipse cx={facing * 6} cy={2} rx={92 * shadowS} ry={12 * shadowS} fill="#000" opacity={(onDark ? 0.45 : 0.13) * shadowS} />}
				<g transform={`scale(${facing},1) translate(0,${-groundY - lift}) scale(1,${squash})`} style={onDark ? {filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.18))'} : undefined}>
					{limb([bW, bE, S], 'barm')}
					{backProp && <g transform={`translate(${bW[0]},${bW[1]}) scale(${facing},1)`}>{backProp}</g>}
					{limb([footEnd(bA), bA, bK, H], 'bleg')}
					{limb([H, N], 'torso')}
					{limb([footEnd(fA), fA, fK, H], 'fleg')}
					{head}
					{limb([S, fE, fW], 'farm')}
					{frontProp && <g transform={`translate(${fW[0]},${fW[1]}) scale(${facing},1)`}>{frontProp}</g>}
				</g>
			</svg>
		</div>
	);
};
