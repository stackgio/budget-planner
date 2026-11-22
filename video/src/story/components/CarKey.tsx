import React from 'react';

/**
 * Realistic car key (remote fob + metal blade on a split ring), pure SVG.
 * The ring centre is the pivot: (200, 92) in the 400×900 viewBox, so a swing
 * is `rot` around `transform-origin: 50% 10.2%`.
 * `shine` (0..1) slides a specular highlight across the fob.
 */
export const CarKey: React.FC<{w?: number; rot?: number; shine?: number; style?: React.CSSProperties}> = ({w = 400, rot = 0, shine = 0.3, style}) => {
	const id = React.useId().replace(/:/g, '');
	const g = (n: string) => `${n}${id}`;
	const sx = -120 + shine * 520;
	return (
		<svg
			width={w}
			height={(w * 900) / 400}
			viewBox="0 0 400 900"
			style={{overflow: 'visible', transformOrigin: '50% 10.2%', transform: `rotate(${rot}deg)`, ...style}}
		>
			<defs>
				<linearGradient id={g('ring')} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#F4F6F8" />
					<stop offset="0.35" stopColor="#9EA5AD" />
					<stop offset="0.6" stopColor="#E6E9EC" />
					<stop offset="1" stopColor="#6B727A" />
				</linearGradient>
				<linearGradient id={g('fob')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#202226" />
					<stop offset="0.18" stopColor="#34373C" />
					<stop offset="0.5" stopColor="#141518" />
					<stop offset="0.85" stopColor="#0B0C0E" />
					<stop offset="1" stopColor="#1C1E21" />
				</linearGradient>
				<linearGradient id={g('trim')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#E9ECEF" />
					<stop offset="0.5" stopColor="#7D848C" />
					<stop offset="1" stopColor="#C9CED3" />
				</linearGradient>
				<linearGradient id={g('btn')} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#2A2C30" />
					<stop offset="1" stopColor="#101113" />
				</linearGradient>
				<linearGradient id={g('blade')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#8E959C" />
					<stop offset="0.3" stopColor="#F3F5F7" />
					<stop offset="0.55" stopColor="#B8BEC4" />
					<stop offset="1" stopColor="#70777E" />
				</linearGradient>
				<linearGradient id={g('spec')} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
					<stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.22" />
					<stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
				</linearGradient>
				<clipPath id={g('fobClip')}>
					<path d="M200 128 C 300 128 348 150 352 230 L 356 470 C 358 540 300 586 200 586 C 100 586 42 540 44 470 L 48 230 C 52 150 100 128 200 128 Z" />
				</clipPath>
				<filter id={g('shadow')} x="-30%" y="-20%" width="160%" height="150%">
					<feDropShadow dx="0" dy="26" stdDeviation="22" floodColor="#000" floodOpacity="0.7" />
				</filter>
			</defs>
			<g filter={`url(#${g('shadow')})`}>
				{/* blade */}
				<path d="M176 560 L 224 560 L 226 800 L 212 846 L 200 858 L 186 846 L 174 800 Z" fill={`url(#${g('blade')})`} stroke="#5B6168" strokeWidth="2" />
				<path d="M196 600 L 196 650 Q 212 664 196 680 L 196 730 Q 214 746 198 764 L 198 822" fill="none" stroke="#5E656C" strokeWidth="7" strokeLinecap="round" />
				<path d="M190 600 L 190 820" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
				{/* blade collar */}
				<rect x="160" y="552" width="80" height="34" rx="10" fill={`url(#${g('trim')})`} stroke="#4E545A" strokeWidth="2" />
				{/* fob body */}
				<path
					d="M200 128 C 300 128 348 150 352 230 L 356 470 C 358 540 300 586 200 586 C 100 586 42 540 44 470 L 48 230 C 52 150 100 128 200 128 Z"
					fill={`url(#${g('fob')})`}
					stroke="#050506"
					strokeWidth="3"
				/>
				<path
					d="M200 146 C 290 146 332 166 335 234 L 338 466 C 340 528 288 568 200 568 C 112 568 60 528 62 466 L 65 234 C 68 166 110 146 200 146 Z"
					fill="none"
					stroke={`url(#${g('trim')})`}
					strokeWidth="5"
					opacity="0.9"
				/>
				{/* moving specular sweep + static top gloss */}
				<g clipPath={`url(#${g('fobClip')})`}>
					<rect x={sx} y="100" width="130" height="520" fill={`url(#${g('spec')})`} transform={`skewX(-18)`} />
					<ellipse cx="150" cy="190" rx="110" ry="40" fill="#FFFFFF" opacity="0.07" />
				</g>
				{/* key-ring eyelet */}
				<circle cx="200" cy="168" r="20" fill="#050506" stroke={`url(#${g('trim')})`} strokeWidth="6" />
				{/* buttons: lock, unlock, trunk */}
				{[244, 336, 428].map((y, i) => (
					<g key={y}>
						<rect x="112" y={y} width="176" height="78" rx="34" fill={`url(#${g('btn')})`} stroke="#000" strokeWidth="3" />
						<rect x="118" y={y + 4} width="164" height="20" rx="10" fill="#FFFFFF" opacity="0.05" />
						<g transform={`translate(200 ${y + 39})`} stroke="#C9CDD2" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
							{i === 0 && (
								<>
									<rect x="-16" y="-4" width="32" height="24" rx="4" fill="#C9CDD2" stroke="none" />
									<path d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-4" />
								</>
							)}
							{i === 1 && (
								<>
									<rect x="-16" y="-4" width="32" height="24" rx="4" fill="#C9CDD2" stroke="none" />
									<path d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-16" transform="translate(-2 0)" />
								</>
							)}
							{i === 2 && (
								<>
									<path d="M-34 14 L-30 -6 Q-28 -14 -18 -16 L18 -16 Q28 -14 30 -6 L34 14 Z" />
									<path d="M-22 -16 L-22 -24 L22 -24 L22 -16" />
								</>
							)}
						</g>
					</g>
				))}
				{/* split ring through the eyelet */}
				<circle cx="200" cy="92" r="72" fill="none" stroke="#3B4046" strokeWidth="14" />
				<circle cx="200" cy="92" r="72" fill="none" stroke={`url(#${g('ring')})`} strokeWidth="10" />
				<path d="M150 40 A72 72 0 0 1 256 46" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" />
				<path d="M262 128 A74 74 0 0 1 238 152" fill="none" stroke={`url(#${g('ring')})`} strokeWidth="10" transform="translate(4 -4)" />
			</g>
		</svg>
	);
};
