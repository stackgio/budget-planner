import React from 'react';
import {noise} from '../anim';
import {C, FONT} from '../theme';

/** Banded stack of cash, centred on (0,0). Illustrative, no denominations. */
export const Cash: React.FC<{w?: number; rot?: number}> = ({w = 170, rot = 0}) => {
	const h = w * 0.36;
	return (
		<g transform={`rotate(${rot})`}>
			<rect x={-w / 2 + 3} y={-h / 2 + 5} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="#2F8F5B" />
			<rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} rx={4} fill="none" stroke="#7CD6A2" strokeWidth={2} opacity={0.7} />
			<circle cx={0} cy={0} r={h * 0.3} fill="#7CD6A2" opacity={0.5} />
			<rect x={-w * 0.09} y={-h / 2} width={w * 0.18} height={h} fill="#F3F0E8" />
			<text x={0} y={h * 0.16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.46} fill="#2F8F5B">
				$
			</text>
		</g>
	);
};

/**
 * Glass savings jar, bottom-centre at (0,0). `fill` 0..1 sets how many cash stacks are inside.
 * Label reads EMERGENCY FUND.
 */
export const Jar: React.FC<{fill: number; w?: number; label?: boolean; frame?: number}> = ({fill, w = 320, label = true}) => {
	const h = w * 1.18;
	const stacks = 8;
	const shown = fill * stacks;
	const inner = w - 44;
	const sh = (h - 90) / stacks;
	return (
		<g>
			<ellipse cx={0} cy={6} rx={w * 0.6} ry={16} fill="#000" opacity={0.55} />
			{/* back glass */}
			<path d={`M ${-w / 2} ${-h + 70} Q ${-w / 2} -2 ${-w / 2 + 30} -2 L ${w / 2 - 30} -2 Q ${w / 2} -2 ${w / 2} ${-h + 70} Z`} fill="rgba(160,210,190,0.07)" />
			{/* cash */}
			<g>
				{Array.from({length: stacks}, (_, i) => {
					const vis = Math.max(0, Math.min(1, shown - i));
					if (vis <= 0) return null;
					return (
						<g key={i} transform={`translate(${noise(i * 4.1) * 10} ${-24 - i * sh - sh / 2 + (1 - vis) * -40})`} opacity={vis}>
							<Cash w={inner * 0.86} rot={noise(i * 2.7) * 5} />
						</g>
					);
				})}
			</g>
			{/* glass front */}
			<path
				d={`M ${-w / 2} ${-h + 70} Q ${-w / 2} -2 ${-w / 2 + 30} -2 L ${w / 2 - 30} -2 Q ${w / 2} -2 ${w / 2} ${-h + 70} Q ${w / 2} ${-h + 40} ${w / 2 - 26} ${-h + 34} L ${-w / 2 + 26} ${-h + 34} Q ${-w / 2} ${-h + 40} ${-w / 2} ${-h + 70} Z`}
				fill="rgba(200,235,220,0.06)"
				stroke="rgba(220,240,232,0.55)"
				strokeWidth={4}
			/>
			<path d={`M ${-w / 2 + 22} ${-h + 90} L ${-w / 2 + 22} -40`} stroke="rgba(255,255,255,0.35)" strokeWidth={8} strokeLinecap="round" />
			<path d={`M ${-w / 2 + 44} ${-h + 100} L ${-w / 2 + 44} ${-h + 180}`} stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round" />
			{/* lid */}
			<rect x={-w / 2 + 14} y={-h} width={w - 28} height={40} rx={10} fill="#1F2A26" stroke="#3B4A44" strokeWidth={3} />
			{[0.2, 0.4, 0.6, 0.8].map((k) => (
				<line key={k} x1={-w / 2 + 14 + (w - 28) * k} x2={-w / 2 + 14 + (w - 28) * k} y1={-h + 6} y2={-h + 34} stroke="#2E3B36" strokeWidth={3} />
			))}
			{label ? (
				<g transform={`translate(0 ${-h * 0.42})`}>
					<rect x={-w * 0.38} y={-34} width={w * 0.76} height={68} rx={8} fill={C.paper} stroke="#C9C3B4" strokeWidth={2} />
					<text x={0} y={-4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.075} fill="#1A1E1C" letterSpacing={1}>
						EMERGENCY
					</text>
					<text x={0} y={24} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.075} fill="#1F8A4E" letterSpacing={1}>
						FUND
					</text>
				</g>
			) : null}
		</g>
	);
};
