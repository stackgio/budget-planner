import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, lerp, pop, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES, type Key} from '../../debt-story/Marcus';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at, SCENES} from '../timing';
import {Kicker, panel, SceneWin} from '../ui';

const ink = C.green;
const Clock = () => (
	<g>
		<circle r={26} fill="none" stroke={ink} strokeWidth={5} />
		<path d="M 0 -15 L 0 0 L 11 7" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</g>
);
const Calendar = () => (
	<g>
		<rect x={-26} y={-22} width={52} height={48} rx={8} fill="none" stroke={ink} strokeWidth={5} />
		<line x1={-26} x2={26} y1={-8} y2={-8} stroke={ink} strokeWidth={5} />
		<line x1={-13} x2={-13} y1={-30} y2={-16} stroke={ink} strokeWidth={5} strokeLinecap="round" />
		<line x1={13} x2={13} y1={-30} y2={-16} stroke={ink} strokeWidth={5} strokeLinecap="round" />
		<path d="M -6 10 L 5 10 M 0 4 L 0 16" stroke={ink} strokeWidth={5} strokeLinecap="round" />
	</g>
);
const Bag = () => (
	<g>
		<path d="M -24 -12 L 24 -12 L 20 26 L -20 26 Z" fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
		<path d="M -11 -12 Q -11 -28 0 -28 Q 11 -28 11 -12" fill="none" stroke={ink} strokeWidth={5} />
	</g>
);
const Tag = () => (
	<g transform="rotate(-35)">
		<path d="M -28 -15 L 14 -15 L 30 0 L 14 15 L -28 15 Z" fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
		<circle cx={12} cy={0} r={4.5} fill={ink} />
	</g>
);

const ROWS = [
	{id: 'overtime', k: 1, label: 'OVERTIME', sub: 'More hours on the clock', icon: <Clock />},
	{id: 'shifts', k: 2, label: 'EXTRA SHIFTS', sub: 'Pick up open shifts', icon: <Calendar />},
	{id: 'doordash', k: 1, label: 'DELIVERY GIGS', sub: 'New order nearby', icon: <Bag />, ping: true},
	{id: 'selling', k: 1, label: 'SELL UNUSED STUFF', sub: "Things you don't use", icon: <Tag />},
];
const ROW_Y = (i: number) => 480 + i * 150;
const POINT = [148, 128, 112, 98];

export const S5Income: React.FC = () => {
	const f = useCurrentFrame();
	const S = SCENES.income[0];
	const extra = at('extra');
	const list = at('couldMean');
	const toList = tw(f, list - 6, list + 10, 0, 1, easeIO);
	const barIn = pop(f, S + 10, 16, 150, 0.9);
	const grow = tw(f, extra - 2, extra + 14, 0, 1, easeOut);
	const rowT = ROWS.map((r) => at(r.id, r.k) - 3);

	const keys: Key[] = [
		{f: 0, pose: P({...POSES.handChin, head: -12}), expr: 'curious'},
		{f: extra + 6, pose: POSES.fistPump, expr: 'determined', dur: 9, overshoot: true},
		{f: list + 8, pose: P({...POSES.point, armF: [POINT[0], 4], head: -20}), expr: 'happy', dur: 10},
		...rowT.slice(1).map((t, i) => ({f: t + 6, pose: P({...POSES.point, armF: [POINT[i + 1], 4] as [number, number], head: -16 + 8 * (i + 1)}), dur: 7})),
		{f: at('dontUse') + 12, pose: POSES.thumbsUp, expr: 'happy', dur: 10, overshoot: true},
	];
	const {pose, expr} = animate(f, keys);

	return (
		<SceneWin id="income" enter="push" exit="fade">
			{/* income bar: regular pay + an extra segment that grows on "extra money" */}
			<div
				style={{
					...panel({left: 130, top: 480, width: 820, height: 290, padding: '36px 50px'}),
					opacity: Math.min(1, barIn * 1.5) * (1 - toList),
					transform: `translateY(${(1 - barIn) * 50 - toList * 80}px)`,
				}}
			>
				<Kicker>YOUR MONTHLY INCOME</Kicker>
				<div style={{marginTop: 30, height: 76, display: 'flex', borderRadius: 20, overflow: 'hidden', background: 'rgba(245,247,245,0.05)'}}>
					<div style={{width: '64%', background: '#3A4441', display: 'flex', alignItems: 'center', paddingLeft: 24, fontWeight: 800, fontSize: 28, color: C.white, letterSpacing: 1}}>REGULAR PAY</div>
					<div
						style={{
							width: `${30 * grow}%`,
							background: C.green,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontWeight: 900,
							fontSize: 30,
							color: C.bg,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
						}}
					>
						+ EXTRA
					</div>
				</div>
				<div style={{marginTop: 22, fontWeight: 700, fontSize: 28, color: grow > 0.5 ? C.green : C.gray}}>More coming in = more to put toward debt</div>
			</div>

			{/* ways to earn more, one per spoken item */}
			{ROWS.map((r, i) => {
				const p = pop(f, rowT[i], 15, 180, 0.8);
				if (f < rowT[i]) return null;
				const ping = r.ping ? tw(f, rowT[i] + 8, rowT[i] + 22, 0, 1, easeOut) : 0;
				return (
					<div
						key={r.id}
						style={{
							...panel({left: 370, top: ROW_Y(i), width: 580, height: 128, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 22, borderRadius: 26}),
							opacity: Math.min(1, p * 1.6),
							transform: `translateX(${(1 - p) * 90}px)`,
							borderColor: `rgba(57,255,136,${0.15 + 0.4 * (1 - tw(f, rowT[i] + 6, rowT[i] + 30))})`,
						}}
					>
						<svg width={84} height={84} viewBox="-42 -42 84 84" style={{flex: 'none', background: 'rgba(57,255,136,0.1)', borderRadius: 22}}>
							{r.icon}
						</svg>
						<div style={{flex: 1, minWidth: 0}}>
							<div style={{fontWeight: 900, fontSize: 31, color: C.white, letterSpacing: 0.2, whiteSpace: 'nowrap'}}>{r.label}</div>
							<div style={{fontWeight: 600, fontSize: 24, color: C.gray, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap'}}>
								{r.ping ? <span style={{width: 12, height: 12, borderRadius: 6, background: C.green, boxShadow: `0 0 0 ${8 * ping}px rgba(57,255,136,${0.4 * (1 - ping)})`}} /> : null}
								{r.sub}
							</div>
						</div>
						<div style={{flex: 'none', fontWeight: 900, fontSize: 30, color: C.bg, background: C.green, borderRadius: 14, padding: '8px 14px', transform: `scale(${pop(f, rowT[i] + 6, 12, 220, 0.7)})`}}>+$</div>
					</div>
				);
			})}

			<Svg>
				<Marcus x={lerp(540, 196, toList)} y={1250} scale={lerp(0.92, 0.8, toList)} pose={pose} expr={expr} frame={f} seed={4} />
			</Svg>
		</SceneWin>
	);
};
