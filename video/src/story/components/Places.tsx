import React from 'react';

/**
 * Flat, bold-outline illustrations for banking stories (Stack With Gio).
 * Each renders a block-level SVG whose bottom edge is the object's base, so a
 * wrapper positioned with `bottom` stands it on the floor. Generic artwork:
 * no real bank names, logos or app UIs.
 */

const INK = '#121316';
const txt = (x: number, y: number, s: string, o: {fs?: number; f?: string; w?: number; ls?: number; a?: 'start' | 'middle' | 'end'} = {}) => (
	<text x={x} y={y} textAnchor={o.a ?? 'middle'} fontFamily="Inter" fontWeight={o.w ?? 900} fontSize={o.fs ?? 20} fill={o.f ?? INK} letterSpacing={o.ls ?? 0}>
		{s}
	</text>
);

/** Classic marble bank (pediment, 4 columns, arched door, steps). viewBox 400×314. */
export const BankBuilding: React.FC<{w: number; dark?: boolean; cobwebs?: number; doorOpen?: number; style?: React.CSSProperties}> = ({w, dark, cobwebs = 0, doorOpen = 0, style}) => {
	const s = dark ? '#C7CBD2' : INK;
	const wall = dark ? '#2A2E35' : '#EFE8DA';
	const wall2 = dark ? '#20242A' : '#DDD4C2';
	const inner = dark ? '#1B1E23' : '#E6DECD';
	const door = dark ? '#0B0C0E' : '#6E6656';
	const badge = dark ? '#4A4F57' : '#C9C2B4';
	return (
		<svg width={w} height={(w * 314) / 400} viewBox="0 0 400 314" style={{display: 'block', overflow: 'visible', ...style}}>
			<ellipse cx={200} cy={318} rx={196} ry={9} fill="rgba(0,0,0,.14)" />
			<g stroke={s} strokeWidth={6} strokeLinejoin="round">
				<rect x={12} y={288} width={376} height={26} rx={3} fill={wall2} />
				<rect x={32} y={264} width={336} height={26} rx={3} fill={wall} />
				<rect x={46} y={240} width={308} height={26} fill={wall2} />
				<rect x={46} y={124} width={308} height={118} fill={inner} />
				<path d="M164 242 V180 a36 36 0 0 1 72 0 V242 Z" fill={door} />
				{/* glow from inside when the door "takes" money (0..1) */}
				{doorOpen > 0 && <path d="M168 238 V180 a32 32 0 0 1 64 0 V238 Z" fill="#E2A72E" opacity={0.55 * doorOpen} stroke="none" />}
				<line x1={200} y1={146} x2={200} y2={242} strokeWidth={4} />
				{[66, 124, 246, 304].map((x) => (
					<g key={x}>
						<rect x={x} y={138} width={30} height={96} fill={wall} />
						<line x1={x + 10} y1={142} x2={x + 10} y2={230} strokeWidth={2.5} />
						<line x1={x + 20} y1={142} x2={x + 20} y2={230} strokeWidth={2.5} />
						<rect x={x - 7} y={126} width={44} height={14} rx={2} fill={wall2} />
						<rect x={x - 7} y={230} width={44} height={12} rx={2} fill={wall2} />
					</g>
				))}
				<rect x={30} y={98} width={340} height={30} fill={wall2} />
				<path d="M22 100 L200 14 L378 100 Z" fill={wall} />
				<circle cx={200} cy={68} r={22} fill={badge} />
			</g>
			{cobwebs > 0 && (
				<g stroke={s} strokeWidth={2} fill="none" opacity={0.75 * cobwebs}>
					<path d="M46 126 L46 196 M46 126 L60 194 M46 126 L58 152 M46 146 Q52 145 52 140 M46 164 Q55 163 56 150 M46 182 Q59 180 59 170" />
					<path d="M354 126 L354 196 M354 126 L340 194 M354 126 L342 152 M354 146 Q348 145 348 140 M354 164 Q345 163 344 150 M354 182 Q341 180 341 170" />
				</g>
			)}
			{txt(200, 77, '$', {fs: 26, f: s})}
			{txt(200, 121, 'BANK', {fs: 20, ls: 8, f: s})}
		</svg>
	);
};

