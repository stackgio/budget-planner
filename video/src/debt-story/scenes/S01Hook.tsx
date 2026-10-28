import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {easeOut, pop, shake, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {Warn} from '../props/Icons';
import {Cam, Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const BAR = {x0: 130, x1: 850, y: 770, h: 36};
const STOP = VO.everything;
const fillAt = (f: number) => {
	// steady progress, then the stall + small knock-back
	const moving = 0.34 + 0.24 * tw(f, 0, STOP, 0, 1, (t) => t);
	return f < STOP ? moving : 0.58 - 0.025 * tw(f, STOP, STOP + 6, 0, 1, easeOut);
};
/** Where the interrupting warning sits; Scene 2's reveal grows from here. */
export const HOOK_WARN = {x: BAR.x0 + (BAR.x1 - BAR.x0) * 0.555, y: BAR.y + BAR.h / 2};

const SIDE_WARNINGS = [
	{f: STOP + 6, x: 215, y: 1090, s: 84},
	{f: STOP + 11, x: 875, y: 1030, s: 96},
	{f: STOP + 16, x: 170, y: 1340, s: 70},
	{f: STOP + 21, x: 920, y: 1320, s: 78},
];

export const S01Hook: React.FC = () => {
	const f = useCurrentFrame();
	const fill = fillAt(f);
	const hit = f >= STOP;
	const sk = shake(f, STOP, 20, 16);
	const barColor = interpolateColors(tw(f, STOP, STOP + 4), [0, 1], [C.green, C.red]);
	const flash = tw(f, STOP, STOP + 3, 0, 1) * tw(f, STOP + 3, STOP + 22, 1, 0);
	const push = tw(f, 0, STOP, 1, 1.05, (t) => t) + (hit ? 0.03 * pop(f, STOP, 9, 240) : 0);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.lookUp, gaze: 0.75}), expr: 'happy'},
		{f: 40, pose: P({...POSES.lookUp, head: -18, gaze: 0.75}), expr: 'happy'},
		{f: 56, pose: P({...POSES.fistPump, gaze: 0.6}), expr: 'happy', dur: 10, overshoot: true},
		{f: 78, pose: P({...POSES.lookUp, gaze: 0.75}), expr: 'happy', dur: 14},
		{f: STOP + 4, pose: P({...POSES.flinch, head: -22}), expr: 'shocked', dur: 4, overshoot: true},
		{f: STOP + 16, pose: P({...POSES.confused, head: -24}), expr: 'confused', dur: 10},
		{f: STOP + 30, pose: P({...POSES.confused, head: -8, armF: [20, 60]}), expr: 'confused', dur: 10},
	]);
	// glances around at the warnings
	const facing: 1 | -1 = f > STOP + 18 && f < STOP + 32 ? -1 : 1;

	return (
		<AbsoluteFill>
			<Cam zoom={push} fx={540} fy={1000} x={sk.x} y={sk.y} rot={sk.r}>
				{/* progress card */}
				<div
					style={{
						position: 'absolute',
						left: 90,
						top: 660,
						width: 900,
						height: 238,
						borderRadius: 34,
						background: 'linear-gradient(160deg, #18201D 0%, #121715 100%)',
						border: `2px solid ${hit ? 'rgba(255,85,85,0.55)' : '#26302C'}`,
						boxShadow: hit ? '0 0 80px rgba(255,85,85,0.25), 0 30px 80px rgba(0,0,0,0.5)' : '0 30px 80px rgba(0,0,0,0.5)',
						fontFamily: FONT,
					}}
				>
					<div style={{position: 'absolute', left: 40, top: 32, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: C.gray}}>DEBT PAYOFF</div>
					<div
						style={{
							position: 'absolute',
							right: 36,
							top: 26,
							padding: '8px 16px',
							borderRadius: 999,
							fontWeight: 800,
							fontSize: 20,
							letterSpacing: 2,
							color: hit ? C.red : C.green,
							background: hit ? C.redSoft : C.greenSoft,
						}}
					>
						{hit ? 'INTERRUPTED' : 'ON TRACK'}
					</div>
					<div style={{position: 'absolute', left: 40, bottom: 30, fontWeight: 800, fontSize: 24, color: C.gray, letterSpacing: 2}}>DEBT</div>
					<div style={{position: 'absolute', right: 40, bottom: 30, fontWeight: 900, fontSize: 26, color: C.green, letterSpacing: 1}}>$0</div>
				</div>
				<Svg>
					<defs>
						<linearGradient id="hookFill" x1="0" x2="1">
							<stop offset="0" stopColor={barColor} stopOpacity={0.55} />
							<stop offset="1" stopColor={barColor} />
						</linearGradient>
					</defs>
					<rect x={BAR.x0} y={BAR.y} width={BAR.x1 - BAR.x0} height={BAR.h} rx={BAR.h / 2} fill="#232B28" />
					<rect x={BAR.x0} y={BAR.y} width={(BAR.x1 - BAR.x0) * fill} height={BAR.h} rx={BAR.h / 2} fill="url(#hookFill)" />
					{!hit ? (
						<rect
							x={BAR.x0 + (BAR.x1 - BAR.x0) * fill - 60}
							y={BAR.y + 6}
							width={50}
							height={BAR.h - 12}
							rx={10}
							fill="#fff"
							opacity={0.25 + 0.15 * Math.sin(f / 4)}
						/>
					) : null}
					{/* finish flag */}
					<g transform={`translate(${BAR.x1 + 46} ${BAR.y + BAR.h / 2})`}>
						<line x1={-10} y1={22} x2={-10} y2={-34} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
						<path d="M -8 -34 L 22 -24 L -8 -12 Z" fill={C.green} />
					</g>
					{/* the interruption */}
					{hit ? (
						<g transform={`translate(${HOOK_WARN.x} ${HOOK_WARN.y - 6}) scale(${pop(f, STOP, 9, 260)}) rotate(${(1 - pop(f, STOP, 9, 260)) * -30})`}>
							<circle r={64 + 10 * Math.sin((f - STOP) / 3)} fill={C.red} opacity={0.14} />
							<Warn size={86} glow={0} />
						</g>
					) : null}
					{/* ground glow */}
					<ellipse cx={540} cy={1452} rx={360} ry={26} fill={hit ? C.red : C.green} opacity={0.06} />
					<line x1={150} x2={930} y1={1452} y2={1452} stroke="#1E2523" strokeWidth={3} />
					<Marcus x={540} y={1450} scale={1.2} pose={pose} expr={expr} frame={f} facing={facing} />
					{SIDE_WARNINGS.map((w, i) => {
						const p = pop(f, w.f, 10, 230);
						if (p <= 0) return null;
						const bob = Math.sin((f - w.f) / 5 + i) * 6;
						return (
							<g key={i} transform={`translate(${w.x} ${w.y + bob}) scale(${p}) rotate(${Math.sin((f + i * 9) / 6) * 6})`}>
								<Warn size={w.s} glow={0.8} />
							</g>
						);
					})}
				</Svg>
			</Cam>
			{/* red edge flash on the interruption */}
			<AbsoluteFill style={{opacity: flash * 0.55, background: 'radial-gradient(ellipse 620px 1000px at 540px 960px, transparent 45%, rgba(255,60,60,0.55) 100%)'}} />
		</AbsoluteFill>
	);
};
