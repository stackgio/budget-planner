import React from 'react';

/**
 * Side-profile vehicle rendered in SVG with studio-style lighting:
 * graded paint, a moving specular "light sweep", rim light, LED lamps,
 * spinning wheels, contact shadow and an optional floor reflection.
 * No brand marks. Used when licensed automotive footage isn't available.
 *
 *  variant 'luxury' — low fastback coupe, long hood, big multi-spoke rims
 *  variant 'sedan'  — practical four-door, upright cabin, simple 5-spoke alloys
 */

export type CarPaint = {top: string; mid: string; low: string; base: string; spec: string};

export const PAINTS = {
	gunmetal: {top: '#6B737E', mid: '#22262C', low: '#0C0E11', base: '#050607', spec: '#FFFFFF'},
	dusk: {top: '#C79A7A', mid: '#3A2E33', low: '#141218', base: '#07070A', spec: '#FFD9B0'},
	cold: {top: '#46505C', mid: '#1A1E24', low: '#0B0D10', base: '#040506', spec: '#BFD3E6'},
	silver: {top: '#F4F6F8', mid: '#B9C0C8', low: '#7D858F', base: '#4A5058', spec: '#FFFFFF'},
	pearl: {top: '#FFFFFF', mid: '#E4E1DA', low: '#B7B2A8', base: '#7C776E', spec: '#FFFFFF'},
	silhouette: {top: '#1A1C20', mid: '#0E0F12', low: '#08090A', base: '#030303', spec: '#FFFFFF'},
} satisfies Record<string, CarPaint>;

type Geometry = {
	body: string;
	glass: string;
	pillars: string[];
	rimLine: string;
	character: string;
	seams: string[];
	sill: string;
	mirror: string;
	head: string;
	tail: string;
	wheels: [number, number][];
	wheelR: number;
	rimR: number;
	ground: number;
	headPoint: [number, number];
	handle: [number, number];
};

const LUX: Geometry = {
	body: 'M40 285 C25 280 22 250 28 225 C32 200 50 185 90 178 L250 168 C320 120 400 92 520 88 C600 86 650 92 700 120 C740 142 770 158 820 166 L940 186 C975 192 990 205 992 230 C994 255 985 275 965 285 L907 288 A82 82 0 0 0 743 288 L287 288 A82 82 0 0 0 123 288 Z',
	glass: 'M292 166 C350 127 430 104 520 101 C590 100 640 108 683 133 L716 160 Z',
	pillars: ['M566 100 L582 100 L590 162 L572 163 Z'],
	rimLine: 'M90 178 L250 168 C320 120 400 92 520 88 C600 86 650 92 700 120 C740 142 770 158 820 166 L940 186 C975 192 990 205 992 230',
	character: 'M60 214 C300 200 700 200 978 222',
	seams: ['M512 172 C506 210 506 245 512 280', 'M742 170 C738 205 736 230 740 254'],
	sill: 'M287 288 L743 288 L740 270 C600 266 420 266 290 270 Z',
	mirror: 'M688 162 C694 146 724 144 734 158 L730 166 Z',
	head: 'M902 196 L982 206 L979 214 L908 205 Z',
	tail: 'M30 200 L96 186 L98 193 L33 208 Z',
	wheels: [[205, 290], [825, 290]],
	wheelR: 68,
	rimR: 50,
	ground: 358,
	headPoint: [980, 210],
	handle: [548, 196],
};

const SEDAN: Geometry = {
	body: 'M45 280 C30 270 28 240 34 215 C38 196 50 186 80 182 L200 176 C240 140 290 92 360 78 C460 64 580 64 660 76 C720 92 760 130 790 160 L930 182 C965 188 982 205 984 230 C986 255 978 275 960 282 L897 284 A74 74 0 0 0 749 284 L273 284 A74 74 0 0 0 125 284 Z',
	glass: 'M226 172 C268 130 308 99 366 90 C460 79 580 79 650 90 C700 104 734 134 760 162 Z',
	pillars: ['M412 84 L428 84 L440 168 L420 168 Z', 'M594 82 L610 84 L612 166 L594 166 Z'],
	rimLine: 'M80 182 L200 176 C240 140 290 92 360 78 C460 64 580 64 660 76 C720 92 760 130 790 160 L930 182 C965 188 982 205 984 230',
	character: 'M58 212 C300 204 700 204 972 220',
	seams: ['M430 176 C426 210 426 250 432 278', 'M606 174 C602 210 602 250 606 276', 'M780 178 C776 205 774 228 778 250'],
	sill: 'M273 284 L749 284 L746 268 C600 264 420 264 276 268 Z',
	mirror: 'M752 160 C758 146 786 146 794 160 L790 168 Z',
	head: 'M906 192 L974 204 L970 216 L910 206 Z',
	tail: 'M36 202 L88 192 L90 206 L38 214 Z',
	wheels: [[199, 288], [823, 288]],
	wheelR: 62,
	rimR: 42,
	ground: 350,
	headPoint: [972, 210],
	handle: [520, 198],
};