/** Phone running a generic savings app. viewBox 230×410. `grow` 0..1 draws the chart. */
export const PhoneSavings: React.FC<{w: number; balance: string; apy: string; earned?: string; grow?: number; dark?: boolean; style?: React.CSSProperties}> = ({
	w,
	balance,
	apy,
	earned,
	grow = 1,
	dark,
	style,
}) => {
	const frame = dark ? '#F5F2EA' : INK;
	const len = 220;
	return (
		<svg width={w} height={(w * 410) / 230} viewBox="0 0 230 410" style={{display: 'block', overflow: 'visible', ...style}}>
			<ellipse cx={115} cy={414} rx={100} ry={8} fill="rgba(0,0,0,.16)" />
			<rect x={6} y={6} width={218} height={404} rx={38} fill={frame} />
			<rect x={20} y={22} width={190} height={372} rx={26} fill="#FFFDF8" />
			<rect x={88} y={32} width={54} height={12} rx={6} fill={frame} />
			{txt(38, 84, 'HIGH-YIELD SAVINGS', {a: 'start', fs: 13, w: 800, f: '#857D6E', ls: 1})}
			{txt(38, 126, balance, {a: 'start', fs: 40})}
			<rect x={38} y={142} width={118} height={30} rx={15} fill="#D7F0E1" />
			{txt(97, 163, apy, {fs: 16, w: 800, f: '#13703C'})}
			<path d="M38 318 L38 292 C80 286 104 266 130 252 S176 222 192 196 L192 318 Z" fill="rgba(30,158,87,.16)" opacity={grow} />
			<path
				d="M38 292 C80 286 104 266 130 252 S176 222 192 196"
				fill="none"
				stroke="#1E9E57"
				strokeWidth={6}
				strokeLinecap="round"
				strokeDasharray={len}
				strokeDashoffset={len * (1 - grow)}
			/>
			{grow > 0.98 && <circle cx={192} cy={196} r={8} fill="#1E9E57" stroke="#FFFDF8" strokeWidth={3} />}
			<line x1={38} y1={318} x2={192} y2={318} stroke="#E0D8C7" strokeWidth={3} />
			{earned && (
				<>
					<rect x={38} y={336} width={154} height={40} rx={20} fill="#1E9E57" />
					{txt(115, 362, earned, {fs: 17, w: 800, f: '#FFFDF8'})}
				</>
			)}
		</svg>
	);
};

/** Bank vault door. viewBox 360×350. `spin` rotates the handle (degrees). */
export const Vault: React.FC<{w: number; spin?: number; style?: React.CSSProperties}> = ({w, spin = 0, style}) => {
	const bolts = Array.from({length: 12}).map((_, k) => {
		const a = (k * 30 * Math.PI) / 180;
		return <circle key={k} cx={180 + 122 * Math.cos(a)} cy={180 + 122 * Math.sin(a)} r={7} fill="#B9AF9C" stroke={INK} strokeWidth={3} />;
	});
	return (
		<svg width={w} height={(w * 350) / 360} viewBox="0 0 360 350" style={{display: 'block', overflow: 'visible', ...style}}>
			<ellipse cx={180} cy={356} rx={170} ry={9} fill="rgba(0,0,0,.14)" />
			<rect x={14} y={10} width={332} height={340} rx={34} fill="#D8D0BF" stroke={INK} strokeWidth={7} />
			<rect x={0} y={86} width={28} height={56} rx={7} fill="#B9AF9C" stroke={INK} strokeWidth={5} />
			<rect x={0} y={218} width={28} height={56} rx={7} fill="#B9AF9C" stroke={INK} strokeWidth={5} />
			<circle cx={180} cy={180} r={142} fill="#ECE5D6" stroke={INK} strokeWidth={7} />
			{bolts}
			<circle cx={180} cy={180} r={100} fill="#F7F2E8" stroke={INK} strokeWidth={5} />
			<g transform={`rotate(${spin} 180 180)`}>
				{[90, 210, 330].map((deg) => {
					const a = (deg * Math.PI) / 180;
					const x = 180 + 66 * Math.cos(a);
					const y = 180 + 66 * Math.sin(a);
					return (
						<g key={deg}>
							<line x1={180} y1={180} x2={x} y2={y} stroke={INK} strokeWidth={14} strokeLinecap="round" />
							<circle cx={x} cy={y} r={13} fill="#E2A72E" stroke={INK} strokeWidth={5} />
						</g>
					);
				})}
			</g>
			<circle cx={180} cy={180} r={28} fill="#E2A72E" stroke={INK} strokeWidth={6} />
		</svg>
	);
};

