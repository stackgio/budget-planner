import React from 'react';
import {C} from '../theme';
import {Marcus, POSE} from './Marcus';

export type MemoryKind = 'lesson' | 'mistake' | 'missed';

const FW = 640;
const FH = 460;
const GROUND = 400;

const ln = (sw: number, color = C.white) => ({
  stroke: color,
  strokeWidth: sw,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
});

const Lesson: React.FC<{sw: number}> = ({sw}) => (
  <>
    <Marcus x={250} y={GROUND} scale={0.66} pose={POSE.read} sw={sw * 1.2} />
    {/* open book held at chest */}
    <g transform="translate(322,208) rotate(-12)">
      <path d="M0,6 C-20,-6 -46,-6 -62,0 L-62,46 C-46,40 -20,40 0,52 Z" {...ln(sw)} fill={C.bg} />
      <path d="M0,6 C20,-6 46,-6 62,0 L62,46 C46,40 20,40 0,52 Z" {...ln(sw)} fill={C.bg} />
      <path d="M-48,14 h28 M-48,26 h28 M20,14 h28 M20,26 h28" {...ln(sw * 0.6, C.gray)} />
    </g>
    {/* a few closed books on the ground */}
    <g transform="translate(470,0)">
      <rect x={-62} y={GROUND - 34} width={124} height={34} rx={6} {...ln(sw)} fill={C.bg} />
      <rect x={-52} y={GROUND - 66} width={108} height={32} rx={6} {...ln(sw)} fill={C.bg} />
      <rect x={-58} y={GROUND - 96} width={112} height={30} rx={6} {...ln(sw * 0.8, C.gray)} fill={C.bg} />
    </g>
  </>
);

const Mistake: React.FC<{sw: number}> = ({sw}) => (
  <>
    {/* path that took the wrong turn */}
    <path d="M70,430 C150,420 250,418 330,418 C410,418 470,430 520,450" {...ln(sw * 0.7, C.gray)} strokeDasharray="2 22" />
    {/* wrong-turn sign: U-turn arrow on a diamond */}
    <path d={`M455,${GROUND} V185`} {...ln(sw)} />
    <g transform="translate(455,150)">
      <rect x={-54} y={-54} width={108} height={108} rx={12} transform="rotate(45)" {...ln(sw)} fill={C.bg} />
      <path d="M-18,34 V-6 C-18,-30 18,-30 18,-6 V10" {...ln(sw)} />
      <path d="M6,0 L18,14 L30,0" {...ln(sw)} />
    </g>
    <Marcus x={250} y={GROUND} scale={0.66} pose={POSE.facepalm} sw={sw * 1.2} />
  </>
);

const Missed: React.FC<{sw: number; t: number}> = ({sw, t}) => {
  // doorway closing: visible opening narrows as t goes 0 → 1
  const dx = 420;
  const dw = 140;
  const top = 120;
  const gap = 110 * (1 - t) + 12;
  return (
    <>
      <rect x={dx + 6} y={top + 6} width={gap} height={GROUND - top - 6} fill={C.white} opacity={0.92} />
      <rect x={dx + 6 + gap} y={top + 6} width={dw - 12 - gap} height={GROUND - top - 6} {...ln(sw * 0.8)} fill={C.bg} />
      <circle cx={dx + 6 + gap + 16} cy={(top + GROUND) / 2 + 10} r={sw * 0.8} fill={C.white} />
      <path d={`M${dx},${GROUND} V${top} H${dx + dw} V${GROUND}`} {...ln(sw)} />
      <Marcus x={215} y={GROUND} scale={0.66} pose={POSE.reach} sw={sw * 1.2} />
    </>
  );
};

/** Compact illustrated memory frame. (cx, cy) = centre, w = width. */
export const MemoryFrame: React.FC<{
  kind: MemoryKind;
  cx: number;
  cy: number;
  w: number;
  outline?: string;
  sw?: number;
  t?: number;
  opacity?: number;
}> = ({kind, cx, cy, w, outline = C.line, sw = 6, t = 0, opacity = 1}) => {
  if (opacity <= 0) return null;
  const k = w / FW;
  const id = `clip-${kind}`;
  return (
    <g transform={`translate(${cx - w / 2},${cy - (FH * k) / 2}) scale(${k})`} opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={FW} height={FH} rx={34} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={FW} height={FH} rx={34} fill={C.bg} />
      <g clipPath={`url(#${id})`}>
        <path d={`M40,${GROUND} H${FW - 40}`} {...ln(sw * 0.7, C.line)} />
        {kind === 'lesson' ? <Lesson sw={sw} /> : kind === 'mistake' ? <Mistake sw={sw} /> : <Missed sw={sw} t={t} />}
      </g>
      <rect x={0} y={0} width={FW} height={FH} rx={34} fill="none" stroke={outline} strokeWidth={Math.max(3, sw * 0.6)} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

export const MEMORY_ASPECT = FH / FW;
