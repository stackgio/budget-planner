import React from 'react';

/**
 * A grid of `cols × rows` dots — one dot per holding (e.g. 3,519 stocks).
 * `reveal` 0..1 fills the grid in reading order (count-up), `lit` 0..1 sweeps
 * a diagonal wave that turns dots `litColor`. `marks` force individual dots
 * to a colour/size (the "one stock" spotlight).
 */
export const DotField: React.FC<{
	cols: number;
	rows: number;
	count?: number;
	gap: number;
	r: number;
	reveal?: number;
	lit?: number;
	baseColor: string;
	litColor: string;
	dim?: number;
	marks?: Record<number, {color: string; scale?: number}>;
	style?: React.CSSProperties;
}> = ({cols, rows, count, gap, r, reveal = 1, lit = 0, baseColor, litColor, dim = 0, marks = {}, style}) => {
	const n = count ?? cols * rows;
	const shown = Math.round(n * reveal);
	const w = cols * gap;
	const h = rows * gap;
	const dots: React.ReactNode[] = [];
	for (let i = 0; i < shown; i++) {
		const c = i % cols;
		const rr = Math.floor(i / cols);
		const diag = (c / cols + rr / rows) / 2; // 0..1
		const on = Math.max(0, Math.min(1, (lit * 1.25 - diag) / 0.25));
		const m = marks[i];
		dots.push(
			<circle
				key={i}
				cx={c * gap + gap / 2}
				cy={rr * gap + gap / 2}
				r={r * (m?.scale ?? 1)}
				fill={m ? m.color : on > 0.5 ? litColor : baseColor}
				opacity={m ? 1 : (on > 0.5 ? 0.55 + 0.45 * on : 1) * (1 - dim)}
			/>,
		);
	}
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', overflow: 'visible', ...style}}>
			{dots}
		</svg>
	);
};

/** Centre of dot `i` in the field's own coordinates. */
export const dotCenter = (i: number, cols: number, gap: number): [number, number] => [(i % cols) * gap + gap / 2, Math.floor(i / cols) * gap + gap / 2];
