import React from 'react';
import {C, FONT} from '../theme';

/** Illustrative account / expense cards (HTML). Not bank UI; no fabricated transactions. */

const base: React.CSSProperties = {fontFamily: FONT, position: 'absolute', boxSizing: 'border-box'};

export const FundCard: React.FC<{
	style?: React.CSSProperties;
	w?: number;
	balance?: string | null;
	meter?: number;
	glow?: number;
	sub?: string;
}> = ({style, w = 560, balance = null, meter = 0, glow = 0, sub = 'SAVINGS'}) => {
	const h = w * 0.62;
	const k = w / 560;
	return (
		<div
			style={{
				...base,
				width: w,
				height: h,
				borderRadius: 34 * k,
				padding: `${34 * k}px ${38 * k}px`,
				background: 'linear-gradient(150deg, #173726 0%, #0F2219 55%, #0B1611 100%)',
				border: `${2 * k}px solid rgba(57,255,136,${0.35 + 0.4 * glow})`,
				boxShadow: `0 ${30 * k}px ${80 * k}px rgba(0,0,0,0.55), 0 0 ${90 * k * glow}px rgba(57,255,136,${0.35 * glow})`,
				overflow: 'hidden',
				...style,
			}}
		>
			<div style={{position: 'absolute', right: -60 * k, top: -80 * k, width: 300 * k, height: 300 * k, borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,136,0.18), transparent 70%)'}} />
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14 * k}}>
					<svg width={44 * k} height={44 * k} viewBox="0 0 44 44">
						<rect width={44} height={44} rx={12} fill={C.green} />
						<path d="M 22 9 L 33 13 L 33 22 Q 33 31 22 36 Q 11 31 11 22 L 11 13 Z" fill="none" stroke={C.bg} strokeWidth={3.4} strokeLinejoin="round" />
						<path d="M 17 22 L 21 26 L 28 18" fill="none" stroke={C.bg} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<div style={{fontWeight: 900, fontSize: 30 * k, color: C.white, letterSpacing: 1.5 * k, whiteSpace: 'nowrap'}}>EMERGENCY FUND</div>
				</div>
				<div style={{fontWeight: 800, fontSize: 17 * k, color: C.green, letterSpacing: 2 * k, padding: `${6 * k}px ${12 * k}px`, border: `${1.5 * k}px solid rgba(57,255,136,0.5)`, borderRadius: 999}}>
					{sub}
				</div>
			</div>
			<div style={{marginTop: 30 * k, height: 104 * k, display: 'flex', alignItems: 'flex-end'}}>
				{balance !== null ? (
					<div style={{fontWeight: 900, fontSize: 100 * k, lineHeight: 1, color: C.white, letterSpacing: -3 * k, fontVariantNumeric: 'tabular-nums'}}>{balance}</div>
				) : (
					<div style={{display: 'flex', gap: 12 * k}}>
						{[150, 90].map((bw, i) => (
							<div key={i} style={{width: bw * k, height: 22 * k, borderRadius: 11 * k, background: 'rgba(245,247,245,0.14)'}} />
						))}
					</div>
				)}
			</div>
			<div style={{marginTop: 30 * k}}>
				<div style={{fontWeight: 700, fontSize: 17 * k, color: C.gray, letterSpacing: 2 * k, marginBottom: 12 * k}}>BUFFER</div>
				<div style={{height: 18 * k, borderRadius: 9 * k, background: 'rgba(245,247,245,0.1)', overflow: 'hidden'}}>
					<div style={{height: '100%', width: `${meter * 100}%`, borderRadius: 9 * k, background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`, boxShadow: `0 0 ${20 * k}px rgba(57,255,136,0.6)`}} />
				</div>
			</div>
		</div>
	);
};

export const ExpenseCard: React.FC<{style?: React.CSSProperties; w?: number; title?: string; sub?: string; icon?: React.ReactNode; tone?: string}> = ({
	style,
	w = 420,
	title = 'UNEXPECTED EXPENSE',
	sub,
	icon,
	tone = C.red,
}) => {
	const k = w / 420;
	return (
		<div
			style={{
				...base,
				width: w,
				borderRadius: 28 * k,
				padding: `${26 * k}px ${28 * k}px`,
				background: 'linear-gradient(160deg, #2A1415 0%, #1A0F10 100%)',
				border: `${2 * k}px solid ${tone}`,
				boxShadow: `0 ${24 * k}px ${60 * k}px rgba(0,0,0,0.6), 0 0 ${50 * k}px rgba(255,85,85,0.18)`,
				display: 'flex',
				alignItems: 'center',
				gap: 20 * k,
				...style,
			}}
		>
			<div style={{flex: 'none', width: 74 * k, height: 74 * k, borderRadius: 20 * k, background: 'rgba(255,85,85,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				{icon ?? (
					<svg width={46 * k} height={46 * k} viewBox="-50 -50 100 100">
						<path d="M 0 -38 L 40 32 L -40 32 Z" fill={tone} stroke={tone} strokeWidth={10} strokeLinejoin="round" />
						<rect x={-4.5} y={-16} width={9} height={30} rx={4.5} fill={C.bg} />
						<circle cx={0} cy={23} r={5.5} fill={C.bg} />
					</svg>
				)}
			</div>
			<div>
				<div style={{fontWeight: 900, fontSize: 29 * k, color: C.white, letterSpacing: 0.5 * k, lineHeight: 1.1}}>{title}</div>
				{sub ? <div style={{fontWeight: 600, fontSize: 21 * k, color: '#E9A3A3', marginTop: 6 * k}}>{sub}</div> : null}
			</div>
		</div>
	);
};

export const CreditCard: React.FC<{style?: React.CSSProperties; w?: number; dim?: number}> = ({style, w = 400, dim = 0}) => {
	const k = w / 400;
	return (
		<div
			style={{
				...base,
				width: w,
				height: w * 0.63,
				borderRadius: 24 * k,
				padding: `${26 * k}px ${30 * k}px`,
				background: 'linear-gradient(135deg, #3A4146 0%, #23282B 50%, #181C1E 100%)',
				border: `${1.5 * k}px solid #4B5357`,
				boxShadow: `0 ${20 * k}px ${50 * k}px rgba(0,0,0,0.6)`,
				filter: `saturate(${1 - dim}) brightness(${1 - dim * 0.45})`,
				...style,
			}}
		>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontWeight: 800, fontSize: 20 * k, letterSpacing: 2.5 * k, color: '#C9D0D3'}}>CREDIT CARD</div>
				<svg width={30 * k} height={30 * k} viewBox="0 0 30 30">
					{[6, 11, 16].map((r) => (
						<path key={r} d={`M ${8 + r * 0.4} ${15 - r * 0.7} A ${r} ${r} 0 0 1 ${8 + r * 0.4} ${15 + r * 0.7}`} stroke="#C9D0D3" strokeWidth={2.4} fill="none" strokeLinecap="round" />
					))}
				</svg>
			</div>
			<div style={{marginTop: 26 * k, width: 58 * k, height: 44 * k, borderRadius: 8 * k, background: 'linear-gradient(135deg, #D8C089, #A88D52)', position: 'relative'}}>
				<div style={{position: 'absolute', left: '33%', top: 0, bottom: 0, borderLeft: `${1.5 * k}px solid rgba(0,0,0,0.3)`}} />
				<div style={{position: 'absolute', top: '50%', left: 0, right: 0, borderTop: `${1.5 * k}px solid rgba(0,0,0,0.3)`}} />
			</div>
			<div style={{marginTop: 24 * k, fontWeight: 700, fontSize: 26 * k, letterSpacing: 5 * k, color: '#9DA6AA'}}>•••• •••• •••• ••••</div>
		</div>
	);
};

