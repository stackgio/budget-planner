import React from 'react';

/**
 * Side-view sedan facing left. Local space: x 0..760, ground at y = 0.
 * Front wheel centre (170, -62), rear (590, -62).
 * `flat` 0..1 deflates the front tyre: the rubber squashes against the road and the nose dips.
 */
export const FRONT_WHEEL = {x: 170, y: -62};
export const REAR_WHEEL = {x: 590, y: -62};
const R = 62;

const tyrePath = (cx: number, cy: number, flat: number) => {
	const pts: string[] = [];
	const drop = flat * 20;
	const c = cy + drop;
	for (let i = 0; i <= 64; i++) {
		const a = (i / 64) * Math.PI * 2;
		let x = cx + Math.cos(a) * R;
		let y = c + Math.sin(a) * R;
		if (y > -1) {
			// squash onto the road and bulge sideways
			const over = y + 1;
			y = -1 + over * 0.08;
			x = cx + (x - cx) * (1 + 0.32 * flat);
		} else if (y > c + R * 0.35) {
			const k = (y - (c + R * 0.35)) / (R * 0.65);
			x = cx + (x - cx) * (1 + 0.22 * flat * k);
		}
		pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
	}
	return pts.join(' ') + ' Z';
};

const Wheel: React.FC<{cx: number; cy: number; flat?: number; spin?: number; id: string}> = ({cx, cy, flat = 0, spin = 0, id}) => {
	const c = cy + flat * 20;
	return (
		<g>
			<path d={tyrePath(cx, cy, flat)} fill="#151717" stroke="#2C3030" strokeWidth={3} />
			<circle cx={cx} cy={c} r={R - 9} fill="none" stroke="#232727" strokeWidth={4} />
			<g transform={`rotate(${spin} ${cx} ${c})`}>
				<circle cx={cx} cy={c} r={39} fill={`url(#rim-${id})`} />
				{[0, 72, 144, 216, 288].map((a) => (
					<path
						key={a}
						d={`M ${cx - 6} ${c - 8} L ${cx - 9} ${c - 34} L ${cx + 9} ${c - 34} L ${cx + 6} ${c - 8} Z`}
						fill="#2A2F33"
						opacity={0.85}
						transform={`rotate(${a} ${cx} ${c})`}
					/>
				))}
				<circle cx={cx} cy={c} r={11} fill="#C9D0D4" stroke="#6C757B" strokeWidth={2} />
				{[0, 72, 144, 216, 288].map((a) => (
					<circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * 6} cy={c + Math.sin((a * Math.PI) / 180) * 6} r={1.6} fill="#555" />
				))}
			</g>
			<circle cx={cx} cy={c} r={39} fill="none" stroke="#E6EBEE" strokeWidth={2} opacity={0.6} />
		</g>
	);
};

