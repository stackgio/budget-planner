import React from 'react';
import {C} from './lib';

// Poseable stickman. Angles in degrees: 0 = pointing straight down, +90 = right, -90 = left, 180 = up.
export type Pose = {
  lean: number; // torso tilt (0 = upright)
  head: number; // head tilt
  la1: number; la2: number; ra1: number; ra2: number; // left/right upper & lower arm
  ll1: number; ll2: number; rl1: number; rl2: number; // left/right thigh & shin
};

export const POSES: Record<string, Pose> = {
  stand: {lean: 0, head: 0, la1: -12, la2: -6, ra1: 12, ra2: 6, ll1: -8, ll2: -4, rl1: 8, rl2: 4},
  bags: {lean: 0, head: -4, la1: -22, la2: -14, ra1: 22, ra2: 14, ll1: -9, ll2: -4, rl1: 9, rl2: 4},
  tap: {lean: 4, head: 6, la1: -14, la2: -8, ra1: 70, ra2: 105, ll1: -8, ll2: -4, rl1: 8, rl2: 4},
  flex: {lean: -6, head: -10, la1: -40, la2: -150, ra1: 30, ra2: 10, ll1: -14, ll2: -6, rl1: 12, rl2: 2},
  pose: {lean: 4, head: 8, la1: -55, la2: 20, ra1: 140, ra2: 175, ll1: -16, ll2: -4, rl1: 14, rl2: 8},
  slump: {lean: 22, head: 26, la1: 35, la2: 75, ra1: 45, ra2: 85, ll1: 82, ll2: 2, rl1: 88, rl2: 8},
  phone: {lean: 4, head: 22, la1: -12, la2: -6, ra1: 18, ra2: 168, ll1: -8, ll2: -4, rl1: 8, rl2: 4},
  nahL: {lean: -2, head: -8, la1: -12, la2: -6, ra1: 120, ra2: 160, ll1: -9, ll2: -4, rl1: 9, rl2: 4},
  nahR: {lean: 2, head: 6, la1: -12, la2: -6, ra1: 100, ra2: 200, ll1: -9, ll2: -4, rl1: 9, rl2: 4},
  holdUp: {lean: 0, head: -6, la1: -14, la2: -8, ra1: 150, ra2: 175, ll1: -9, ll2: -4, rl1: 9, rl2: 4},
  snap: {lean: 0, head: 0, la1: -120, la2: -170, ra1: 120, ra2: 170, ll1: -10, ll2: -4, rl1: 10, rl2: 4},
  proud: {lean: -3, head: -6, la1: -35, la2: 30, ra1: 35, ra2: -30, ll1: -12, ll2: -5, rl1: 12, rl2: 5},
};

export const lerpPose = (a: Pose, b: Pose, k: number): Pose => {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((key) => {
    o[key] = a[key] + (b[key] - a[key]) * k;
  });
  return o;
};

const rad = (d: number) => (d * Math.PI) / 180;
const step = (x: number, y: number, a: number, len: number) => ({x: x + Math.sin(rad(a)) * len, y: y + Math.cos(rad(a)) * len});

export type Face = 'smile' | 'grin' | 'flat' | 'frown' | 'open' | 'smirk';

