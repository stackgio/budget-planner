import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleChip, Label} from '../parts';

/**
 * 01 · THE CAR — "$450 a month on a $40,000 salary… $5,400 a year."
 * Viewer learns: a "small" monthly payment is a big yearly number. The
 * twelve months fill one by one while the counter rolls up to the year.
 */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const GRID = {x: story.safe.left, y: 690, w: 150, h: 76, gap: 14, cols: 4};

export const CarScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHad = cue('L3', 'look');
	const tFour = cue('L4', 'four');
	const tForty = cue('L4', 'forty');
	const tThats = cue('L5', "that's");
	const tYear = cue('L5', 'year', 0, 'end');

	const numIn = sp(frame, fps, tFour - 2, 'bouncy');
	const monthly = FACTS.carPayment.value * kf(frame, [tFour, cue('L4', 'month', 0, 'end')], [0, 1], E.out);
	// months fill between "That's" and the end of "year"; the counter is month-count × payment
	const filled = interpolate(frame, [tThats, tYear], [1, 12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const yearMode = frame >= tThats;
	const value = yearMode ? FACTS.carPayment.value * filled : monthly;
	const red = kf(frame, [tThats, tYear], [0, 1]);
	const gridIn = sp(frame, fps, tThats - 8, 'snappy');
	const salary = sp(frame, fps, tForty - 2, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ExampleChip palette={P} at={tFour - 4} />
			<ChapterTag n="01" label="THE CAR" at={4} palette={P} style={{left: story.safe.left, top: story.safe.top + 6}} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tYear - 6, zoom: 1}, {at: tYear + 18, zoom: 1.05, x: 540, y: 760}]}>
				{/* the number */}
				<div style={{position: 'absolute', left: story.safe.left - 6, top: 330, display: 'flex', alignItems: 'baseline', gap: 18, opacity: Math.min(1, numIn * 1.5), transform: `translateY(${(1 - numIn) * 40}px)`}}>
					<NumberCounter value={value} fontSize={story.type.mega * 0.86} color={red > 0.5 ? P.danger : P.ink} style={{letterSpacing: -5}} />
					<div style={{fontSize: 44, fontWeight: 900, color: red > 0.5 ? P.danger : P.muted}}>{yearMode ? '/ YEAR' : '/ MONTH'}</div>
				</div>
				<Label color={P.body} style={{left: story.safe.left, top: 560, opacity: salary * (1 - gridIn * 0.4), transform: `translateY(${(1 - salary) * 20}px)`}}>
					{yearMode ? `${usd(FACTS.carPayment.value)} × 12 MONTHS` : `ON A ${usd(FACTS.salary.value)} SALARY`}
				</Label>

				{/* twelve months of car payments */}
				{MONTHS.map((m, i) => {
					const col = i % GRID.cols;
					const row = Math.floor(i / GRID.cols);
					const on = Math.max(0, Math.min(1, filled - i));
					const chipIn = sp(frame, fps, tThats - 8 + i, 'snappy');
					return (
						<div
							key={m}
							style={{
								position: 'absolute',
								left: GRID.x + col * (GRID.w + GRID.gap),
								top: GRID.y + row * (GRID.h + GRID.gap),
								width: GRID.w,
								height: GRID.h,
								borderRadius: 16,
								background: on > 0.5 ? P.danger : P.paper,
								border: `3px solid ${on > 0.5 ? P.danger : P.line}`,
								color: on > 0.5 ? '#fff' : P.muted,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 28,
								fontWeight: 900,
								letterSpacing: 2,
								opacity: Math.min(1, chipIn * gridIn * 1.4),
								transform: `scale(${0.85 + 0.15 * chipIn}) translateY(${on > 0.5 ? 0 : 4}px)`,
								boxShadow: on > 0.5 ? `0 10px 18px ${P.dangerSoft}` : 'none',
							}}
						>
							{m}
						</div>
					);
				})}

				<Marcus
					x={880}
					y={story.ground}
					scale={1.02}
					facing={-1}
					seed={5}
					track={[
						{at: 0, pose: 'idle', face: 'neutral'},
						{at: tHad - 2, pose: ['present', {head: 8}], face: 'smug', spring: 'bouncy'},
						{at: tFour + 6, pose: 'point', face: 'focused'},
						{at: tYear - 4, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tYear + 26, pose: 'worried', face: 'worried'},
					]}
				/>
			</Camera>
			<Sfx at={tHad} name="pop" volume={0.3} />
			<Sfx at={tFour} name="cash" volume={0.35} />
			{[0, 3, 6, 9].map((k) => (
				<Sfx key={k} at={Math.round(tThats + ((tYear - tThats) * k) / 11)} name="tick" volume={0.3} />
			))}
			<Sfx at={tYear} name="thud" volume={0.5} />
		</AbsoluteFill>
	);
};
