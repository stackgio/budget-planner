import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleTag, Kicker, Paycheck} from '../props';

const PANEL = {x: story.safe.left, y: 260, w: 1080 - story.safe.left - story.safe.right, h: 400};
const BAR = {x: PANEL.x + 48, y: PANEL.y + 300, w: PANEL.w - 96, h: 44};
/** illustrative monthly expenses (labels only — the balance just runs out) */
const EXPENSES = ['Rent', 'Car', 'Food', 'Bills', 'Everything else'];
/** share of the paycheck each one eats (sums to 1 → balance ends at exactly $0) */
const SHARE = [0.4, 0.15, 0.17, 0.13, 0.15];

/**
 * OLD PAYCHECK — "You were making $3,000 a month … every dollar was gone."
 * Marcus feeds his $3,000 paycheck into the dashboard; expense rows switch on
 * one by one and eat the balance bar down to $0 on "gone".
 */
export const OldPaycheckScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t3000 = cue('L2', '$3,000');
	const tEnd = cue('L2', 'end');
	const tGone = cue('L2', 'gone');

	// paycheck flies from Marcus's hand into the dashboard
	const fly = prog(frame, t3000 - 4, 16, E.inOut);
	const [px, py] = arc(fly, [470, 1010], [PANEL.x + 360, PANEL.y + 190], 180);
	const fill = prog(frame, t3000 + 10, 16, E.out);

	// expenses switch on between "end" and "gone"
	const step = (tGone - 10 - (tEnd - 4)) / (EXPENSES.length - 1);
	const at = EXPENSES.map((_, i) => Math.round(tEnd - 4 + i * step));
	let eaten = 0;
	EXPENSES.forEach((_, i) => (eaten += SHARE[i] * prog(frame, at[i], 10, E.out)));
	const balance = Math.max(0, FACTS.oldIncome.value * fill * (1 - eaten));
	const zero = sp(frame, fps, tGone - 2, 'heavy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<Kicker style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 12}}>Before the raise</Kicker>
			<ExampleTag style={{right: story.safe.right, top: story.safe.top + 8}} />

			{/* dashboard */}
			<div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: P.paper, borderRadius: 36, boxShadow: `0 24px 50px ${P.shadow}`}} />
			<Kicker style={{position: 'absolute', left: PANEL.x + 48, top: PANEL.y + 40}}>Available this month</Kicker>
			<div style={{position: 'absolute', left: PANEL.x + 44, top: PANEL.y + 100}}>
				<NumberCounter value={balance} fontSize={170} color={zero > 0.05 ? P.danger : P.ink} style={{letterSpacing: -5}} />
			</div>
			<div style={{position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: BAR.h / 2, background: P.line, overflow: 'hidden'}}>
				<div style={{width: BAR.w * (balance / FACTS.oldIncome.value), height: '100%', borderRadius: BAR.h / 2, background: P.accent}} />
			</div>

			{/* expense rows */}
			{EXPENSES.map((label, i) => {
				const p = sp(frame, fps, at[i] - 2, 'snappy');
				return (
					<div
						key={label}
						style={{
							position: 'absolute',
							right: story.safe.right,
							top: 730 + i * 108,
							width: 400,
							height: 88,
							borderRadius: 22,
							background: P.paper,
							boxShadow: `0 10px 20px ${P.shadow}`,
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							padding: '0 24px',
							boxSizing: 'border-box',
							opacity: Math.min(1, p * 1.5),
							transform: `translateX(${(1 - p) * 80}px)`,
						}}
					>
						<div style={{width: 44, height: 44, borderRadius: 12, background: P.dangerSoft, color: P.danger, fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>−</div>
						<div style={{fontSize: 38, fontWeight: 800, color: P.ink}}>{label}</div>
					</div>
				);
			})}

			{/* the "$0 left" verdict, pinned to the empty bar */}
			<div
				style={{
					position: 'absolute',
					right: story.safe.right + 48,
					top: PANEL.y + 130,
					background: P.danger,
					color: '#fff',
					fontSize: 34,
					fontWeight: 900,
					letterSpacing: 3,
					padding: '10px 20px',
					borderRadius: 14,
					opacity: Math.min(1, zero * 1.5),
					transform: `scale(${zero}) rotate(${-4 * zero}deg)`,
				}}
			>
				ALL GONE
			</div>

			<Marcus
				x={300}
				y={story.ground}
				scale={1.05}
				facing={1}
				seed={3}
				track={[
					{at: 0, pose: 'present', face: 'happy'},
					{at: t3000 - 4, pose: 'feed', face: 'joy', spring: 'snappy'},
					{at: t3000 + 14, pose: 'fist', face: 'happy'},
					{at: at[1], pose: ['idle', {head: -10}], face: 'curious'},
					{at: at[3], pose: 'worried', face: 'worried'},
					{at: tGone - 4, pose: 'shrug', face: {mouthCurve: -6, browTilt: -12, sweat: 0.6}},
				]}
			/>
			{fly < 1 && (
				<Paycheck
					w={300}
					amount={usd(FACTS.oldIncome.value)}
					style={{left: px - 150, top: py - 66, transform: `rotate(${mix(-8, 4, fly)}deg) scale(${mix(1, 0.55, fly)})`, opacity: kf(fly, [0.8, 1], [1, 0])}}
				/>
			)}

			<Sfx at={t3000 - 4} name="whoosh-soft" volume={0.4} />
			<Sfx at={t3000 + 10} name="cash" volume={0.5} />
			{at.map((a, i) => (
				<Sfx key={i} at={a} name="click" volume={0.3} />
			))}
			<Sfx at={tGone - 2} name="thud" volume={0.45} />
		</AbsoluteFill>
	);
};