export const PlanCard: React.FC<{style?: React.CSSProperties; title: string; icon: React.ReactNode; checked?: number; w?: number; paper?: boolean}> = ({
	style,
	title,
	icon,
	checked = 0,
	w = 540,
	paper = false,
}) => (
	<div
		style={{
			...base,
			width: w,
			height: 150,
			borderRadius: paper ? 6 : 26,
			padding: '0 30px',
			background: paper ? 'linear-gradient(170deg, #FBF8F1 0%, #EDE8DC 100%)' : 'linear-gradient(160deg, #1B2220 0%, #141A18 100%)',
			border: paper ? '1px solid #D6D0C2' : '2px solid #2B3431',
			boxShadow: '0 22px 50px rgba(0,0,0,0.55)',
			display: 'flex',
			alignItems: 'center',
			gap: 24,
			...style,
		}}
	>
		<div style={{flex: 'none', width: 84, height: 84, borderRadius: 22, background: paper ? '#16241D' : 'rgba(57,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
		<div style={{flex: 1}}>
			<div style={{fontWeight: 900, fontSize: 32, color: paper ? '#1A1E1C' : C.white, letterSpacing: 0.5, whiteSpace: 'nowrap'}}>{title}</div>
			<div style={{display: 'flex', gap: 10, marginTop: 14}}>
				<div style={{width: 150, height: 10, borderRadius: 5, background: paper ? '#CFC9BC' : 'rgba(245,247,245,0.14)'}} />
				<div style={{width: 80, height: 10, borderRadius: 5, background: paper ? '#DDD8CC' : 'rgba(245,247,245,0.1)'}} />
			</div>
		</div>
		<svg width={52} height={52} viewBox="-26 -26 52 52" style={{opacity: checked > 0 ? 1 : 0.25}}>
			<circle r={24} fill={checked > 0 ? C.green : 'none'} stroke={checked > 0 ? C.green : '#3A4441'} strokeWidth={3} transform={`scale(${0.6 + 0.4 * Math.min(1, checked)})`} />
			<path d="M -10 0 L -3 7 L 11 -8" stroke={C.bg} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34} strokeDashoffset={34 * (1 - Math.min(1, checked))} />
		</svg>
	</div>
);
