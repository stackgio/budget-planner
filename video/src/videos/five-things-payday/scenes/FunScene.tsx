import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {E, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, Label, Panel, Stage, StepHeading} from '../ui';

const BOX = {x: 150, y: 550, w: 780, h: 300};
const BR = {x: 92, y: 990, w: 896, h: 150};
const CHIPS = {y: BR.y + 24, h: 102, lefts: [120, 560], w: 400};
const SPAN = {y: 1236, x0: 92, x1: 988};

/**
 * STEP 5 — one $80 limit (EXAMPLE) that covers both fun categories and lasts
 * until the next paycheck. "$80 TOTAL" is fully on screen on the spoken
 * "80 bucks" (no roll); the labels arrive on "eating out" / "hanging out",
 * one bracket ties them to the $80, and a TODAY → NEXT PAYCHECK span closes it.
 */
export const FunScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tLimit = cue('L14', 'limit');
	const t80 = cue('L15', '80');
	const tEat = cue('L15', 'eating');
	const tHang = cue('L15', 'hanging');
	const tBr = cue('L15', 'whatever', -0.25);
	const tUntil = cue('L15', 'until');

	const boxIn = Math.max(sp(frame, fps, -8, 'snappy') * 0.5, sp(frame, fps, tLimit - 3, 'snappy'));
	const filled = prog(frame, t80 - 8, 8, E.out); // complete on the word
	const chips = [sp(frame, fps, tEat - 3, 'snappy'), sp(frame, fps, tHang - 3, 'snappy')];
	const stem = prog(frame, tBr, 9, E.out);
	const br = prog(frame, tBr + 5, 10, E.out);
	const span = prog(frame, tUntil - 2, 16, E.inOut);
	const spanLbl = sp(frame, fps, tUntil - 2, 'snappy');
	const endLbl = sp(frame, fps, tUntil + 10, 'snappy');

	return (
		<Stage>
			<StepHeading n={5} text="FUN MONEY TILL PAYDAY" at={-12} />

			<Panel
				border={filled > 0.02 ? C.line : '#4A4F57'}
				style={{
					left: BOX.x,
					top: BOX.y,
					width: BOX.w,
					height: BOX.h,
					borderStyle: filled > 0.02 ? 'solid' : 'dashed',
					background: filled > 0.02 ? C.panel2 : 'transparent',
					boxShadow: filled > 0.02 ? undefined : 'none',
					opacity: boxIn,
					transform: `scale(${0.94 + 0.06 * boxIn})`,
				}}
			>
				<Label size={30} color={C.soft} style={{position: 'absolute', left: 36, top: 30, fontWeight: 900}}>
					FUN MONEY LIMIT
				</Label>
				{filled > 0 && (
					<>
						<ExampleTag size={26} style={{position: 'absolute', right: 30, top: 24, opacity: filled}} />
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 92,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'baseline',
								gap: 26,
								opacity: filled,
								transform: `scale(${0.9 + 0.1 * filled})`,
							}}
						>
							<div style={{fontSize: 180, fontWeight: 900, color: C.green, letterSpacing: -6, lineHeight: 1}}>${FACTS.funExample.value}</div>
							<div style={{fontSize: 74, fontWeight: 900, color: C.white, letterSpacing: -1}}>TOTAL</div>
						</div>
					</>
				)}
			</Panel>

			{/* stem from the $80 to the shared bracket */}
			<div style={{position: 'absolute', left: 538, top: BOX.y + BOX.h, width: 5, height: (BR.y - BOX.y - BOX.h) * stem, background: C.green, borderRadius: 3}} />
			<div
				style={{
					position: 'absolute',
					left: BR.x,
					top: BR.y,
					width: BR.w,
					height: BR.h,
					borderRadius: 30,
					boxSizing: 'border-box',
					border: `4px solid ${C.green}`,
					background: 'rgba(44,212,122,0.06)',
					opacity: br,
					transform: `scaleX(${0.9 + 0.1 * br})`,
				}}
			/>
			{[0, 1].map((i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: CHIPS.lefts[i],
						top: CHIPS.y,
						width: CHIPS.w,
						height: CHIPS.h,
						borderRadius: 20,
						background: '#22262C',
						border: `3px solid ${C.line}`,
						boxSizing: 'border-box',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 40,
						fontWeight: 900,
						color: C.white,
						letterSpacing: 1,
						opacity: chips[i],
						transform: `translateY(${(1 - chips[i]) * 40}px)`,
					}}
				>
					{i === 0 ? 'EATING OUT' : 'HANGING OUT'}
				</div>
			))}

			{/* lasts until the next paycheck: TODAY ─────▶ NEXT PAYCHECK */}
			<div style={{position: 'absolute', left: SPAN.x0, top: SPAN.y - 50, opacity: spanLbl}}>
				<Label size={28} color={C.soft} style={{fontWeight: 900}}>TODAY</Label>
			</div>
			<div style={{position: 'absolute', right: 1080 - SPAN.x1, top: SPAN.y - 52, opacity: endLbl, transform: `translateY(${(1 - endLbl) * 12}px)`}}>
				<Label size={32} color={C.white} style={{fontWeight: 900, letterSpacing: 3}}>UNTIL NEXT PAYCHECK</Label>
			</div>
			<svg width={1080} height={60} style={{position: 'absolute', left: 0, top: SPAN.y - 8, opacity: spanLbl}}>
				<circle cx={SPAN.x0 + 10} cy={18} r={10} fill={C.green} />
				<line x1={SPAN.x0 + 10} y1={18} x2={SPAN.x0 + 10 + (SPAN.x1 - SPAN.x0 - 30) * span} y2={18} stroke={C.green} strokeWidth={6} strokeLinecap="round" />
				{span > 0.98 && <path d={`M${SPAN.x1 - 26} 4 L${SPAN.x1 - 4} 18 L${SPAN.x1 - 26} 32`} fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
			</svg>
		</Stage>
	);
};
