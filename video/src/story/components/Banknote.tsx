import React from 'react';

/**
 * Premium generic banknote (original artwork, NOT real currency art):
 * paper texture, guilloche lines, security ribbon, corner numerals.
 * `w` sets the width (height = w * 0.43). `shine` 0..1 sweeps a light band.
 * `slice` [from, to] (fractions of the width) shows only that vertical strip,
 * positioned at its own left edge — use three slices to split one note.
 */
export const BANKNOTE_RATIO = 0.43;

export const Banknote: React.FC<{
	w: number;
	value?: string;
	label?: string;
	shine?: number;
	slice?: [number, number];
	style?: React.CSSProperties;
	shadow?: number;
}> = ({w, value = '100', label = 'ONE HUNDRED', shine = -1, slice, style, shadow = 1}) => {
	const h = w * BANKNOTE_RATIO;
	const [a, b] = slice ?? [0, 1];
	const id = React.useId().replace(/:/g, '');
	const waves = Array.from({length: 16}, (_, i) => {
		const y0 = 60 + i * 20;
		let d = `M 30 ${y0}`;
		for (let x = 30; x <= 970; x += 20) d += ` L ${x} ${(y0 + Math.sin(x / 38 + i * 0.7) * 9 + Math.sin(x / 13 + i) * 2.5).toFixed(1)}`;
		return d;
	});
	return (
		<div style={{position: 'absolute', width: w * (b - a), height: h, overflow: 'hidden', borderRadius: a === 0 || b === 1 ? 14 : 2, ...style}}>
			<div style={{position: 'absolute', left: -w * a, top: 0, width: w, height: h, filter: shadow ? `drop-shadow(0 ${18 * shadow}px ${26 * shadow}px rgba(0,0,0,0.45))` : undefined}}>
				<svg width={w} height={h} viewBox="0 0 1000 430" style={{display: 'block'}}>
					<defs>
						<linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1">
							<stop offset="0" stopColor="#EEF1E6" />
							<stop offset="0.55" stopColor="#DCE5D5" />
							<stop offset="1" stopColor="#CFDBC8" />
						</linearGradient>
						<radialGradient id={`o${id}`} cx="0.5" cy="0.45" r="0.6">
							<stop offset="0" stopColor="#F7F8F1" />
							<stop offset="1" stopColor="#C9D6C2" />
						</radialGradient>
						<filter id={`n${id}`}>
							<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
							<feColorMatrix type="saturate" values="0" />
							<feComponentTransfer>
								<feFuncA type="linear" slope="0.22" />
							</feComponentTransfer>
						</filter>
						<linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
							<stop offset="0" stopColor="#fff" stopOpacity="0" />
							<stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
							<stop offset="1" stopColor="#fff" stopOpacity="0" />
						</linearGradient>
						<clipPath id={`c${id}`}>
							<rect x={0} y={0} width={1000} height={430} rx={18} />
						</clipPath>
					</defs>
					<g clipPath={`url(#c${id})`}>
						<rect x={0} y={0} width={1000} height={430} fill={`url(#p${id})`} />
						{waves.map((d, i) => (
							<path key={i} d={d} fill="none" stroke="rgba(46,96,66,0.22)" strokeWidth={1.3} />
						))}
						<rect x={18} y={18} width={964} height={394} rx={10} fill="none" stroke="#3E6B4E" strokeWidth={4} />
						<rect x={32} y={32} width={936} height={366} rx={6} fill="none" stroke="#3E6B4E" strokeWidth={1.5} strokeDasharray="3 5" />
						{/* portrait oval with emblem */}
						<ellipse cx={330} cy={215} rx={128} ry={156} fill={`url(#o${id})`} stroke="#3E6B4E" strokeWidth={4} />
						<ellipse cx={330} cy={215} rx={114} ry={142} fill="none" stroke="rgba(62,107,78,0.5)" strokeWidth={2} strokeDasharray="2 4" />
						<text x={330} y={282} textAnchor="middle" fontSize={190} fontWeight={900} fill="#2E5E43" fontFamily="Inter" opacity={0.9}>
							$
						</text>
						{/* security ribbon */}
						<rect x={548} y={0} width={30} height={430} fill="rgba(52,104,160,0.55)" />
						{Array.from({length: 9}).map((_, i) => (
							<text key={i} x={563} y={30 + i * 50} textAnchor="middle" fontSize={16} fontWeight={900} fill="rgba(255,255,255,0.75)" fontFamily="Inter">
								{value}
							</text>
						))}
						{/* seal */}
						<circle cx={700} cy={140} r={50} fill="none" stroke="#2E7A4C" strokeWidth={5} />
						<circle cx={700} cy={140} r={38} fill="none" stroke="#2E7A4C" strokeWidth={2} strokeDasharray="4 4" />
						<text x={700} y={156} textAnchor="middle" fontSize={44} fontWeight={900} fill="#2E7A4C" fontFamily="Inter">
							$
						</text>
						{/* numerals */}
						<text x={62} y={102} fontSize={72} fontWeight={900} fill="#2E5E43" fontFamily="Inter" letterSpacing={-2}>
							{value}
						</text>
						<text x={62} y={392} fontSize={44} fontWeight={900} fill="#2E5E43" fontFamily="Inter" opacity={0.85}>
							{value}
						</text>
						<text x={950} y={102} textAnchor="end" fontSize={44} fontWeight={900} fill="#2E5E43" fontFamily="Inter" opacity={0.85}>
							{value}
						</text>
						<text x={950} y={380} textAnchor="end" fontSize={168} fontWeight={900} fill="#2E5E43" fontFamily="Inter" letterSpacing={-6}>
							{value}
						</text>
						<text x={760} y={232} textAnchor="middle" fontSize={30} fontWeight={800} fill="#2E5E43" fontFamily="Inter" letterSpacing={8}>
							{label}
						</text>
						<rect x={0} y={0} width={1000} height={430} filter={`url(#n${id})`} opacity={0.6} />
						{shine >= 0 && shine <= 1 && <rect x={-400 + shine * 1600} y={-100} width={260} height={700} fill={`url(#s${id})`} transform={`rotate(18 ${-270 + shine * 1600} 215)`} />}
					</g>
				</svg>
			</div>
		</div>
	);
};