/** Green protection shield with a check. viewBox 250×290. */
export const Shield: React.FC<{w: number; check?: number; style?: React.CSSProperties}> = ({w, check = 1, style}) => (
	<svg width={w} height={(w * 290) / 250} viewBox="0 0 250 290" style={{display: 'block', overflow: 'visible', ...style}}>
		<path d="M125 12 L228 50 V140 C228 210 182 256 125 278 C68 256 22 210 22 140 V50 Z" fill="#1E9E57" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
		<path d="M125 40 L202 68 V140 C202 194 168 230 125 248 C82 230 48 194 48 140 V68 Z" fill="#13703C" />
		<path d="M80 148 L112 180 L172 112" fill="none" stroke="#FFFDF8" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={170} strokeDashoffset={170 * (1 - check)} />
	</svg>
);

/** Pack of gum with a price tag. viewBox 220×120. */
export const GumPack: React.FC<{w: number; price: string; style?: React.CSSProperties}> = ({w, price, style}) => (
	<svg width={w} height={(w * 120) / 220} viewBox="0 0 220 120" style={{display: 'block', overflow: 'visible', ...style}}>
		<g stroke={INK} strokeWidth={6} strokeLinejoin="round">
			<rect x={8} y={26} width={196} height={80} rx={14} fill="#F4B7CB" />
			<rect x={8} y={50} width={196} height={32} fill="#FFFDF8" />
		</g>
		{txt(106, 74, 'GUM', {fs: 24, ls: 6})}
		<g transform="rotate(10 178 26)">
			<rect x={136} y={4} width={86} height={40} rx={8} fill="#E2A72E" stroke={INK} strokeWidth={5} />
			{txt(179, 32, price, {fs: 21})}
		</g>
	</svg>
);

/** Bookmark / save icon. viewBox 130×160. */
export const Bookmark: React.FC<{w: number; fill: string; stroke: string; style?: React.CSSProperties}> = ({w, fill, stroke, style}) => (
	<svg width={w} height={(w * 160) / 130} viewBox="0 0 130 160" style={{display: 'block', overflow: 'visible', ...style}}>
		<path d="M14 10 H116 V150 L65 114 L14 150 Z" fill={fill} stroke={stroke} strokeWidth={10} strokeLinejoin="round" />
	</svg>
);

/** Sticker-style price/cost tag (bold ink border, offset shadow). */
export const StickerTag: React.FC<{text: string; tone: 'danger' | 'accent' | 'ink'; fontSize?: number; rot?: number; dark?: boolean; style?: React.CSSProperties}> = ({
	text,
	tone,
	fontSize = 40,
	rot = 0,
	dark,
	style,
}) => {
	const bg = tone === 'danger' ? '#FBE1DB' : tone === 'accent' ? '#D7F0E1' : '#FFFDF8';
	const fg = tone === 'danger' ? '#D9472F' : tone === 'accent' ? '#13703C' : INK;
	const edge = dark ? '#F5F2EA' : INK;
	return (
		<div
			style={{
				position: 'absolute',
				fontFamily: 'Inter',
				fontWeight: 900,
				fontSize,
				color: fg,
				background: bg,
				border: `${Math.max(4, fontSize * 0.12)}px solid ${edge}`,
				borderRadius: fontSize * 0.35,
				padding: `${fontSize * 0.18}px ${fontSize * 0.4}px`,
				boxShadow: `${fontSize * 0.12}px ${fontSize * 0.12}px 0 ${edge}`,
				whiteSpace: 'nowrap',
				transform: `rotate(${rot}deg)`,
				...style,
			}}
		>
			{text}
		</div>
	);
};
