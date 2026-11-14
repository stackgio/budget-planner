import React from 'react';
import {dmm} from '../theme';

type ColProps = {cx: number; top: number; bottom: number; w: number};

/** Perspective depth of the elliptical rims (2.5D, slightly from above). */
const rimH = (w: number) => w * 0.16;

/**
 * Back half of a 2.5D glass column: dark inner wall, back rim, floor shadow
 * and an internal emerald light that rises with `lightY` and grows with
 * `light` (0..1). Draw contents (notes) between <GlassBack> and <GlassFront>.
 */
export const GlassBack: React.FC<ColProps & {light: number; lightY: number}> = ({cx, top, bottom, w, light, lightY}) => {
	const c = dmm.color;
	const rh = rimH(w);
	const x0 = cx - w / 2;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<defs>
				<radialGradient id="gcFloor" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={c.accent} stopOpacity={0.05 + 0.35 * light} />
					<stop offset="100%" stopColor={c.accent} stopOpacity={0} />
				</radialGradient>
				<linearGradient id="gcInner" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.05} />
					<stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.012} />
					<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.04} />
				</linearGradient>
				<radialGradient id="gcGlow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={c.accent} stopOpacity={0.55 * light} />
					<stop offset="60%" stopColor={c.accent} stopOpacity={0.12 * light} />
					<stop offset="100%" stopColor={c.accent} stopOpacity={0} />
				</radialGradient>
			</defs>
			{/* floor pool + contact shadow */}
			<ellipse cx={cx} cy={bottom + 6} rx={w * (1.6 + light * 0.8)} ry={rh * (1.4 + light * 0.6)} fill="url(#gcFloor)" />
			<ellipse cx={cx} cy={bottom + 4} rx={w * 0.62} ry={rh * 0.55} fill="rgba(0,0,0,0.55)" />
			{/* inner volume */}
			<rect x={x0} y={top} width={w} height={bottom - top} fill="url(#gcInner)" />
			{/* internal light (rises with the stack) */}
			<ellipse cx={cx} cy={lightY} rx={w * 1.25} ry={w * 1.1} fill="url(#gcGlow)" />
			{/* back rims */}
			<path d={`M ${x0} ${top} A ${w / 2} ${rh / 2} 0 0 1 ${x0 + w} ${top}`} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
			<path d={`M ${x0} ${bottom} A ${w / 2} ${rh / 2} 0 0 1 ${x0 + w} ${bottom}`} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={2} />
		</svg>
	);
};

/** Front half: walls, specular streaks, front rims, base plinth. */
export const GlassFront: React.FC<ColProps & {light: number}> = ({cx, top, bottom, w, light}) => {
	const c = dmm.color;
	const rh = rimH(w);
	const x0 = cx - w / 2;
	const x1 = cx + w / 2;
	const h = bottom - top;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<defs>
				<linearGradient id="gcWallL" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.34} />
					<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
				</linearGradient>
				<linearGradient id="gcWallR" x1="1" y1="0" x2="0" y2="0">
					<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.2} />
					<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
				</linearGradient>
				<linearGradient id="gcStreak" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
					<stop offset="18%" stopColor="#FFFFFF" stopOpacity={0.22} />
					<stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.08} />
					<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
				</linearGradient>
				<linearGradient id="gcPlinth" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#1A211D" />
					<stop offset="100%" stopColor="#0B100D" />
				</linearGradient>
			</defs>
			{/* wall falloff (thickness read at the edges) */}
			<rect x={x0} y={top} width={22} height={h} fill="url(#gcWallL)" />
			<rect x={x1 - 18} y={top} width={18} height={h} fill="url(#gcWallR)" />
			<line x1={x0} y1={top} x2={x0} y2={bottom} stroke="rgba(255,255,255,0.42)" strokeWidth={2.5} />
			<line x1={x1} y1={top} x2={x1} y2={bottom} stroke="rgba(255,255,255,0.26)" strokeWidth={2.5} />
			{/* specular streaks */}
			<rect x={x0 + w * 0.16} y={top + 10} width={10} height={h - 20} rx={5} fill="url(#gcStreak)" />
			<rect x={x0 + w * 0.26} y={top + 40} width={3} height={h * 0.7} rx={2} fill="url(#gcStreak)" opacity={0.7} />
			{/* edge catch of the internal light */}
			<line x1={x1} y1={top} x2={x1} y2={bottom} stroke={c.accent} strokeOpacity={0.45 * light} strokeWidth={3} />
			{/* front rims */}
			<path d={`M ${x0} ${top} A ${w / 2} ${rh / 2} 0 0 0 ${x1} ${top}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} />
			{/* plinth */}
			<path d={`M ${x0 - 16} ${bottom} A ${w / 2 + 16} ${rh / 2 + 4} 0 0 0 ${x1 + 16} ${bottom} L ${x1 + 16} ${bottom + 26} A ${w / 2 + 16} ${rh / 2 + 4} 0 0 1 ${x0 - 16} ${bottom + 26} Z`} fill="url(#gcPlinth)" />
			<path d={`M ${x0 - 16} ${bottom} A ${w / 2 + 16} ${rh / 2 + 4} 0 0 0 ${x1 + 16} ${bottom}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
		</svg>
	);
};

export const glassRim = rimH;
