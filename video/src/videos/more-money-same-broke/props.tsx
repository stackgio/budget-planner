import React from 'react';
import {editorial, story, type Palette} from '../../story/theme';

/** Small uppercase label (letter-spaced). */
export const Kicker: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = editorial.muted, size = 30, style}) => (
	<div style={{fontFamily: story.font, fontSize: size, fontWeight: 900, letterSpacing: 4, color, textTransform: 'uppercase', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** "EXAMPLE" pill — every figure in this video is the script's illustration. */
export const ExampleTag: React.FC<{palette?: Palette; style?: React.CSSProperties; text?: string}> = ({palette = editorial, style, text = 'EXAMPLE'}) => (
	<div
		style={{
			position: 'absolute',
			fontFamily: story.font,
			fontSize: 28,
			fontWeight: 900,
			letterSpacing: 3,
			color: palette.muted,
			border: `2px solid ${palette.line}`,
			borderRadius: 10,
			padding: '6px 12px',
			...style,
		}}
	>
		{text}
	</div>
);

/** Shiny upgraded car (side view). Width w, height w*0.5. */
export const NiceCar: React.FC<{w: number; wheelSpin?: number; style?: React.CSSProperties}> = ({w, wheelSpin = 0, style}) => (
	<svg width={w} height={w * 0.5} viewBox="0 0 400 200" style={{position: 'absolute', overflow: 'visible', ...style}}>
		<ellipse cx={200} cy={186} rx={180} ry={12} fill="rgba(60,45,20,0.18)" />
		<path d="M24,142Q20,112 48,104L112,92Q150,48 214,46H262Q306,48 334,92L370,102Q388,110 386,140L382,158H28Z" fill="#121316" />
		<path d="M128,94Q158,62 212,60H236V96Z" fill="#CFE9DB" />
		<path d="M250,60H262Q296,62 318,96H250Z" fill="#CFE9DB" />
		<path d="M40,124H372" stroke="#1E9E57" strokeWidth={6} strokeLinecap="round" />
		<rect x={352} y={110} width={26} height={12} rx={5} fill="#FFE19A" />
		<rect x={30} y={112} width={18} height={12} rx={4} fill="#D9472F" />
		{[100, 304].map((cx) => (
			<g key={cx} transform={`rotate(${wheelSpin},${cx},158)`}>
				<circle cx={cx} cy={158} r={30} fill="#2B2F36" />
				<circle cx={cx} cy={158} r={15} fill="#C7CBD2" />
				<rect x={cx - 2.5} y={130} width={5} height={56} fill="#2B2F36" />
			</g>
		))}
		{/* sparkle: it's NEW */}
		<path d="M226,22l6,14l14,6l-14,6l-6,14l-6,-14l-14,-6l14,-6Z" fill="#E2A72E" />
	</svg>
);

/** Food-delivery paper bag with an order ticket (generic, no brand). */
export const TakeoutBag: React.FC<{w: number; style?: React.CSSProperties}> = ({w, style}) => (
	<svg width={w} height={w * 1.1} viewBox="0 0 200 220" style={{position: 'absolute', overflow: 'visible', ...style}}>
		<ellipse cx={100} cy={214} rx={84} ry={8} fill="rgba(60,45,20,0.18)" />
		<path d="M30,60H170L180,210H20Z" fill="#C89B62" />
		<path d="M30,60H170L166,84H34Z" fill="#B0844E" />
		<path d="M70,60Q70,22 100,22Q130,22 130,60" fill="none" stroke="#8C6435" strokeWidth={9} />
		<rect x={58} y={112} width={84} height={64} rx={8} fill="#FFFDF8" />
		<rect x={70} y={126} width={60} height={7} rx={3} fill="#121316" />
		<rect x={70} y={142} width={44} height={6} rx={3} fill="#857D6E" />
		<rect x={70} y={156} width={52} height={6} rx={3} fill="#857D6E" />
		{/* steam */}
		<path d="M84,14q-8,-10 0,-20M104,10q-8,-10 0,-20M124,14q-8,-10 0,-20" fill="none" stroke="#857D6E" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
	</svg>
);

/** One shopping bag. */
export const ShopBag: React.FC<{w: number; color: string; style?: React.CSSProperties}> = ({w, color, style}) => (
	<svg width={w} height={w * 1.15} viewBox="0 0 160 184" style={{position: 'absolute', overflow: 'visible', ...style}}>
		<path d="M52,52Q52,14 80,14Q108,14 108,52" fill="none" stroke="#121316" strokeWidth={8} />
		<path d="M16,48H144L152,180H8Z" fill={color} />
		<path d="M16,48H144L146,64H14Z" fill="rgba(0,0,0,0.12)" />
	</svg>
);

/** Phone showing an "order placed" screen. */
export const Phone: React.FC<{w: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({w, style, children}) => (
	<div style={{position: 'absolute', width: w, height: w * 1.9, borderRadius: w * 0.14, background: '#121316', padding: w * 0.05, boxShadow: '0 20px 30px rgba(60,45,20,0.22)', ...style}}>
		<div style={{width: '100%', height: '100%', borderRadius: w * 0.1, background: '#FFFDF8', overflow: 'hidden', position: 'relative'}}>{children}</div>
	</div>
);

/** Paycheck (generic check). */
export const Paycheck: React.FC<{w: number; amount: string; style?: React.CSSProperties}> = ({w, amount, style}) => (
	<div
		style={{
			position: 'absolute',
			width: w,
			height: w * 0.44,
			borderRadius: w * 0.04,
			background: '#E9F6EE',
			border: `${Math.max(3, w * 0.012)}px solid #1E9E57`,
			boxShadow: '0 14px 22px rgba(60,45,20,0.2)',
			fontFamily: story.font,
			padding: w * 0.06,
			boxSizing: 'border-box',
			...style,
		}}
	>
		<div style={{fontSize: w * 0.075, fontWeight: 900, letterSpacing: 2, color: '#13703C'}}>PAYCHECK</div>
		<div style={{fontSize: w * 0.17, fontWeight: 900, color: '#121316', letterSpacing: -1, marginTop: w * 0.02}}>{amount}</div>
		<div style={{position: 'absolute', left: w * 0.06, right: w * 0.4, bottom: w * 0.07, height: 3, background: '#857D6E', opacity: 0.6}} />
	</div>
);

/** Front door with frame, window and knob (world units, w × w*2.1). */
export const FrontDoor: React.FC<{w: number; open?: number; style?: React.CSSProperties}> = ({w, open = 0, style}) => (
	<svg width={w} height={w * 2.1} viewBox="0 0 200 420" style={{position: 'absolute', overflow: 'visible', ...style}}>
		<rect x={0} y={0} width={200} height={420} rx={6} fill="#2B2F36" />
		<rect x={12} y={12} width={176} height={408} fill="#1B1E23" />
		<g transform={`translate(14,14) scale(${1 - open * 0.55},1)`}>
			<rect x={0} y={0} width={172} height={406} fill="#1E9E57" />
			<rect x={22} y={26} width={128} height={110} rx={8} fill="#CFE9DB" />
			<rect x={22} y={170} width={128} height={90} rx={8} fill="none" stroke="#13703C" strokeWidth={6} />
			<rect x={22} y={286} width={128} height={90} rx={8} fill="none" stroke="#13703C" strokeWidth={6} />
			<circle cx={146} cy={226} r={10} fill="#E2A72E" />
		</g>
		<rect x={-40} y={414} width={280} height={14} rx={6} fill="#857D6E" />
	</svg>
);

/** Cardboard parcel. */
export const Parcel: React.FC<{w: number; style?: React.CSSProperties}> = ({w, style}) => (
	<svg width={w} height={w * 0.72} viewBox="0 0 150 108" style={{position: 'absolute', overflow: 'visible', ...style}}>
		<rect x={2} y={2} width={146} height={104} rx={6} fill="#C89B62" stroke="#8C6435" strokeWidth={4} />
		<rect x={64} y={2} width={22} height={104} fill="#E3C08C" />
		<rect x={16} y={70} width={36} height={20} rx={3} fill="#FFFDF8" />
	</svg>
);

/** Simple product art for the phone screen. */
export const Hoodie: React.FC<{w: number; color: string}> = ({w, color}) => (
	<svg width={w} height={w} viewBox="0 0 200 200">
		<path d="M60,40Q100,10 140,40L190,80L168,112L150,98V180H50V98L32,112L10,80Z" fill={color} />
		<path d="M78,40Q100,70 122,40" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={8} />
		<rect x={72} y={124} width={56} height={30} rx={8} fill="rgba(0,0,0,0.15)" />
	</svg>
);
export const Sneaker: React.FC<{w: number; color: string}> = ({w, color}) => (
	<svg width={w} height={w} viewBox="0 0 200 200">
		<path d="M20,120Q24,80 52,72L90,64Q104,92 130,96L176,104Q192,110 190,134V146H20Z" fill={color} />
		<rect x={18} y={140} width={174} height={20} rx={8} fill="#FFFDF8" stroke="#121316" strokeWidth={4} />
		<path d="M70,78L80,98M86,74L96,96" stroke="#FFFDF8" strokeWidth={6} strokeLinecap="round" />
	</svg>
);
