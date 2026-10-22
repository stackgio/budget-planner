import React from 'react';
import {C, FONT} from '../theme';

const ns = 'non-scaling-stroke' as const;
const line = (sw: number, color = C.white) => ({
  stroke: color,
  strokeWidth: sw,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: ns,
});

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [
  cx + Math.sin((deg * Math.PI) / 180) * r,
  cy - Math.cos((deg * Math.PI) / 180) * r,
];

/** Clock with a counter-clockwise (rewind) arrow. Angles: 0 = 12 o'clock, clockwise positive. */
export const Clock: React.FC<{
  x: number;
  y: number;
  r: number;
  minute: number; // minute-hand angle in degrees
  sw?: number;
  arrow?: number; // 0..1 arrow visibility
  opacity?: number;
}> = ({x, y, r, minute, sw = 9, arrow = 1, opacity = 1}) => {
  if (opacity <= 0) return null;
  const hour = 300 + minute / 12; // hour hand follows minute hand
  const ticks = Array.from({length: 12}, (_, i) => {
    const major = i % 3 === 0;
    const a = polar(x, y, r * 0.86, i * 30);
    const b = polar(x, y, r * (major ? 0.7 : 0.77), i * 30);
    return <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} {...line(major ? sw * 0.8 : sw * 0.5)} />;
  });
  const hm = polar(x, y, r * 0.62, minute);
  const hh = polar(x, y, r * 0.42, hour);
  // rewind arrow: arc outside the face from 1 o'clock back to 10 o'clock, head pointing counter-clockwise
  const ra = r * 1.2;
  const a0 = 40;
  const a1 = -62;
  const p0 = polar(x, y, ra, a0);
  const p1 = polar(x, y, ra, a1);
  const tip = polar(x, y, ra, a1 - 2);
  const hl = r * 0.17;
  const tang = ((a1 - 90) * Math.PI) / 180; // direction of travel (counter-clockwise)
  const dirX = Math.sin(tang);
  const dirY = -Math.cos(tang);
  const nX = -dirY;
  const nY = dirX;
  const baseX = tip[0] - dirX * hl;
  const baseY = tip[1] - dirY * hl;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} {...line(sw)} fill={C.bg} />
      {ticks}
      <path d={`M${x},${y} L${hh[0]},${hh[1]}`} {...line(sw * 1.1)} />
      <path d={`M${x},${y} L${hm[0]},${hm[1]}`} {...line(sw * 0.9)} />
      <circle cx={x} cy={y} r={sw * 0.9} fill={C.white} />
      {arrow > 0 ? (
        <g opacity={arrow}>
          <path d={`M${p0[0]},${p0[1]} A${ra},${ra} 0 0 0 ${p1[0]},${p1[1]}`} {...line(sw * 0.8, C.green)} />
          <path
            d={`M${baseX + nX * hl * 0.75},${baseY + nY * hl * 0.75} L${tip[0] + dirX * hl * 0.25},${tip[1] + dirY * hl * 0.25} L${baseX - nX * hl * 0.75},${baseY - nY * hl * 0.75}`}
            {...line(sw * 0.8, C.green)}
          />
        </g>
      ) : null}
    </g>
  );
};

/** A single banded stack of bills, drawn flat. (x, y) = centre. */
export const Bundle: React.FC<{x: number; y: number; w: number; sw?: number; rot?: number}> = ({x, y, w, sw = 7, rot = 0}) => {
  const h = w * 0.46;
  const d = w * 0.06; // visible stack thickness
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x={-w / 2 + d} y={-h / 2 + d} width={w} height={h} rx={w * 0.04} {...line(sw * 0.7, C.gray)} fill={C.bg} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.04} {...line(sw)} fill={C.bg} />
      <ellipse cx={0} cy={0} rx={h * 0.3} ry={h * 0.3} {...line(sw * 0.7)} />
      <rect x={-w * 0.11} y={-h / 2} width={w * 0.22} height={h} fill={C.green} />
      <text x={0} y={h * 0.16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.44} fill={C.bg}>
        $
      </text>
      <circle cx={-w * 0.36} cy={-h * 0.24} r={sw * 0.55} fill={C.white} />
      <circle cx={w * 0.36} cy={h * 0.24} r={sw * 0.55} fill={C.white} />
    </g>
  );
};

