import React from 'react';

/**
 * A stylised banknote (deliberately NOT a reproduction of real currency):
 * muted green paper, inset border, a denomination and a guilloche-like line.
 * `tilt` 0..1 squashes it vertically to read as lying flat in 2.5D.
 */
export const Note: React.FC<{x: number; y: number; w: number; rot?: number; tilt?: number; value?: string; opacity?: number; shade?: number}> = ({
	x,
	y,
	w,
	rot = 0,
	tilt = 0,
	value = '20',
	opacity = 1,
	shade = 0,
}) => {
	const h = w * 0.44;
	const sy = 1 - tilt * 0.72;
	const light = `hsl(146, 30%, ${46 - shade * 14}%)`;
	const dark = `hsl(148, 34%, ${30 - shade * 10}%)`;
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${sy})`} opacity={opacity}>
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={dark} />
			<rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={5} fill={light} />
			<rect x={-w / 2 + 9} y={-h / 2 + 8} width={w - 18} height={h - 16} rx={3} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.6} />
			<circle cx={w * 0.16} cy={0} r={h * 0.27} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.6} />
			<path d={`M ${-w / 2 + 16} ${h * 0.18} q ${w * 0.12} ${-h * 0.2} ${w * 0.24} 0 t ${w * 0.24} 0`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.4} />
			<text x={-w / 2 + 16} y={-h / 2 + 30} fill="rgba(255,255,255,0.75)" fontSize={h * 0.3} fontWeight={900} fontFamily="Inter, sans-serif">
				{value}
			</text>
		</g>
	);
};
