import React from 'react';

export type DonutSeg = {value: number; color: string; draw?: number};

/**
 * Allocation donut. Segments are drawn clockwise from 12 o'clock; each
 * segment's `draw` 0..1 grows it along its arc (animate them in sequence).
 * `focus` (segment index) pushes that segment outward slightly.
 */
export const Donut: React.FC<{size: number; thickness: number; segs: DonutSeg[]; track?: string; gapDeg?: number; focus?: number; focusAmt?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
	size,
	thickness,
	segs,
	track = 'rgba(255,255,255,0.08)',
	gapDeg = 2,
	focus,
	focusAmt = 0,
	style,
	children,
}) => {
	const total = segs.reduce((s, x) => s + x.value, 0);
	const r = (size - thickness) / 2 - 12;
	const c = size / 2;
	const circ = 2 * Math.PI * r;
	let acc = 0;
	return (
		<div style={{position: 'absolute', width: size, height: size, ...style}}>
			<svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={thickness} />
				{segs.map((s, i) => {
					const frac = s.value / total;
					const startDeg = (acc / total) * 360 - 90;
					acc += s.value;
					const len = Math.max(0, frac * circ - (gapDeg / 360) * circ) * Math.max(0, Math.min(1, s.draw ?? 1));
					const mid = ((startDeg + frac * 180) * Math.PI) / 180;
					const push = i === focus ? focusAmt * 14 : 0;
					return (
						<circle
							key={i}
							cx={c + Math.cos(mid) * push}
							cy={c + Math.sin(mid) * push}
							r={r}
							fill="none"
							stroke={s.color}
							strokeWidth={thickness}
							strokeDasharray={`${len} ${circ}`}
							transform={`rotate(${startDeg + gapDeg / 2} ${c + Math.cos(mid) * push} ${c + Math.sin(mid) * push})`}
						/>
					);
				})}
			</svg>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
		</div>
	);
};
