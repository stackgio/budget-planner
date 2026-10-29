import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, lerp, pop, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES} from '../../debt-story/Marcus';
import {Cash} from '../../debt-story/props/Jar';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at} from '../timing';
import {count, Kicker, money, panel, SceneWin} from '../ui';

export const FUND_TARGET = 500;
export const FUND_GOAL = 1000;

const BAR = {x: 200, y: 740, w: 680, h: 40};

/** Emergency fund meter: $0 → $500 on "$500", the $500–$1,000 range lights on "$1,000". */
export const S2Fund: React.FC = () => {
	const f = useCurrentFrame();
	const enter = at('n1') + 6;
	const c0 = at('amounts', 1) - 4;
	const c1 = c0 + 24;
	const bal = count(f, c0, c1, 0, FUND_TARGET);
	const fill = bal / FUND_GOAL;
	const landed = pop(f, c1, 12, 220, 0.7);
	const goal = tw(f, at('amounts', 3), at('amounts', 3) + 10, 0, 1, easeOut);
	const panelIn = pop(f, enter, 16, 150, 0.9);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.handChin, head: -14}), expr: 'curious'},
		{f: c0 - 8, pose: P({lean: 6, head: -16, armF: [40, 60], armB: [-12, 10]}), expr: 'determined', dur: 8},
		{f: c0 + 2, pose: P({lean: 2, head: -20, armF: [150, 10], armB: [-14, 10]}), expr: 'determined', dur: 6, overshoot: true},
		{f: c0 + 10, pose: P({lean: 6, head: -16, armF: [40, 60], armB: [-12, 10]}), dur: 6},
		{f: c0 + 16, pose: P({lean: 2, head: -20, armF: [150, 10], armB: [-14, 10]}), dur: 6, overshoot: true},
		{f: c1 + 6, pose: POSES.thumbsUp, expr: 'happy', dur: 10, overshoot: true},
		{f: at('help') + 10, pose: P({...POSES.stand, head: -12}), expr: 'relieved', dur: 14},
	]);

	// cash bundles tossed from Marcus's hand into the meter
	const toss = [c0 + 2, c0 + 9, c0 + 16];
	const MX = 760;
	const MY = 1250;

	return (
		<SceneWin id="fund" enter="push" exit="zoom" fx={540} fy={780}>
			<div
				style={{
					...panel({left: 130, top: 470, width: 820, height: 430, padding: '40px 70px'}),
					opacity: Math.min(1, panelIn * 1.5),
					transform: `translateY(${(1 - panelIn) * 60}px) scale(${0.94 + 0.06 * panelIn})`,
					borderColor: `rgba(57,255,136,${0.15 + 0.45 * landed})`,
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<Kicker color={C.green}>EMERGENCY SAVINGS</Kicker>
					<Kicker style={{fontSize: 22}}>GOAL $500–$1,000</Kicker>
				</div>
				<div
					style={{
						marginTop: 18,
						fontWeight: 900,
						fontSize: 156,
						lineHeight: 1,
						letterSpacing: -5,
						color: bal >= FUND_TARGET ? C.green : C.white,
						fontVariantNumeric: 'tabular-nums',
						transform: `scale(${1 + 0.06 * Math.sin(Math.PI * Math.min(1, landed))})`,
						transformOrigin: 'left center',
					}}
				>
					{money(bal)}
				</div>
			</div>

			<Svg>
				{/* meter track, $0..$1,000 */}
				<g opacity={Math.min(1, panelIn * 1.5)}>
					<rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx={BAR.h / 2} fill="rgba(245,247,245,0.08)" />
					{/* $500–$1,000 range, lit on "$1,000" */}
					<rect
						x={BAR.x + BAR.w * 0.5}
						y={BAR.y}
						width={BAR.w * 0.5}
						height={BAR.h}
						rx={BAR.h / 2}
						fill={`rgba(57,255,136,${0.1 * goal})`}
						stroke={C.green}
						strokeOpacity={0.8 * goal}
						strokeWidth={3}
						strokeDasharray="12 9"
					/>
					<rect x={BAR.x} y={BAR.y} width={Math.max(BAR.h, BAR.w * fill)} height={BAR.h} rx={BAR.h / 2} fill={C.green} opacity={fill > 0 ? 1 : 0} />
					{[0, 0.5, 1].map((k) => (
						<g key={k}>
							<line x1={BAR.x + BAR.w * k} x2={BAR.x + BAR.w * k} y1={BAR.y + BAR.h + 10} y2={BAR.y + BAR.h + 22} stroke={C.grayDim} strokeWidth={3} />
							<text
								x={BAR.x + BAR.w * k}
								y={BAR.y + BAR.h + 58}
								textAnchor={k === 0 ? 'start' : k === 1 ? 'end' : 'middle'}
								fontFamily={FONT}
								fontWeight={800}
								fontSize={30}
								fill={(k === 1 && goal > 0.5) || (k === 0.5 && bal >= FUND_TARGET) ? C.green : C.gray}
							>
								{money(k * FUND_GOAL)}
							</text>
						</g>
					))}
				</g>

				{toss.map((t, i) => {
					const p = tw(f, t, t + 12, 0, 1, easeIO);
					if (p <= 0 || p >= 1) return null;
					const x = lerp(MX + 60, BAR.x + BAR.w * 0.17 * (i + 1), p);
					const y = lerp(MY - 360, BAR.y + BAR.h / 2, p) - Math.sin(Math.PI * p) * 160;
					return (
						<g key={i} transform={`translate(${x} ${y}) scale(${lerp(0.8, 0.45, p)})`} opacity={1 - Math.pow(p, 6)}>
							<Cash w={150} rot={-20 + p * 380} />
						</g>
					);
				})}

				<Marcus x={MX} y={MY} scale={0.82} facing={-1} pose={pose} expr={expr} frame={f} opacity={tw(f, at('n1') + 2, at('n1') + 12)} fx={f > c1 && f < c1 + 30 ? ['sparkle'] : []} seed={3} />
			</Svg>
		</SceneWin>
	);
};
