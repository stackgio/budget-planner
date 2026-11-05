import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {contributions, FACTS} from '../facts';
import {ExampleTag, Footnote} from '../ui';

const PANEL = {x: 440, y: 640, w: 560, h: 470};
const STEP = 8; // frames between example deposits

/**
 * 01 — INVESTING. Learn: tiny amounts still count. $5 bills arc into an account,
 * a contributions counter ticks +$5 each time, a dot tracker turns into a habit.
 */
export const InvestScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L4');
	const tInvesting = cue('L4', 'investing');
	const tEven = cue('L4', 'even');
	const tFive = cue('L4', 'five');
	const tHabit = cue('L5', 'habit');
	const tFuture = cue('L5', 'future');

	const N = FACTS.deposits.value;
	const flight = 14;
	const launches = Array.from({length: N}, (_, i) => tFive - 8 + i * STEP);
	const landed = launches.filter((l) => frame >= l + flight).length;
	const panelIn = sp(frame, fps, t0 + 12, 'bouncy');
	const habit = sp(frame, fps, tHabit, 'bouncy');
	const bump = landed > 0 ? 1 + 0.08 * (1 - prog(frame, launches[landed - 1] + flight, 6)) : 1;
	const hand: [number, number] = [330, 1060];
	const slot: [number, number] = [PANEL.x + PANEL.w / 2, PANEL.y + 210];

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={700} lightY={850} floorY={story.ground} />
			<ChapterTag n="01" label="INVESTING" at={t0 - 4} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 330}}>
				<KineticText text="START SMALL" at={t0 + 6} exitAt={tHabit - 10} fontSize={140} color={P.ink} colors={{small: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 330}}>
				<KineticText text="STAY CONSISTENT" at={tHabit - 2} fontSize={118} color={P.ink} colors={{consistent: P.accent}} lineHeight={1.0} />
			</div>
			<Camera keys={[{at: 0, zoom: 1}, {at: tFive, zoom: 1}, {at: tFive + 24, zoom: 1.04, x: 620, y: 960, ease: E.out}, {at: tFuture, zoom: 1.04, x: 620, y: 960}]}>
				{/* account panel */}
				<div
					style={{
						position: 'absolute',
						left: PANEL.x,
						top: PANEL.y,
						width: PANEL.w,
						height: PANEL.h,
						borderRadius: 32,
						background: P.paper,
						border: `3px solid ${P.line}`,
						boxShadow: `0 30px 70px ${P.shadow}`,
						opacity: Math.min(1, panelIn * 1.5),
						transform: `translateY(${(1 - panelIn) * 80}px) scale(${0.9 + 0.1 * panelIn})`,
						padding: '34px 40px',
						boxSizing: 'border-box',
					}}
				>
					<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: P.muted}}>INVESTMENT ACCOUNT</div>
					<div style={{marginTop: 40, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.accent}}>CONTRIBUTIONS</div>
					<div style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', transform: `scale(${bump})`, transformOrigin: '0 60%'}}>
						${contributions(landed)}
					</div>
					{/* habit tracker: one dot per deposit */}
					<div style={{position: 'absolute', left: 40, right: 40, bottom: 40, display: 'flex', gap: 14, flexWrap: 'wrap'}}>
						{Array.from({length: N}).map((_, i) => (
							<div
								key={i}
								style={{
									width: 60,
									height: 34,
									borderRadius: 10,
									background: i < landed ? P.accent : 'transparent',
								transform: i === landed - 1 ? `scale(${1 + (bump - 1) * 3})` : undefined,
									border: `3px solid ${i < landed ? P.accent : P.line}`,
									boxSizing: 'border-box',
									fontSize: 24,
									fontWeight: 900,
									color: P.bg,
									textAlign: 'center',
									lineHeight: '28px',
								}}
							>
								{i < landed ? '+5' : ''}
							</div>
						))}
					</div>
					<ExampleTag style={{right: 30, bottom: -18}} />
				</div>
				{/* HABIT stamp on the tracker */}
				<div
					style={{
						position: 'absolute',
						left: PANEL.x + PANEL.w - 210,
						top: PANEL.y + PANEL.h - 20,
						fontSize: 40,
						fontWeight: 900,
						letterSpacing: 4,
						color: P.bg,
						background: P.accent,
						borderRadius: 14,
						padding: '8px 22px',
						opacity: Math.min(1, habit * 1.5),
						transform: `scale(${0.5 + 0.5 * habit}) rotate(${-6 * habit}deg)`,
					}}
				>
					HABIT ✓
				</div>
				{/* $5 bills arcing in */}
				{launches.map((l, i) => {
					const f = prog(frame, l, flight, E.inOut);
					if (f <= 0 || f >= 1) return null;
					const [x, y] = arc(f, hand, slot, 220);
					return <Bill key={i} w={140} value="5" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${-25 + 50 * f}deg) scale(${1 - 0.4 * f})`}} />;
				})}
				<Marcus
					x={220}
					y={story.ground}
					scale={1.06}
					facing={1}
					seed={4}
					onDark
					frontProp={
						frame >= tInvesting - 4 && frame < launches[0] + 2 ? (
							<g transform="rotate(-20)">
								<rect x={-44} y={-20} width={88} height={40} rx={6} fill="#2FA463" stroke="#17673C" strokeWidth={3} />
								<text x={0} y={10} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" fontFamily="Inter">$5</text>
							</g>
						) : undefined
					}
					track={[
						{at: -10, pose: 'idle', face: 'focused'},
						{at: tInvesting - 2, pose: 'hold', face: 'happy', spring: 'snappy'},
						{at: tFive - 10, pose: 'feed', face: 'determined', spring: 'snappy'},
						{at: tHabit, pose: 'feed', face: 'happy'},
						{at: tFuture, pose: 'fist', face: 'joy', spring: 'bouncy'},
					]}
				/>
			</Camera>
			<Footnote at={tFive + 10} style={{top: 1200, left: PANEL.x}}>
				Contributions only — returns not shown.
				<br />
				See: Investor.gov Compound Interest Calculator
			</Footnote>
			{launches.slice(0, 6).map((l, i) => (
				<Sfx key={i} at={l + flight} name="coin" volume={0.22} />
			))}
			<Sfx at={tHabit} name="stamp" volume={0.4} />
		</AbsoluteFill>
	);
};