const Wheel: React.FC<{cx: number; cy: number; r: number; rimR: number; spin: number; luxury: boolean; id: string; light: number}> = ({cx, cy, r, rimR, spin, luxury, id, light}) => {
	const spokes = luxury ? 10 : 5;
	return (
		<g>
			<circle cx={cx} cy={cy} r={r} fill="#08090A" />
			<circle cx={cx} cy={cy} r={r - 4} fill={`url(#${id}-tire)`} />
			<circle cx={cx} cy={cy} r={rimR + 3} fill="#1A1C1F" />
			<g transform={`rotate(${spin} ${cx} ${cy})`}>
				<circle cx={cx} cy={cy} r={rimR} fill={`url(#${id}-rim)`} />
				<circle cx={cx} cy={cy} r={rimR * 0.86} fill={luxury ? '#0E0F11' : '#2A2E33'} />
				{Array.from({length: spokes}).map((_, i) => {
					const a = (i / spokes) * 360;
					const w = luxury ? 5 : 11;
					return (
						<g key={i} transform={`rotate(${a} ${cx} ${cy})`}>
							<path
								d={`M${cx - w / 2} ${cy - rimR * 0.2} L${cx - w * 0.9} ${cy - rimR * 0.86} L${cx + w * 0.9} ${cy - rimR * 0.86} L${cx + w / 2} ${cy - rimR * 0.2} Z`}
								fill={`url(#${id}-rim)`}
							/>
						</g>
					);
				})}
				<circle cx={cx} cy={cy} r={rimR * 0.2} fill={`url(#${id}-rim)`} />
				<circle cx={cx} cy={cy} r={rimR * 0.08} fill="#0A0B0C" />
			</g>
			{luxury && <path d={`M${cx + rimR * 0.45} ${cy - rimR * 0.62} A${rimR * 0.76} ${rimR * 0.76} 0 0 1 ${cx + rimR * 0.76} ${cy + rimR * 0.05}`} stroke="#B33A2E" strokeWidth={9} fill="none" opacity={0.85} />}
			{/* top highlight on the tyre from the overhead light */}
			<path d={`M${cx - r * 0.7} ${cy - r * 0.72} A${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.72}`} stroke="rgba(255,255,255,0.10)" strokeWidth={3} fill="none" opacity={light} />
		</g>
	);
};

export type CarProps = {
	variant?: 'luxury' | 'sedan';
	paint?: CarPaint;
	/** px width of the car */
	w?: number;
	/** 0..1 head/tail lamp intensity */
	lights?: number;
	/** headlight beam cone (0..1) */
	beam?: number;
	/** wheel rotation in degrees */
	spin?: number;
	/** specular sweep position, -0.3..1.3 across the body */
	sheen?: number;
	/** strength of the specular sweep */
	sheenAmt?: number;
	/** overall top rim light 0..1 */
	rim?: number;
	reflection?: number;
	shadow?: number;
	id: string;
	style?: React.CSSProperties;
};

