import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, shake, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Doc, Envelope, Notif, Phone} from '../props/Paper';
import {Cam, Svg} from '../Stage';
import {C} from '../theme';

const DESK_TOP = 1236;
const PILE_X = 660;

type Item = {f: number; kind: 'doc' | 'env'; label: string; dx: number; rot: number; accent?: string; stamp?: string};
/** Bills landing on the desk, in order. The first is the estimate that flew in from Scene 3. */
export const ITEMS: Item[] = [
	{f: 0, kind: 'doc', label: 'BILL', dx: 0, rot: -5},
	{f: 12, kind: 'env', label: 'BILL', dx: 26, rot: 7},
	{f: 25, kind: 'doc', label: 'INVOICE', dx: -30, rot: -10, stamp: 'PAST DUE'},
	{f: 31, kind: 'env', label: 'DUE', dx: 18, rot: 12},
	{f: 41, kind: 'doc', label: 'STATEMENT', dx: -10, rot: 4, accent: C.orange},
	{f: 47, kind: 'env', label: 'BILL', dx: 34, rot: -9},
];
const NOTIFS = [
	{f: 19, title: 'Payment due', body: 'A new bill is ready to view'},
	{f: 36, title: 'Bill reminder', body: 'Another payment is coming up'},
];

const Room: React.FC = () => (
	<>
		<defs>
			<linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#0E1211" />
				<stop offset="1" stopColor="#171D1B" />
			</linearGradient>
			<radialGradient id="lampPool" cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stopColor="#FFD9A0" stopOpacity={0.22} />
				<stop offset="1" stopColor="#FFD9A0" stopOpacity={0} />
			</radialGradient>
			<linearGradient id="deskFront" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#5A3F2B" />
				<stop offset="1" stopColor="#2B1E15" />
			</linearGradient>
			<linearGradient id="deskTop" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#6E4E36" />
				<stop offset="1" stopColor="#82603F" />
			</linearGradient>
			<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#0C1A26" />
				<stop offset="1" stopColor="#14283A" />
			</linearGradient>
		</defs>
		<rect x={-100} y={0} width={1280} height={1920} fill="url(#room)" />
		{/* window */}
		<rect x={620} y={590} width={360} height={300} rx={6} fill="#262E2C" />
		<rect x={634} y={604} width={332} height={272} fill="url(#night)" />
		{[[650, 760, 60], [720, 700, 50], [780, 740, 70], [860, 680, 46], [912, 730, 54]].map(([x, t, w], i) => (
			<rect key={i} x={x} y={t} width={w} height={876 - t} fill="#0A131B" />
		))}
		<line x1={800} x2={800} y1={604} y2={876} stroke="#262E2C" strokeWidth={10} />
		<line x1={634} x2={966} y1={740} y2={740} stroke="#262E2C" strokeWidth={10} />
		{/* wall calendar */}
		<g transform="translate(120 640)">
			<rect width={170} height={190} rx={8} fill="#E9E5DA" />
			<rect width={170} height={44} rx={8} fill={C.red} />
			{Array.from({length: 15}, (_, i) => (
				<rect key={i} x={16 + (i % 5) * 29} y={62 + Math.floor(i / 5) * 38} width={20} height={20} rx={3} fill="#C9C3B4" />
			))}
			<circle cx={84} cy={110} r={20} fill="none" stroke={C.red} strokeWidth={4} />
		</g>
		<ellipse cx={930} cy={DESK_TOP} rx={360} ry={220} fill="url(#lampPool)" />
	</>
);

const DeskFront: React.FC = () => (
	<>
		<polygon points={`60,${DESK_TOP + 52} 1020,${DESK_TOP + 52} 1020,1560 60,1560`} fill="url(#deskFront)" />
		<rect x={60} y={DESK_TOP + 52} width={960} height={8} fill="#3A291D" />
		<rect x={600} y={DESK_TOP + 110} width={340} height={110} rx={8} fill="none" stroke="#24180F" strokeWidth={4} />
		<rect x={735} y={DESK_TOP + 160} width={70} height={12} rx={6} fill="#B9A58E" />
		{/* lamp */}
		<g transform={`translate(960 ${DESK_TOP + 10})`}>
			<ellipse cx={0} cy={0} rx={50} ry={12} fill="#1E2422" />
			<path d="M 0 0 L -20 -170 L -90 -230" stroke="#2C3431" strokeWidth={12} fill="none" strokeLinecap="round" />
			<path d="M -150 -250 L -70 -280 L -50 -220 Z" fill="#2C3431" />
			<ellipse cx={-100} cy={-226} rx={36} ry={10} fill="#FFE6B8" transform="rotate(-20 -100 -226)" />
		</g>
	</>
);

