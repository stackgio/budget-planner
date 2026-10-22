import React from 'react';
import {C} from '../theme';
import {mix} from '../anim';

// Marcus: white stickman with a backward black cap outlined in white.
// Angles are degrees from straight down; positive swings toward the side he faces.
export type Pose = {
  lean: number;
  head: number; // head tilt, positive = chin down / forward
  armBack: [number, number];
  armFront: [number, number];
  legBack: [number, number];
  legFront: [number, number];
  lookX: number; // -1..1 (positive = toward facing side)
  lookY: number; // -1 up .. 1 down
  eyes: number; // 1 normal, 1.6 wide, 0 closed
  mouth: number; // 0 none, 1 small "o"
};

export const POSE: Record<string, Pose> = {
  stand: {lean: 0, head: 0, armBack: [-10, -6], armFront: [12, 6], legBack: [-9, -4], legFront: [9, 4], lookX: 0.6, lookY: 0, eyes: 1, mouth: 0},
  ponder: {lean: -3, head: -10, armBack: [-8, -4], armFront: [24, 168], legBack: [-9, -4], legFront: [9, 4], lookX: 0.2, lookY: -1, eyes: 1, mouth: 0},
  lookUp: {lean: -2, head: -12, armBack: [-10, -5], armFront: [12, 6], legBack: [-9, -4], legFront: [9, 4], lookX: 0.2, lookY: -1, eyes: 1, mouth: 0},
  temple: {lean: -2, head: -8, armBack: [-9, -5], armFront: [96, 212], legBack: [-9, -4], legFront: [9, 4], lookX: 0.1, lookY: -1, eyes: 1, mouth: 0},
  read: {lean: 3, head: 16, armBack: [4, 100], armFront: [16, 108], legBack: [-8, -3], legFront: [8, 3], lookX: 0.8, lookY: 1, eyes: 1, mouth: 0},
  facepalm: {lean: 5, head: 14, armBack: [-6, -3], armFront: [122, 220], legBack: [-10, -4], legFront: [10, 4], lookX: 0.6, lookY: 0.6, eyes: 0, mouth: 0},
  reach: {lean: 14, head: -4, armBack: [-34, -22], armFront: [100, 92], legBack: [-26, -10], legFront: [24, 12], lookX: 1, lookY: 0, eyes: 1.25, mouth: 1},
  wow: {lean: 9, head: -10, armBack: [36, 120], armFront: [52, 128], legBack: [-10, -4], legFront: [12, 6], lookX: 0.5, lookY: -1, eyes: 1.65, mouth: 1},
  present: {lean: 0, head: 4, armBack: [-8, -4], armFront: [70, 82], legBack: [-9, -4], legFront: [9, 4], lookX: 1, lookY: 0.1, eyes: 1, mouth: 0},
};

const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
export const blend = (a: Pose, b: Pose, t: number): Pose => ({
  lean: mix(a.lean, b.lean, t),
  head: mix(a.head, b.head, t),
  armBack: lerp2(a.armBack, b.armBack, t),
  armFront: lerp2(a.armFront, b.armFront, t),
  legBack: lerp2(a.legBack, b.legBack, t),
  legFront: lerp2(a.legFront, b.legFront, t),
  lookX: mix(a.lookX, b.lookX, t),
  lookY: mix(a.lookY, b.lookY, t),
  eyes: mix(a.eyes, b.eyes, t),
  mouth: mix(a.mouth, b.mouth, t),
});

const rad = (d: number) => (d * Math.PI) / 180;
const step = (p: [number, number], ang: number, len: number): [number, number] => [p[0] + Math.sin(rad(ang)) * len, p[1] + Math.cos(rad(ang)) * len];

const HIP: [number, number] = [0, -200];
const THIGH = 100;
const SHIN = 100;
const TORSO = 150;
const UPPER = 85;
const FORE = 80;
const R = 44;

type Props = {
  x: number;
  y: number; // ground line
  scale: number;
  pose: Pose;
  facing?: 1 | -1;
  sw?: number;
  opacity?: number;
};

export const Marcus: React.FC<Props> = ({x, y, scale, pose, facing = 1, sw = 11, opacity = 1}) => {
  if (opacity <= 0) return null;
  const neck = step(HIP, 180 + pose.lean, TORSO);
  const shoulder = step(HIP, 180 + pose.lean, TORSO - 16);
  const headC = step(neck, 180 + pose.lean, 50);
  const limb = (root: [number, number], a: [number, number], l1: number, l2: number) => {
    const j = step(root, a[0], l1);
    const e = step(j, a[1], l2);
    return `M${root[0]},${root[1]} L${j[0]},${j[1]} L${e[0]},${e[1]}`;
  };
  const stroke = {
    stroke: C.white,
    strokeWidth: sw,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
  const ex = pose.lookX * 7;
  const ey = pose.lookY * 7;
  const eyeR = 5.5 * pose.eyes;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`} opacity={opacity}>
      <path d={limb(shoulder, pose.armBack, UPPER, FORE)} {...stroke} />
      <path d={limb(HIP, pose.legBack, THIGH, SHIN)} {...stroke} />
      <path d={limb(HIP, pose.legFront, THIGH, SHIN)} {...stroke} />
      <path d={`M${HIP[0]},${HIP[1]} L${neck[0]},${neck[1]}`} {...stroke} />
      <g transform={`translate(${headC[0]},${headC[1]}) rotate(${pose.head})`}>
        <circle r={R} fill={C.white} />
        {/* eyes */}
        {pose.eyes > 0.15 ? (
          <>
            <circle cx={12 + ex} cy={4 + ey} r={eyeR} fill={C.ink} />
            <circle cx={29 + ex} cy={4 + ey} r={eyeR} fill={C.ink} />
          </>
        ) : (
          <path d={`M${6 + ex},${6 + ey} h12 M${23 + ex},${6 + ey} h12`} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
        )}
        {pose.mouth > 0.1 ? <ellipse cx={24 + ex * 0.5} cy={24} rx={5 * pose.mouth} ry={6.5 * pose.mouth} fill={C.ink} /> : null}
        {/* backward cap: dome on top, bill pointing back */}
        <path
          d={`M${-R - 5},${-4} L${-R - 40},${-2} Q${-R - 46},${-8} ${-R - 38},${-14} L${-R + 2},${-18} Z`}
          fill={C.ink}
          stroke={C.white}
          strokeWidth={Math.max(3, sw * 0.42)}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={`M${-R - 4},${-6} A${R + 4},${R + 4} 0 0 1 ${R + 4},${-6} Z`}
          fill={C.ink}
          stroke={C.white}
          strokeWidth={Math.max(3, sw * 0.42)}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path d={`M${R * 0.5},${-10} a9,9 0 0 1 18,0`} fill="none" stroke={C.white} strokeWidth={Math.max(2.5, sw * 0.3)} vectorEffect="non-scaling-stroke" />
        <circle cx={0} cy={-R - 5} r={5} fill={C.ink} stroke={C.white} strokeWidth={Math.max(2.5, sw * 0.3)} vectorEffect="non-scaling-stroke" />
      </g>
      <path d={limb(shoulder, pose.armFront, UPPER, FORE)} {...stroke} />
    </g>
  );
};