export const Stickman: React.FC<{
  x: number; y: number; scale?: number; pose: Pose; color?: string; face?: Face; glasses?: number;
  sweat?: number; bags?: number; phone?: 'left' | 'right'; card?: 'right'; cardBroken?: number; cardGlow?: number;
  opacity?: number; flip?: boolean;
}> = ({x, y, scale = 1, pose, color = C.white, face = 'smile', glasses = 0, sweat = 0, bags = 0, phone, card, cardBroken = 0, cardGlow = 0, opacity = 1, flip = false}) => {
  const sw = 15;
  const hip = {x: 0, y: 0};
  const sh = step(0, 0, 180 + pose.lean, 150);
  const neckDir = 180 + pose.lean + pose.head * 0.3;
  const hc = step(sh.x, sh.y, neckDir, 58);
  const le = step(sh.x, sh.y, pose.la1, 85);
  const lh = step(le.x, le.y, pose.la2, 80);
  const re = step(sh.x, sh.y, pose.ra1, 85);
  const rh = step(re.x, re.y, pose.ra2, 80);
  const lk = step(hip.x, hip.y, pose.ll1, 100);
  const lf = step(lk.x, lk.y, pose.ll2, 100);
  const rk = step(hip.x, hip.y, pose.rl1, 100);
  const rf = step(rk.x, rk.y, pose.rl2, 100);
  const line = (a: {x: number; y: number}, b: {x: number; y: number}, b2: {x: number; y: number}) =>
    `M${a.x} ${a.y} L${b.x} ${b.y} L${b2.x} ${b2.y}`;

  const mouth: Record<Face, string> = {
    smile: 'M-16 12 Q0 26 16 12',
    grin: 'M-20 8 Q0 34 20 8 Z',
    flat: 'M-14 16 L14 16',
    frown: 'M-15 22 Q0 10 15 22',
    open: 'M-9 10 Q0 32 9 10 Q0 6 -9 10 Z',
    smirk: 'M-14 16 Q4 22 18 8',
  };
  const Bag = ({at, col, dx}: {at: {x: number; y: number}; col: string; dx: number}) => (
    <g transform={`translate(${at.x + dx} ${at.y}) scale(${bags})`} opacity={bags}>
      <path d="M-18 6 Q-18 -22 0 -22 Q18 -22 18 6" fill="none" stroke={C.white} strokeWidth={5} />
      <rect x={-34} y={4} width={68} height={78} rx={8} fill={col} />
      <rect x={-34} y={4} width={68} height={14} rx={4} fill="rgba(0,0,0,0.18)" />
    </g>
  );
  return (
    <svg
      width={600} height={720} viewBox="-300 -460 600 720"
      style={{position: 'absolute', left: x - 300 * scale, top: y - 460 * scale, width: 600 * scale, height: 720 * scale, opacity, overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined}}
    >
      <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={line(hip, lk, lf)} />
        <path d={line(hip, rk, rf)} />
        <path d={`M${hip.x} ${hip.y} L${sh.x} ${sh.y}`} />
        <path d={line(sh, le, lh)} />
        <path d={line(sh, re, rh)} />
      </g>
      {bags > 0 && (
        <>
          <Bag at={lh} col={C.green} dx={-6} />
          <Bag at={rh} col="#E9E4D8" dx={6} />
        </>
      )}
      {phone && (
        <g transform={`translate(${(phone === 'left' ? lh : rh).x} ${(phone === 'left' ? lh : rh).y - 30}) rotate(${phone === 'left' ? -10 : 10})`}>
          <rect x={-22} y={-38} width={44} height={76} rx={9} fill="#1b1f1d" stroke={C.white} strokeWidth={4} />
          <rect x={-15} y={-28} width={30} height={52} rx={4} fill={C.green} opacity={0.75} />
        </g>
      )}
      {card && (
        <g transform={`translate(${rh.x} ${rh.y - 46})`} style={{filter: cardGlow ? `drop-shadow(0 0 ${22 * cardGlow}px ${C.red})` : undefined}}>
          {[0, 1].map((half) => (
            <g key={half} transform={`translate(${(half ? 1 : -1) * cardBroken * 70} ${cardBroken * 90}) rotate(${(half ? 1 : -1) * cardBroken * 35})`} opacity={1 - Math.max(0, cardBroken - 0.6) * 2.5}>
              <rect
                x={half ? 0 : -60} y={-38} width={60} height={76} rx={half ? 0 : 10}
                fill={cardGlow > 0.5 ? '#3a1414' : '#22302a'} stroke={cardGlow > 0.5 ? C.red : C.white} strokeWidth={4}
                style={{clipPath: half ? 'inset(0 0 0 0 round 0 10px 10px 0)' : undefined}}
              />
              {!half && <rect x={-46} y={-18} width={22} height={16} rx={3} fill="#d9b45a" />}
            </g>
          ))}
        </g>
      )}
      {/* head */}
      <g transform={`translate(${hc.x} ${hc.y}) rotate(${pose.head})`}>
        <circle r={46} fill={C.bg} stroke={color} strokeWidth={sw} />
        {glasses > 0 ? (
          <g opacity={glasses} transform={`translate(0 ${(1 - glasses) * -60})`}>
            <rect x={-34} y={-14} width={30} height={18} rx={6} fill="#050505" stroke={color} strokeWidth={3} />
            <rect x={4} y={-14} width={30} height={18} rx={6} fill="#050505" stroke={color} strokeWidth={3} />
            <path d="M-4 -8 L4 -8" stroke={color} strokeWidth={3} />
          </g>
        ) : (
          <>
            <circle cx={-15} cy={-6} r={5.5} fill={color} />
            <circle cx={15} cy={-6} r={5.5} fill={color} />
          </>
        )}
        <path d={mouth[face]} fill={face === 'grin' || face === 'open' ? color : 'none'} stroke={color} strokeWidth={5} strokeLinecap="round" />
        {sweat > 0 && <path d="M40 -30 Q48 -14 40 -8 Q32 -14 40 -30 Z" fill="#7cc7ff" opacity={sweat} />}
      </g>
    </svg>
  );
};
