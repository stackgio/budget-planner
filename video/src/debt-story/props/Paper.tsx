import React from 'react';
import {C, FONT} from '../theme';

/** Paper props, centred on (0,0), drawn in SVG. No amounts — none were supplied. */

const lines = (x: number, y0: number, n: number, w: number, gap = 18, color = '#BDB7A8') =>
	Array.from({length: n}, (_, i) => (
		<rect key={i} x={x} y={y0 + i * gap} width={w * (i % 3 === 2 ? 0.62 : i % 2 ? 0.86 : 1)} height={7} rx={3.5} fill={color} />
	));

export const Envelope: React.FC<{w?: number; label?: string; tag?: string}> = ({w = 260, label = 'BILL', tag}) => {
	const h = w * 0.58;
	return (
		<g>
			<rect x={-w / 2 + 4} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.35} />
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={C.paper} />
			<path d={`M ${-w / 2} ${-h / 2} L 0 ${h * 0.08} L ${w / 2} ${-h / 2}`} fill="none" stroke={C.paperShade} strokeWidth={3} />
			<rect x={w / 2 - 56} y={-h / 2 + 14} width={40} height={30} rx={3} fill="none" stroke="#C9C3B4" strokeWidth={2.5} />
			<rect x={-w / 2 + 22} y={h / 2 - 50} width={w * 0.42} height={7} rx={3.5} fill="#B9B4A7" />
			<rect x={-w / 2 + 22} y={h / 2 - 34} width={w * 0.3} height={7} rx={3.5} fill="#B9B4A7" />
			<g transform={`translate(${w / 2 - 70} ${h / 2 - 34}) rotate(-8)`}>
				<rect x={-48} y={-18} width={96} height={34} rx={4} fill="none" stroke={C.red} strokeWidth={3.5} />
				<text x={0} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={C.red} letterSpacing={1}>
					{label}
				</text>
			</g>
			{tag ? (
				<text x={-w / 2 + 22} y={-h / 2 + 34} fontFamily={FONT} fontWeight={800} fontSize={16} fill="#8E897E" letterSpacing={1.5}>
					{tag}
				</text>
			) : null}
		</g>
	);
};

export const Doc: React.FC<{w?: number; title?: string; stamp?: string; accent?: string}> = ({w = 230, title = 'INVOICE', stamp, accent = C.red}) => {
	const h = w * 1.3;
	return (
		<g>
			<rect x={-w / 2 + 5} y={-h / 2 + 9} width={w} height={h} rx={5} fill="#000" opacity={0.35} />
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill="#FBFAF6" />
			<rect x={-w / 2} y={-h / 2} width={w} height={10} rx={4} fill={accent} />
			<text x={-w / 2 + 18} y={-h / 2 + 46} fontFamily={FONT} fontWeight={900} fontSize={w * 0.1} fill="#22262A" letterSpacing={0.5}>
				{title}
			</text>
			{lines(-w / 2 + 18, -h / 2 + 66, 2, w * 0.45, 14, '#CFCAC0')}
			<line x1={-w / 2 + 18} x2={w / 2 - 18} y1={-h / 2 + 104} y2={-h / 2 + 104} stroke="#E2DED5" strokeWidth={2} />
			{Array.from({length: 4}, (_, i) => (
				<g key={i}>
					<rect x={-w / 2 + 18} y={-h / 2 + 120 + i * 24} width={w * 0.46} height={8} rx={4} fill="#C7C2B7" />
					<rect x={w / 2 - 18 - w * 0.2} y={-h / 2 + 120 + i * 24} width={w * 0.2} height={8} rx={4} fill="#C7C2B7" />
				</g>
			))}
			<line x1={-w / 2 + 18} x2={w / 2 - 18} y1={h / 2 - 52} y2={h / 2 - 52} stroke="#E2DED5" strokeWidth={2} />
			<rect x={-w / 2 + 18} y={h / 2 - 38} width={w * 0.24} height={10} rx={5} fill="#8E897E" />
			<rect x={w / 2 - 18 - w * 0.3} y={h / 2 - 40} width={w * 0.3} height={14} rx={6} fill="#5E5A52" />
			{stamp ? (
				<g transform={`translate(${w * 0.06} ${h * 0.06}) rotate(-14)`} opacity={0.9}>
					<rect x={-w * 0.36} y={-22} width={w * 0.72} height={44} rx={5} fill="none" stroke={accent} strokeWidth={4} />
					<text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.11} fill={accent} letterSpacing={1.5}>
						{stamp}
					</text>
				</g>
			) : null}
		</g>
	);
};

/** Push-notification banner (generic, no app branding). */
export const Notif: React.FC<{w?: number; title?: string; body?: string}> = ({w = 420, title = 'Payment due', body = 'A new bill is ready to view'}) => {
	const h = 104;
	return (
		<g>
			<rect x={-w / 2 + 4} y={-h / 2 + 8} width={w} height={h} rx={26} fill="#000" opacity={0.4} />
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#22282A" stroke="#343C3E" strokeWidth={2} />
			<rect x={-w / 2 + 18} y={-26} width={52} height={52} rx={13} fill={C.red} />
			<path d={`M ${-w / 2 + 44} -14 L ${-w / 2 + 44} 4`} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
			<circle cx={-w / 2 + 44} cy={14} r={3.5} fill={C.white} />
			<text x={-w / 2 + 88} y={-6} fontFamily={FONT} fontWeight={800} fontSize={25} fill={C.white}>
				{title}
			</text>
			<text x={-w / 2 + 88} y={24} fontFamily={FONT} fontWeight={500} fontSize={20} fill={C.gray}>
				{body}
			</text>
			<text x={w / 2 - 20} y={-6} textAnchor="end" fontFamily={FONT} fontWeight={500} fontSize={18} fill={C.gray}>
				now
			</text>
		</g>
	);
};

export const Phone: React.FC<{lit?: number}> = ({lit = 0}) => (
	<g>
		<rect x={-44} y={-82} width={88} height={164} rx={16} fill="#0E1112" stroke="#3A4244" strokeWidth={4} />
		<rect x={-36} y={-72} width={72} height={144} rx={10} fill="#1B2224" />
		<rect x={-36} y={-72} width={72} height={144} rx={10} fill={C.red} opacity={0.22 * lit} />
		<rect x={-30} y={-50} width={60} height={22} rx={6} fill={C.white} opacity={0.55 * lit} />
		<rect x={-12} y={-78} width={24} height={4} rx={2} fill="#2E3537" />
	</g>
);
