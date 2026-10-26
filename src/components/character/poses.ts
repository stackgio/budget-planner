// Pose library for the Stack With Gio stickman.
//
// Angles are degrees. Arms: 0 = hanging down, + rotates toward the direction the
// character faces (90 = pointing forward, 180 = straight up), relative to the
// torso. Elbow adds to the upper-arm angle. Legs: 0 = straight down, + forward;
// knee bends the shin backward. All poses are authored facing right; the rig
// mirrors for facing left.

export type Limb = {s: number; e: number};
export type Leg = {h: number; k: number};

export type Pose = {
	lean: number; // torso, + forward
	tilt: number; // head, + nods forward
	armNear: Limb;
	armFar: Limb;
	legNear: Leg;
	legFar: Leg;
	lift: number; // px off the ground (jumps)
	shrug: number; // px shoulders rise
	/** Draw the near arm behind the head (hands-behind-head poses). */
	nearArmBehind?: boolean;
};

export type Expression = 'neutral' | 'happy' | 'shocked' | 'deadpan' | 'smug' | 'worried';

const base: Pose = {
	lean: 2,
	tilt: 0,
	armNear: {s: 8, e: 10},
	armFar: {s: -6, e: 8},
	legNear: {h: 6, k: 4},
	legFar: {h: -6, k: 4},
	lift: 0,
	shrug: 0,
};

export const poses = {
	idle: base,
	deadpan: {...base, lean: 0, armNear: {s: 2, e: 2}, armFar: {s: -2, e: 2}, legNear: {h: 3, k: 0}, legFar: {h: -3, k: 0}},
	celebrate: {
		...base,
		lean: -6,
		tilt: -10,
		armNear: {s: 128, e: 22},
		armFar: {s: -128, e: -22},
		legNear: {h: 14, k: 18},
		legFar: {h: -12, k: 6},
	},
	jump: {
		...base,
		lean: -4,
		tilt: -12,
		armNear: {s: 135, e: 18},
		armFar: {s: -135, e: -18},
		legNear: {h: 40, k: 70},
		legFar: {h: -5, k: 55},
		lift: 70,
	},
	crouch: {
		...base,
		lean: 18,
		tilt: 6,
		armNear: {s: -30, e: 20},
		armFar: {s: -40, e: 20},
		legNear: {h: 55, k: 95},
		legFar: {h: 35, k: 80},
	},
	shrug: {
		...base,
		lean: 0,
		tilt: 10,
		armNear: {s: 28, e: 108},
		armFar: {s: -28, e: -108},
		shrug: 10,
	},
	lounge: {
		...base,
		lean: -9,
		tilt: -2,
		armNear: {s: 141, e: 122},
		armFar: {s: 128, e: 135},
		nearArmBehind: true,
		legNear: {h: 28, k: 8},
		legFar: {h: 8, k: 24},
	},
	point: {...base, lean: 4, armNear: {s: 88, e: 2}},
	facepalm: {...base, lean: 10, tilt: 18, armNear: {s: 70, e: 140}},
	think: {...base, lean: 3, tilt: 8, armNear: {s: 38, e: 125}, armFar: {s: 20, e: 70}},
	wave: {...base, armNear: {s: 125, e: 30}},
	walkA: {...base, lean: 5, armNear: {s: -25, e: 15}, armFar: {s: 25, e: 15}, legNear: {h: 25, k: 10}, legFar: {h: -22, k: 30}},
	walkB: {...base, lean: 5, armNear: {s: 25, e: 15}, armFar: {s: -25, e: 15}, legNear: {h: -22, k: 30}, legFar: {h: 25, k: 10}},
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof poses;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
	lean: mix(a.lean, b.lean, t),
	tilt: mix(a.tilt, b.tilt, t),
	armNear: {s: mix(a.armNear.s, b.armNear.s, t), e: mix(a.armNear.e, b.armNear.e, t)},
	armFar: {s: mix(a.armFar.s, b.armFar.s, t), e: mix(a.armFar.e, b.armFar.e, t)},
	legNear: {h: mix(a.legNear.h, b.legNear.h, t), k: mix(a.legNear.k, b.legNear.k, t)},
	legFar: {h: mix(a.legFar.h, b.legFar.h, t), k: mix(a.legFar.k, b.legFar.k, t)},
	lift: mix(a.lift, b.lift, t),
	shrug: mix(a.shrug, b.shrug, t),
	nearArmBehind: t < 0.5 ? a.nearArmBehind : b.nearArmBehind,
});
