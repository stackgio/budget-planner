import React from 'react';
import {C, FONT} from '../theme';

export type Run = {t: string; c?: string};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number, tracking: number) => {
  if (typeof document === 'undefined') return text.length * size * 0.6;
  ctx = ctx ?? document.createElement('canvas').getContext('2d');
  ctx!.font = `${weight} ${size}px ${FONT}`;
  return ctx!.measureText(text).width + tracking * size * Math.max(0, text.length - 1);
};

/** Font size that keeps `text` within maxWidth (never larger than `size`). */
export const fitSize = (text: string, size: number, maxWidth: number, weight = 800, tracking = -0.01) => {
  const natural = measure(text, size, weight, tracking);
  return natural > maxWidth ? Math.floor((size * maxWidth) / natural) : size;
};

type Props = {
  runs: Run[] | string;
  x: number; // anchor x (centre or left edge)
  y: number; // vertical centre of capitals
  size: number;
  maxWidth?: number;
  weight?: number;
  color?: string;
  align?: 'center' | 'left';
  tracking?: number; // em
  opacity?: number;
  scale?: number;
  dx?: number;
  dy?: number;
};

/** One SVG text line that shrinks to fit maxWidth instead of clipping. */
export const Line: React.FC<Props> = ({
  runs,
  x,
  y,
  size,
  maxWidth = 800,
  weight = 800,
  color = C.white,
  align = 'center',
  tracking = -0.01,
  opacity = 1,
  scale = 1,
  dx = 0,
  dy = 0,
}) => {
  if (opacity <= 0) return null;
  const list: Run[] = typeof runs === 'string' ? [{t: runs}] : runs;
  const fs = fitSize(list.map((r) => r.t).join(''), size, maxWidth, weight, tracking);
  // Inter capitals are ~0.727em tall: shift baseline so `y` is the visual centre of caps.
  const base = y + fs * 0.364;
  return (
    <g opacity={opacity} transform={`translate(${x + dx},${y + dy}) scale(${scale}) translate(${-x},${-y})`}>
      <text
        x={x}
        y={base}
        textAnchor={align === 'center' ? 'middle' : 'start'}
        fontFamily={FONT}
        fontWeight={weight}
        fontSize={fs}
        letterSpacing={`${tracking}em`}
        fill={color}
        style={{whiteSpace: 'pre'}}
      >
        {list.map((r, i) => (
          <tspan key={i} fill={r.c ?? color}>
            {r.t}
          </tspan>
        ))}
      </text>
    </g>
  );
};
