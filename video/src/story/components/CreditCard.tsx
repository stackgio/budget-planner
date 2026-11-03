import React from 'react';

export type CardVariant = 'debt' | 'offer' | 'green';

const LOOKS: Record<CardVariant, {bg: string; fg: string; sub: string}> = {
	debt: {bg: 'linear-gradient(135deg,#25282E 0%,#121316 60%,#1C1F24 100%)', fg: '#F5F2EA', sub: '#8B9099'},
	offer: {bg: 'linear-gradient(135deg,#F4D27A 0%,#E2A72E 45%,#B97F12 100%)', fg: '#2A1D05', sub: '#6B4E12'},
	green: {bg: 'linear-gradient(135deg,#2CD47A 0%,#1E9E57 55%,#13703C 100%)', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.75)'},
};

/**
 * Generic credit card (no real issuer branding). 3D tilt via rotateX/rotateY,
 * `shine` 0..1 sweeps a specular highlight across, `balance` shows a live label.
 */
export const CreditCard: React.FC<{
	w?: number;
	variant?: CardVariant;
	holder?: string;
	last4?: string;
	issuer?: string;
	balanceLabel?: string;
	balance?: React.ReactNode;
	rotX?: number;
	rotY?: number;
	rot?: number;
	shine?: number;
	badge?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({w = 520, variant = 'debt', holder = 'MARCUS', last4 = '4821', issuer = 'CREDIT', balanceLabel, balance, rotX = 0, rotY = 0, rot = 0, shine = -1, badge, style}) => {
	const h = w * 0.63;
	const look = LOOKS[variant];
	const u = w / 520;
	return (
		<div style={{position: 'absolute', width: w, height: h, perspective: 1600, ...style}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 30 * u,
					background: look.bg,
					transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotate(${rot}deg)`,
					boxShadow: `0 ${30 * u}px ${60 * u}px rgba(0,0,0,0.28), 0 ${6 * u}px ${12 * u}px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)`,
					overflow: 'hidden',
					fontFamily: 'Inter',
					color: look.fg,
				}}
			>
				{/* subtle guilloche rings */}
				<svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: 0.14}}>
					{[0, 1, 2, 3, 4].map((i) => (
						<circle key={i} cx={w * 0.92} cy={h * 0.1} r={(110 + i * 46) * u} fill="none" stroke={look.fg} strokeWidth={1.5 * u} />
					))}
				</svg>
				<div style={{position: 'absolute', left: 40 * u, top: 34 * u, fontSize: 26 * u, fontWeight: 900, letterSpacing: 4 * u}}>{issuer}</div>
				{/* chip */}
				<svg style={{position: 'absolute', left: 40 * u, top: 96 * u}} width={74 * u} height={56 * u} viewBox="0 0 74 56">
					<rect width={74} height={56} rx={10} fill="#D9B45A" />
					<path d="M0,19H24M0,37H24M50,19H74M50,37H74M24,0V56M50,0V56" stroke="#9C7A2A" strokeWidth={2.5} />
				</svg>
				{balance !== undefined ? (
					<div style={{position: 'absolute', left: 40 * u, right: 36 * u, top: 168 * u}}>
						<div style={{fontSize: 20 * u, fontWeight: 800, letterSpacing: 3 * u, color: look.sub}}>{balanceLabel ?? 'BALANCE'}</div>
						<div style={{fontSize: 78 * u, fontWeight: 900, letterSpacing: -2 * u, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{balance}</div>
					</div>
				) : (
					<div style={{position: 'absolute', left: 40 * u, top: 196 * u, fontSize: 36 * u, fontWeight: 700, letterSpacing: 5 * u, fontVariantNumeric: 'tabular-nums'}}>
						•••• •••• •••• {last4}
					</div>
				)}
				<div style={{position: 'absolute', left: 40 * u, bottom: 28 * u, fontSize: 20 * u, fontWeight: 800, letterSpacing: 3 * u, color: look.sub}}>{holder}</div>
				<svg style={{position: 'absolute', right: 34 * u, bottom: 24 * u}} width={76 * u} height={46 * u} viewBox="0 0 76 46">
					<circle cx={23} cy={23} r={22} fill={look.fg} opacity={0.35} />
					<circle cx={53} cy={23} r={22} fill={look.fg} opacity={0.55} />
				</svg>
				{shine >= 0 && shine <= 1 && (
					<div
						style={{
							position: 'absolute',
							top: -h,
							bottom: -h,
							width: w * 0.35,
							left: -w * 0.5 + shine * w * 1.7,
							background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0) 100%)',
							transform: 'rotate(18deg)',
						}}
					/>
				)}
			</div>
			{badge}
		</div>
	);
};
