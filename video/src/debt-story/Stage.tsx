import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, H, W} from './theme';

/** Full-frame SVG layer in 1080×1920 canvas space. */
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
		{children}
	</svg>
);

/** Camera: scale about a focus point, then offset. */
export const Cam: React.FC<{
	children: React.ReactNode;
	zoom?: number;
	fx?: number;
	fy?: number;
	x?: number;
	y?: number;
	rot?: number;
	style?: React.CSSProperties;
}> = ({children, zoom = 1, fx = W / 2, fy = H / 2, x = 0, y = 0, rot = 0, style}) => (
	<AbsoluteFill
		style={{
			transformOrigin: `${fx}px ${fy}px`,
			transform: `translate(${x}px, ${y}px) scale(${zoom}) rotate(${rot}deg)`,
			...style,
		}}
	>
		{children}
	</AbsoluteFill>
);

/** Matte-black base with a soft centre lift and vignette. `tint` adds a coloured ambient glow. */
export const Backdrop: React.FC<{tint?: string; tintAmt?: number; cy?: number}> = ({tint, tintAmt = 0, cy = 900}) => (
	<AbsoluteFill style={{background: C.bg}}>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 900px 1100px at 540px ${cy}px, #161B19 0%, ${C.bg} 70%)`}} />
		{tint && tintAmt > 0 ? (
			<AbsoluteFill style={{opacity: tintAmt, background: `radial-gradient(ellipse 800px 900px at 540px ${cy}px, ${tint} 0%, transparent 70%)`}} />
		) : null}
	</AbsoluteFill>
);

export const Vignette: React.FC<{amt?: number}> = ({amt = 0.75}) => (
	<AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 760px 1150px at 540px 900px, transparent 55%, rgba(0,0,0,${amt}) 100%)`}} />
);

export const Watermark: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			right: 0,
			top: 1546,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			gap: 10,
			fontFamily: FONT,
			fontWeight: 700,
			fontSize: 25,
			letterSpacing: 0.5,
			color: C.gray,
			opacity: 0.62,
		}}
	>
		<svg width={22} height={22} viewBox="0 0 30 30">
			<rect x={1} y={18} width={7} height={11} rx={2} fill={C.green} />
			<rect x={11} y={11} width={7} height={18} rx={2} fill={C.green} />
			<rect x={21} y={2} width={7} height={27} rx={2} fill={C.white} />
		</svg>
		@stackwithgio
	</div>
);

/** Reveals children inside a growing circle (scene transitions). */
export const CircleReveal: React.FC<{children: React.ReactNode; cx: number; cy: number; r: number; ring?: string; ringW?: number}> = ({
	children,
	cx,
	cy,
	r,
	ring,
	ringW = 10,
}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>
		{ring && r < 2300 ? (
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<circle cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth={ringW} />
			</svg>
		) : null}
	</AbsoluteFill>
);