export const Car: React.FC<{flat?: number; color?: [string, string]; id?: string; headlight?: number; showWheels?: boolean}> = ({
	flat = 0,
	color = ['#5A82BE', '#1C2F52'],
	id = 'a',
	headlight = 1,
	showWheels = true,
}) => {
	const dip = -3.2 * flat;
	return (
		<g>
			<defs>
				<linearGradient id={`body-${id}`} x1="0" y1="-240" x2="0" y2="-40" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={color[0]} />
					<stop offset="0.45" stopColor={color[0]} />
					<stop offset="0.5" stopColor={color[1]} />
					<stop offset="1" stopColor="#0F1A2E" />
				</linearGradient>
				<linearGradient id={`glass-${id}`} x1="0" y1="-235" x2="0" y2="-160" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor="#A9C6E6" />
					<stop offset="1" stopColor="#2B4366" />
				</linearGradient>
				<radialGradient id={`rim-${id}`}>
					<stop offset="0" stopColor="#E9EEF1" />
					<stop offset="0.7" stopColor="#AAB3B9" />
					<stop offset="1" stopColor="#6E777D" />
				</radialGradient>
				<radialGradient id={`hl-${id}`}>
					<stop offset="0" stopColor="#FFF6D8" stopOpacity={0.9} />
					<stop offset="1" stopColor="#FFF6D8" stopOpacity={0} />
				</radialGradient>
			</defs>
			{/* ground shadow */}
			<ellipse cx={380} cy={2} rx={390} ry={14} fill="#000" opacity={0.6} />
			<g transform={`rotate(${dip} ${REAR_WHEEL.x} ${REAR_WHEEL.y})`}>
				{/* wheel wells */}
				<circle cx={170} cy={-62} r={70} fill="#070909" />
				<circle cx={590} cy={-62} r={70} fill="#070909" />
				{/* body */}
				<path
					d="M 30 -62 L 30 -102 Q 32 -130 72 -138 L 250 -152 Q 298 -160 326 -212 Q 342 -238 382 -240 L 538 -240 Q 578 -238 608 -206 L 652 -162 Q 732 -156 738 -122 L 738 -72 Q 736 -50 714 -48 L 666 -48 A 76 76 0 0 0 514 -48 L 246 -48 A 76 76 0 0 0 94 -48 L 52 -48 Q 30 -50 30 -62 Z"
					fill={`url(#body-${id})`}
				/>
				{/* shoulder highlight + crease */}
				<path d="M 76 -134 L 252 -148 Q 300 -156 330 -206" stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />
				<path d="M 40 -104 L 736 -112" stroke="rgba(0,0,0,0.35)" strokeWidth={2} />
				<path d="M 42 -100 L 736 -108" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
				{/* glass */}
				<path d="M 322 -162 Q 336 -204 352 -220 Q 366 -232 388 -232 L 456 -232 L 456 -162 Z" fill={`url(#glass-${id})`} />
				<path d="M 470 -232 L 532 -232 Q 568 -230 596 -198 L 626 -162 L 470 -162 Z" fill={`url(#glass-${id})`} />
				<path d="M 360 -224 L 420 -224 L 380 -166 L 340 -166 Z" fill="rgba(255,255,255,0.18)" />
				<path d="M 492 -228 L 520 -228 L 486 -166 L 470 -166 L 470 -200 Z" fill="rgba(255,255,255,0.12)" />
				{/* pillars & doors */}
				<rect x={456} y={-234} width={14} height={74} fill="#101826" />
				<path d="M 318 -160 L 318 -56 M 462 -160 L 462 -52 M 612 -160 L 640 -58" stroke="#0E1626" strokeWidth={3} fill="none" />
				<rect x={384} y={-146} width={34} height={8} rx={4} fill="#C9D3DE" opacity={0.85} />
				<rect x={528} y={-146} width={34} height={8} rx={4} fill="#C9D3DE" opacity={0.85} />
				{/* mirror */}
				<path d="M 318 -170 L 300 -178 Q 292 -172 298 -162 L 318 -160 Z" fill="#1B2A44" />
				{/* rocker panel */}
				<path d="M 246 -52 L 514 -52 L 510 -44 L 250 -44 Z" fill="#0C1320" />
				{/* headlight + glow */}
				<path d="M 34 -118 Q 40 -132 72 -134 L 86 -132 L 80 -114 Q 52 -110 34 -112 Z" fill="#F4F1E4" />
				{headlight > 0 ? <ellipse cx={20} cy={-120} rx={70} ry={34} fill={`url(#hl-${id})`} opacity={0.55 * headlight} /> : null}
				{/* taillight */}
				<path d="M 724 -142 Q 738 -136 738 -118 L 724 -116 Z" fill="#E0413F" />
				{/* bumpers */}
				<path d="M 28 -92 L 28 -64 Q 30 -50 50 -50 L 92 -50 L 96 -72 L 30 -78 Z" fill="#11161F" opacity={0.85} />
				<path d="M 668 -50 L 714 -50 Q 738 -52 740 -78 L 740 -88 L 672 -80 Z" fill="#11161F" opacity={0.85} />
				<rect x={34} y={-88} width={30} height={6} rx={3} fill="#2E3A4E" />
			</g>
			{showWheels ? (
				<>
					<Wheel cx={590} cy={-62} id={id} />
					<Wheel cx={170} cy={-62} flat={flat} id={id} />
				</>
			) : null}
		</g>
	);
};