/** A small pile of three bundles. `t` (0..1) slides them in from the right with one restrained move. */
export const CashPile: React.FC<{x: number; y: number; w: number; sw?: number; t?: number; opacity?: number}> = ({x, y, w, sw = 7, t = 1, opacity = 1}) => {
  if (opacity <= 0) return null;
  const off = (1 - t) * w * 0.5;
  const h = w * 0.46;
  return (
    <g opacity={opacity * Math.min(1, t * 1.6)} transform={`translate(${off},0)`}>
      <Bundle x={x - w * 0.36} y={y + h * 0.36} w={w * 0.7} sw={sw} />
      <Bundle x={x + w * 0.36} y={y + h * 0.36} w={w * 0.7} sw={sw} />
      <Bundle x={x} y={y - h * 0.3} w={w * 0.7} sw={sw} />
    </g>
  );
};

/** Calendar page without dates. (x, y) = top-left. */
export const Calendar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  sw?: number;
  rot?: number;
  opacity?: number;
  children?: React.ReactNode;
  grid?: boolean;
}> = ({x, y, w, h, sw = 8, rot = 0, opacity = 1, children, grid = true}) => {
  if (opacity <= 0) return null;
  const head = h * 0.2;
  const cols = 5;
  const rows = 3;
  const dots = [];
  if (grid) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        dots.push(
          <rect
            key={`${r}-${c}`}
            x={w * 0.14 + (c * (w * 0.72)) / (cols - 1) - w * 0.035}
            y={head + h * 0.2 + (r * (h * 0.52)) / (rows - 1) - w * 0.035}
            width={w * 0.07}
            height={w * 0.07}
            rx={w * 0.012}
            fill={C.gray}
          />,
        );
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${rot},${w / 2},${h / 2})`} opacity={opacity}>
      <rect x={0} y={0} width={w} height={h} rx={w * 0.06} {...line(sw)} fill={C.bg} />
      <path d={`M0,${head} H${w}`} {...line(sw)} />
      <path d={`M${w * 0.28},${-h * 0.06} V${head * 0.45} M${w * 0.72},${-h * 0.06} V${head * 0.45}`} {...line(sw)} />
      {dots}
      {children}
    </g>
  );
};

/** Simple brain symbol with three knowledge points. (x, y) = centre, w = width. */
export const Brain: React.FC<{x: number; y: number; w: number; sw?: number; lit?: [number, number, number]; opacity?: number; scale?: number}> = ({
  x,
  y,
  w,
  sw = 9,
  lit = [1, 1, 1],
  opacity = 1,
  scale = 1,
}) => {
  if (opacity <= 0) return null;
  const k = (w / 200) * scale;
  const pts: [number, number][] = [
    [62, 66],
    [138, 66],
    [118, 108],
  ];
  return (
    <g transform={`translate(${x},${y}) scale(${k}) translate(-100,-78)`} opacity={opacity}>
      <path
        d="M100 22 C72 4,36 12,33 44 C11 50,8 86,26 100 C16 126,42 142,62 134 C72 150,96 148,100 136 Z M100 22 C128 4,164 12,167 44 C189 50,192 86,174 100 C184 126,158 142,138 134 C128 150,104 148,100 136 Z"
        {...line(sw)}
        fill={C.bg}
      />
      <path d="M48 56 C62 58,66 74,56 86 M152 56 C138 58,134 74,144 86 M40 112 C54 104,70 110,76 122 M160 112 C146 104,130 110,124 122" {...line(sw * 0.75)} />
      {pts.map(([px, py], i) => (
        <g key={i}>
          <circle cx={px} cy={py} r={9} fill={C.dim} />
          <circle cx={px} cy={py} r={9 + 3 * (1 - lit[i])} fill={C.green} opacity={lit[i]} transform={`translate(${px},${py}) scale(${0.6 + 0.4 * lit[i]}) translate(${-px},${-py})`} />
        </g>
      ))}
    </g>
  );
};

/** Thin-outlined choice panel. (x, y) = top-left. */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; stroke?: string; sw?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  stroke = C.line,
  sw = 3,
  opacity = 1,
}) => (opacity > 0 ? <rect x={x} y={y} width={w} height={h} rx={30} fill="none" stroke={stroke} strokeWidth={sw} opacity={opacity} /> : null);
