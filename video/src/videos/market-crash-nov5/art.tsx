import React from 'react';
import {C} from './ui';

/**
 * Original, neutral line illustrations (no logos, no photos, no party imagery).
 * All drawn on the brief palette.
 */

/** A domed legislative building, drawn on with `draw` 0..1 (stroke reveal). */
export const CapitolLine: React.FC<{w: number; draw: number; color?: string}> = ({w, draw, color = C.ink}) => {
	const h = w * 0.68;
	const s = (delay: number, span = 0.55) => {
		const p = Math.max(0, Math.min(1, (draw - delay) / span));
		return {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p, fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	};
	const cols = Array.from({length: 13}, (_, i) => 130 + i * 45);
	const drumCols = Array.from({length: 9}, (_, i) => 290 + i * 27.5);
	return (
		<svg width={w} height={h} viewBox="0 0 800 544">
			{/* steps + base */}
			<path d="M40 520 H760 M70 500 H730 M100 480 H700" strokeWidth={5} {...s(0)} />
			{/* wings */}
			<path d="M100 480 V360 H300 M500 360 H700 V480" strokeWidth={5} {...s(0.08)} />
			<path d="M120 360 V300 H300 M500 300 H680 V360" strokeWidth={4} {...s(0.12)} />
			{/* central portico */}
			<path d="M300 480 V330 H500 V480 M290 330 L400 285 L510 330" strokeWidth={5} {...s(0.16)} />
			{cols.map((x, i) => (
				<path key={i} d={`M${x} 470 V${x > 290 && x < 510 ? 340 : 370}`} strokeWidth={3} {...s(0.2 + i * 0.01, 0.4)} />
			))}
			{/* drum */}
			<path d="M280 285 V215 H520 V285 M270 215 H530" strokeWidth={5} {...s(0.3)} />
			{drumCols.map((x, i) => (
				<path key={i} d={`M${x} 280 V222`} strokeWidth={3} {...s(0.34 + i * 0.01, 0.4)} />
			))}
			{/* dome + lantern */}
			<path d="M290 215 C300 110 500 110 510 215" strokeWidth={5} {...s(0.42)} />
			<path d="M330 205 C345 140 455 140 470 205 M372 150 C385 128 415 128 428 150" strokeWidth={3} {...s(0.48)} />
			<path d="M385 130 V96 H415 V130 M380 96 C385 74 415 74 420 96 M400 74 V44" strokeWidth={4} {...s(0.55, 0.4)} />
		</svg>
	);
};

/** Generic processor (no brand): package, pins, die grid. */
export const Chip: React.FC<{size: number; glow?: number; color?: string}> = ({size, glow = 0, color = C.ink}) => {
	const pins = Array.from({length: 8}, (_, i) => 62 + i * 25);
	return (
		<svg width={size} height={size} viewBox="0 0 300 300" style={{overflow: 'visible', filter: glow > 0 ? `drop-shadow(0 0 ${30 * glow}px rgba(255,70,85,${0.55 * glow}))` : undefined}}>
			{pins.map((p) => (
				<g key={p} stroke={C.muted} strokeWidth={6} strokeLinecap="round">
					<line x1={p} y1={20} x2={p} y2={44} />
					<line x1={p} y1={256} x2={p} y2={280} />
					<line x1={20} y1={p} x2={44} y2={p} />
					<line x1={256} y1={p} x2={280} y2={p} />
				</g>
			))}
			<rect x={44} y={44} width={212} height={212} rx={22} fill="#1B201D" stroke={color} strokeWidth={5} />
			<rect x={88} y={88} width={124} height={124} rx={10} fill="#232A26" stroke={C.muted} strokeWidth={3} />
			{[0, 1, 2, 3].map((i) => (
				<g key={i} stroke="rgba(245,247,245,0.18)" strokeWidth={2}>
					<line x1={88 + (i + 1) * 24.8} y1={92} x2={88 + (i + 1) * 24.8} y2={208} />
					<line x1={92} y1={88 + (i + 1) * 24.8} x2={208} y2={88 + (i + 1) * 24.8} />
				</g>
			))}
			<circle cx={70} cy={70} r={6} fill={C.muted} />
		</svg>
	);
};

const Rack: React.FC<{x: number; y: number; w: number; h: number; frame: number; seed: number; dim: number}> = ({x, y, w, h, frame, seed, dim}) => {
	const units = 9;
	return (
		<g>
			{/* side face for 2.5D depth */}
			<path d={`M${x + w} ${y} l34 -22 v${h} l-34 22 z`} fill="#141816" stroke={C.line} strokeWidth={2} />
			<path d={`M${x} ${y} l34 -22 h${w} l-34 22 z`} fill="#1E2421" stroke={C.line} strokeWidth={2} />
			<rect x={x} y={y} width={w} height={h} fill="#181D1A" stroke="#3A4540" strokeWidth={3} rx={4} />
			{Array.from({length: units}, (_, i) => {
				const uy = y + 14 + i * ((h - 28) / units);
				const on = Math.sin(frame * 0.35 + seed * 3 + i * 1.7) > -0.2;
				return (
					<g key={i}>
						<rect x={x + 12} y={uy} width={w - 24} height={(h - 28) / units - 8} rx={3} fill="#212824" />
						<circle cx={x + 26} cy={uy + ((h - 28) / units - 8) / 2} r={4} fill={on ? C.green : '#2E3833'} opacity={dim} />
						<rect x={x + 40} y={uy + ((h - 28) / units - 8) / 2 - 2} width={w - 70} height={4} rx={2} fill="#2C3530" />
					</g>
				);
			})}
		</g>
	);
};

/**
 * Layered 2.5D data center: power (back), racks (mid), crane + scaffold (right),
 * chip + cooling fan (front). `px` = lateral parallax offset; `craneRun` 0..1
 * (1 = construction moving, 0 = stalled); `stall` 0..1 tints the build site red.
 */
export const DataCenter: React.FC<{w: number; frame: number; px?: number; craneRun?: number; stall?: number; dimRacks?: number}> = ({w, frame, px = 0, craneRun = 1, stall = 0, dimRacks = 1}) => {
	const h = w * 0.66;
	const swing = Math.sin(frame * 0.06) * 7 * craneRun;
	const fanRot = frame * 9;
	const L = (k: number) => `translate(${px * k}px, 0)`;
	return (
		<div style={{position: 'relative', width: w, height: h}}>
			{/* back layer: power line + pylon */}
			<svg width={w} height={h} viewBox="0 0 1000 660" style={{position: 'absolute', inset: 0, transform: L(0.35), overflow: 'visible'}}>
				<g stroke={C.muted} strokeWidth={4} fill="none" opacity={0.7}>
					<path d="M60 380 L100 120 L140 380 M75 290 H125 M85 210 H115 M100 120 V95 M70 150 H130" />
					<path d="M130 150 Q 300 220 470 170" strokeDasharray="10 10" />
				</g>
				<path d="M96 210 l22 -46 h-14 l10 -34 l-30 52 h16 z" fill={C.green} opacity={0.85} />
			</svg>
			{/* mid layer: racks on a floor */}
			<svg width={w} height={h} viewBox="0 0 1000 660" style={{position: 'absolute', inset: 0, transform: L(0.7), overflow: 'visible'}}>
				<path d="M150 560 L300 470 H900 L760 560 Z" fill="#111513" stroke={C.line} strokeWidth={2} />
				{[0, 1, 2, 3].map((i) => (
					<Rack key={i} x={250 + i * 120} y={250 - i * 6} w={96} h={290} frame={frame} seed={i} dim={dimRacks} />
				))}
			</svg>
			{/* right: crane + unfinished frame */}
			<svg width={w} height={h} viewBox="0 0 1000 660" style={{position: 'absolute', inset: 0, transform: L(0.55), overflow: 'visible'}}>
				<g stroke={stall > 0 ? `rgb(${Math.round(245 + 10 * stall)},${Math.round(247 - 177 * stall)},${Math.round(245 - 160 * stall)})` : C.ink} strokeWidth={4} fill="none" opacity={0.9}>
					<path d="M880 560 V60 M860 560 V60 M860 60 H880 M860 100 L880 140 M860 180 L880 220 M860 260 L880 300 M860 340 L880 380 M860 420 L880 460" />
					<g transform={`rotate(${swing} 870 70)`}>
						<path d="M700 70 H990 M700 70 L870 30 L990 70" />
						<path d={`M760 70 V${170 + 30 * craneRun}`} strokeWidth={2} />
						<rect x={735} y={170 + 30 * craneRun} width={50} height={16} />
					</g>
					<path d="M780 560 V420 H960 V560 M780 490 H960 M840 420 V560 M900 420 V560" strokeDasharray="14 10" opacity={0.7} />
				</g>
			</svg>
			{/* front: chip + cooling fan */}
			<div style={{position: 'absolute', left: 30 + px * 1.0, top: h * 0.6}}>
				<Chip size={w * 0.19} />
			</div>
			<svg width={w * 0.17} height={w * 0.17} viewBox="0 0 200 200" style={{position: 'absolute', left: w * 0.8 + px * 1.0, top: h * 0.74}}>
				<circle cx={100} cy={100} r={92} fill="#151917" stroke={C.muted} strokeWidth={6} />
				<g transform={`rotate(${fanRot} 100 100)`} fill="#8FB5A2" opacity={0.85}>
					{[0, 72, 144, 216, 288].map((a) => (
						<path key={a} transform={`rotate(${a} 100 100)`} d="M100 100 C 110 60 150 50 160 70 C 150 90 120 100 100 100 Z" />
					))}
				</g>
				<circle cx={100} cy={100} r={14} fill={C.ink} />
			</svg>
		</div>
	);
};