export const S04ExpenseStack: React.FC = () => {
	const f = useCurrentFrame();
	const sk = ITEMS.reduce(
		(a, it) => {
			const s = shake(f, it.f + 7, 7, 4);
			return {x: a.x + s.x, y: a.y + s.y};
		},
		{x: 0, y: 0},
	);
	const pan = tw(f, 56, 64, 0, -1080, easeIn);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.sitDesk, head: 24}), expr: 'curious'},
		{f: 12, pose: P({...POSES.sitDesk, head: 18, lean: 2}), expr: 'shocked', dur: 5},
		{f: 22, pose: P({...POSES.sitDesk, head: -6, lean: 0, armF: [40, 30]}), expr: 'shocked', dur: 6},
		{f: 30, pose: P({...POSES.sitDesk, head: 10}), expr: 'deadpan', dur: 6},
		{f: 58, pose: P({...POSES.sitBack, head: -2, gaze: 0.8}), expr: 'deadpan', dur: 26},
	]);

	let stackH = 0;
	return (
		<AbsoluteFill style={{transform: `translateX(${pan}px)`, filter: pan < -2 ? `blur(${Math.min(10, -pan / 60)}px)` : undefined}}>
			<Cam zoom={tw(f, 0, 62, 1, 1.08) + ITEMS.reduce((a, it) => a + 0.03 * tw(f, it.f + 7, it.f + 9) * tw(f, it.f + 9, it.f + 16, 1, 0), 0)} fx={600} fy={1150} x={sk.x} y={sk.y}>
				<Svg>
					<Room />
					{/* desk top surface */}
					<polygon points={`110,${DESK_TOP} 970,${DESK_TOP} 1020,${DESK_TOP + 52} 60,${DESK_TOP + 52}`} fill="url(#deskTop)" />
					<Marcus x={310} y={DESK_TOP + 150} scale={1.3} pose={pose} expr={expr} frame={f + 214} noLegs fx={f > 22 && f < 32 ? ['shock'] : f >= 12 ? ['sweat'] : []} seed={4} />
					<DeskFront />
					{/* phone on a stand */}
					<g transform={`translate(830 ${DESK_TOP - 50}) rotate(-8)`}>
						<Phone lit={NOTIFS.reduce((a, n) => Math.max(a, tw(f, n.f, n.f + 3) * tw(f, n.f + 12, n.f + 22, 1, 0.4)), 0)} />
					</g>
					{ITEMS.map((it, i) => {
						const land = it.f + 8;
						const baseY = DESK_TOP + 18 - stackH;
						stackH += it.kind === 'doc' ? 20 : 15;
						if (f < it.f) return null;
						let x = PILE_X + it.dx;
						let y = baseY;
						let s = 1;
						let rot = it.rot;
						if (i === 0) {
							// arrives from full-screen (continuation of Scene 3's flying paper)
							const t = tw(f, 0, 9, 0, 1, easeOut);
							x = lerp(540, x, t);
							y = lerp(960, y, t);
							s = lerp(9.5 / 1.25, 1, t);
							rot = lerp(-4, rot, t);
						} else {
							const t = tw(f, it.f, land, 0, 1, easeIn);
							y = lerp(baseY - 520, baseY, t);
							rot = lerp(rot * 3, rot, t);
						}
						const bounce = f >= land && i > 0 ? Math.sin(Math.min(1, (f - land) / 6) * Math.PI) * -8 : 0;
						const flatten = i === 0 ? tw(f, 4, 9, 1, 0.62) : tw(f, land - 2, land, 1, 0.62);
						return (
							<g key={i} transform={`translate(${x} ${y + bounce}) rotate(${rot}) scale(${1.25 * s} ${1.25 * s * flatten})`}>
								{it.kind === 'doc' ? <Doc w={150} title={it.label} stamp={it.stamp} accent={it.accent ?? C.red} /> : <Envelope w={190} label={it.label} />}
							</g>
						);
					})}
					{NOTIFS.map((n, i) => {
						if (f < n.f) return null;
						const p = pop(f, n.f, 14, 200);
						const later = NOTIFS.filter((m, k) => k > i && f >= m.f).length;
						const y = 900 - later * tw(f, NOTIFS[i + 1]?.f ?? 999, (NOTIFS[i + 1]?.f ?? 999) + 6, 0, 120, easeOut);
						return (
							<g key={i} transform={`translate(780 ${y + (1 - p) * 60}) scale(${0.85 + 0.15 * p})`} opacity={Math.min(1, p * 1.5)}>
								<Notif w={440} title={n.title} body={n.body} />
							</g>
						);
					})}
				</Svg>
			</Cam>
		</AbsoluteFill>
	);
};