const CarSvg: React.FC<CarProps & {flip?: boolean}> = ({variant = 'luxury', paint = PAINTS.gunmetal, lights = 1, beam = 0, spin = 0, sheen = 0.5, sheenAmt = 0.55, rim = 1, id, shadow = 1}) => {
	const g = variant === 'luxury' ? LUX : SEDAN;
	const lux = variant === 'luxury';
	return (
		<svg viewBox="0 0 1000 380" width="100%" height="100%" style={{overflow: 'visible', display: 'block'}}>
			<defs>
				<linearGradient id={`${id}-paint`} x1="0" y1="80" x2="0" y2="290" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={paint.top} />
					<stop offset="0.28" stopColor={paint.mid} />
					<stop offset="0.56" stopColor={paint.low} />
					<stop offset="0.62" stopColor={paint.mid} />
					<stop offset="0.7" stopColor={paint.low} />
					<stop offset="1" stopColor={paint.base} />
				</linearGradient>
				<linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
					<stop offset={Math.max(0, sheen - 0.16)} stopColor={paint.spec} stopOpacity={0} />
					<stop offset={Math.min(1, Math.max(0, sheen))} stopColor={paint.spec} stopOpacity={0.9} />
					<stop offset={Math.min(1, sheen + 0.16)} stopColor={paint.spec} stopOpacity={0} />
				</linearGradient>
				<linearGradient id={`${id}-sheenMask`} x1="0" y1="80" x2="0" y2="290" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor="#fff" stopOpacity={1} />
					<stop offset="0.45" stopColor="#fff" stopOpacity={0.25} />
					<stop offset="0.62" stopColor="#fff" stopOpacity={0.6} />
					<stop offset="0.75" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
				<mask id={`${id}-sm`}>
					<rect x={0} y={0} width={1000} height={380} fill={`url(#${id}-sheenMask)`} />
				</mask>
				<linearGradient id={`${id}-glass`} x1="0" y1="90" x2="0" y2="170" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={lux ? '#2B3138' : '#3A444F'} />
					<stop offset="0.5" stopColor={lux ? '#0B0D10' : '#1C232B'} />
					<stop offset="1" stopColor="#050607" />
				</linearGradient>
				<linearGradient id={`${id}-rimlight`} x1="0" y1="80" x2="0" y2="230" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor="#fff" stopOpacity={0.85} />
					<stop offset="1" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
				<radialGradient id={`${id}-tire`}>
					<stop offset="0.7" stopColor="#141518" />
					<stop offset="1" stopColor="#060607" />
				</radialGradient>
				<linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={lux ? '#9AA1AA' : '#E3E7EB'} />
					<stop offset="0.5" stopColor={lux ? '#4A4F56' : '#A9B0B8'} />
					<stop offset="1" stopColor={lux ? '#1E2125' : '#6E757D'} />
				</linearGradient>
				<linearGradient id={`${id}-beam`} x1={g.headPoint[0]} y1="0" x2={g.headPoint[0] + 700} y2="0" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor="#EAF4FF" stopOpacity={0.55} />
					<stop offset="1" stopColor="#EAF4FF" stopOpacity={0} />
				</linearGradient>
				<filter id={`${id}-glow`} x="-50%" y="-200%" width="200%" height="500%">
					<feGaussianBlur stdDeviation="6" />
				</filter>
				<filter id={`${id}-soft`} x="-20%" y="-50%" width="140%" height="200%">
					<feGaussianBlur stdDeviation="14" />
				</filter>
			</defs>
			{/* contact shadow */}
			<ellipse cx={510} cy={g.ground + 2} rx={470} ry={18} fill="#000" opacity={0.75 * shadow} filter={`url(#${id}-soft)`} />
			{/* headlight beam */}
			{beam > 0 && (
				<path
					d={`M${g.headPoint[0] - 6} ${g.headPoint[1] - 8} L${g.headPoint[0] + 720} ${g.headPoint[1] - 90} L${g.headPoint[0] + 720} ${g.ground + 30} L${g.headPoint[0] - 6} ${g.headPoint[1] + 6} Z`}
					fill={`url(#${id}-beam)`}
					opacity={beam}
					filter={`url(#${id}-glow)`}
				/>
			)}
			<path d={g.body} fill={`url(#${id}-paint)`} />
			<path d={g.sill} fill="#000" opacity={0.45} />
			<path d={g.glass} fill={`url(#${id}-glass)`} />
			{/* glass reflection streak */}
			<path d={g.glass} fill={`url(#${id}-sheen)`} opacity={0.25 * sheenAmt} />
			{g.pillars.map((p, i) => (
				<path key={i} d={p} fill={paint.low} />
			))}
			<path d={g.mirror} fill={paint.mid} />
			{g.seams.map((s, i) => (
				<path key={i} d={s} stroke="#000" strokeOpacity={0.55} strokeWidth={2} fill="none" />
			))}
			<rect x={g.handle[0]} y={g.handle[1]} width={34} height={6} rx={3} fill={paint.top} opacity={0.5} />
			<path d={g.character} stroke="#fff" strokeOpacity={0.16} strokeWidth={2.5} fill="none" />
			{/* specular light sweep across the paint */}
			<g mask={`url(#${id}-sm)`}>
				<path d={g.body} fill={`url(#${id}-sheen)`} opacity={sheenAmt} style={{mixBlendMode: 'screen'}} />
			</g>
			{/* rim light on the roofline */}
			<path d={g.rimLine} stroke={`url(#${id}-rimlight)`} strokeWidth={2.5} fill="none" opacity={rim} />
			{/* lamps */}
			<path d={g.head} fill="#fff" opacity={0.25 + 0.75 * lights} />
			<path d={g.head} fill="#DDEBFF" opacity={lights} filter={`url(#${id}-glow)`} />
			<path d={g.tail} fill="#FF2A2A" opacity={0.3 + 0.7 * lights} />
			<path d={g.tail} fill="#FF2A2A" opacity={0.9 * lights} filter={`url(#${id}-glow)`} />
			{g.wheels.map(([cx, cy], i) => (
				<Wheel key={i} cx={cx} cy={cy} r={g.wheelR} rimR={g.rimR} spin={spin} luxury={lux} id={id} light={rim} />
			))}
		</svg>
	);
};

/** Car with optional floor reflection. Positioned by its bottom-centre (ground contact) at `style.left/top`. */
export const Car: React.FC<CarProps & {x: number; y: number; opacity?: number; filter?: string}> = ({x, y, w = 900, reflection = 0.22, opacity = 1, filter, ...rest}) => {
	const h = w * 0.38;
	const groundFrac = (rest.variant === 'sedan' ? SEDAN : LUX).ground / 380;
	const top = y - h * groundFrac;
	return (
		<div style={{position: 'absolute', left: x - w / 2, top, width: w, height: h, opacity, filter, ...rest.style}}>
			<CarSvg {...rest} />
			{reflection > 0 && (
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: h * groundFrac * 2 - h,
						width: w,
						height: h,
						transform: 'scaleY(-1)',
						opacity: reflection,
						maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 45%)',
						WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 45%)',
						filter: 'blur(1.5px)',
					}}
				>
					<CarSvg {...rest} id={`${rest.id}-r`} beam={0} shadow={0} />
				</div>
			)}
		</div>
	);
};
