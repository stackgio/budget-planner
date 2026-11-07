import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleTag, Kicker} from '../props';

const L = story.safe.left;
const W = 1080 - story.safe.left - story.safe.right;
const RAISE = {y: 270, h: 72};
const GRID = {y: 610, cols: 4, rows: 3, gap: 12, h: 92};

const Coffee: React.FC = () => (
	<g transform="translate(-4,-46)">
		<path d="M-16,0H22L18,46H-12Z" fill="#FFFDF8" stroke="#121316" strokeWidth={5} strokeLinejoin="round" />
		<rect x={-18} y={-8} width={42} height={10} rx={4} fill="#121316" />
		<rect x={-13} y={16} width={30} height={12} fill="#1E9E57" />
	</g>
);

/**
 * THE SOLUTION — "And look, there's nothing wrong with enjoying your money.
 * But imagine saving just $500 of that raise every month. That's $6,000 in one year…"
 * L11: permission ("Enjoy it."). On "But" the raise bar splits at once; on
 * "saving" the $500/month lands. On "every month" twelve $500 blocks fill a
 * 4×3 grid, and on "six thousand" the total slams in: = $6,000.
 * Plain savings: labelled "saved, not invested · no returns".
 */
export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEnjoy = cue('L11', 'enjoying');
	const tBut = cue('L12', 'But');
	const tSaving = cue('L12', 'saving');
	const tEvery = cue('L12', 'every');
	const tMonth = cue('L12', 'month');
	const tSix = cue('L13', 'six');
	const tYear = cue('L13', 'year');
	const tSave = cue('L13', 'save');
	const tInvest = cue('L13', 'invest');
	const tPay = cue('L13', 'pay');

	const save = FACTS.savePerMonth.value;
	const rest = FACTS.raise.value - save;
	const share = save / FACTS.raise.value;
	const n = FACTS.months.value;

	const raiseIn = sp(frame, fps, 2, 'smooth');
	const enjoy = sp(frame, fps, tEnjoy - 4, 'bouncy');
	const split = sp(frame, fps, tBut - 4, 'smooth');
	const gap = 16 * split;
	const five = sp(frame, fps, tSaving - 2, 'bouncy');
	const times = sp(frame, fps, tEvery - 2, 'snappy');
	const six = sp(frame, fps, tSix - 2, 'heavy');
	// twelve months fill between "every month" and "six thousand"
	const fill = prog(frame, tEvery, tSix - 2 - tEvery, E.soft);
	const filled = fill * n;
	const chips = [tSave, tInvest, tPay].map((t) => sp(frame, fps, t - 2, 'bouncy'));
	const note = sp(frame, fps, tYear - 4, 'snappy');
	const merge = kf(frame, [tSix - 2, tSix + 6, tSix + 20], [0, 1, 0]);
	// Marcus enjoys his coffee, then steps out so the math owns the frame
	const walk = prog(frame, tBut, 34, E.in);

	const cellW = (W - GRID.gap * (GRID.cols - 1)) / GRID.cols;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ExampleTag style={{right: story.safe.right, top: story.safe.top + 8}} />

			{/* the raise, as one bar that splits */}
			<Kicker style={{position: 'absolute', left: L, top: RAISE.y - 56, opacity: raiseIn}}>Your {usd(FACTS.raise.value)} raise</Kicker>
			<div style={{position: 'absolute', left: L, top: RAISE.y, width: W, height: RAISE.h, opacity: raiseIn, transform: `scaleX(${0.6 + 0.4 * raiseIn})`, transformOrigin: '0 50%'}}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						height: RAISE.h,
						width: W * share - gap / 2,
						borderRadius: `${RAISE.h / 2}px ${split > 0.5 ? 18 : 0}px ${split > 0.5 ? 18 : 0}px ${RAISE.h / 2}px`,
						background: split > 0.02 ? `color-mix(in srgb, ${P.accent} ${split * 100}%, ${P.gold})` : P.gold,
						transform: `translateY(${-14 * kf(frame, [tBut, tBut + 8, tBut + 22], [0, 1, 0])}px)`,
					}}
				/>
				<div style={{position: 'absolute', left: W * share + gap / 2, top: 0, height: RAISE.h, right: 0, borderRadius: `${split > 0.5 ? 18 : 0}px ${RAISE.h / 2}px ${RAISE.h / 2}px ${split > 0.5 ? 18 : 0}px`, background: P.gold}} />
				<div style={{position: 'absolute', right: 26, top: 0, height: RAISE.h, display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 900, color: P.ink, letterSpacing: 2, opacity: Math.min(1, enjoy * 1.5), transform: `scale(${enjoy})`}}>✓ ENJOY IT</div>
			</div>
			<div style={{position: 'absolute', left: L, top: RAISE.y + RAISE.h + 18, width: W, display: 'flex', justifyContent: 'space-between', opacity: split}}>
				<Kicker color={P.accentDeep} size={32}>Save {usd(save)}</Kicker>
				<Kicker color={P.muted} size={32}>Spend {usd(rest)}</Kicker>
			</div>

			{/* L11: permission first */}
			<div style={{position: 'absolute', left: L, top: 520, opacity: 1 - prog(frame, tBut - 8, 10, E.in)}}>
				<KineticText text="Enjoy it." at={tEnjoy - 8} fontSize={150} color={P.ink} marker={{words: ['Enjoy'], color: 'rgba(226,167,46,0.35)', at: tEnjoy + 4}} />
			</div>

			{/* $500 × 12 MONTHS */}
			<div style={{position: 'absolute', left: L, top: 450, height: 130, width: W}}>
				<div style={{position: 'absolute', left: 0, bottom: 0, fontSize: 130, fontWeight: 900, lineHeight: 1, color: P.accent, letterSpacing: -4, opacity: Math.min(1, five * 1.4), transform: `scale(${0.7 + 0.3 * five})`, transformOrigin: '0 100%'}}>{usd(save)}</div>
				<div style={{position: 'absolute', left: 430, bottom: 14, fontSize: 40, fontWeight: 900, color: P.muted, letterSpacing: 3, opacity: five * (1 - times)}}>/ MONTH</div>
				<div style={{position: 'absolute', left: 420, bottom: 0, display: 'flex', alignItems: 'baseline', gap: 20, whiteSpace: 'nowrap', fontWeight: 900, lineHeight: 1}}>
					<span style={{fontSize: 100, color: P.ink, opacity: times, transform: `translateY(${(1 - times) * 20}px)`, display: 'inline-block'}}>×</span>
					<span style={{fontSize: 130, color: P.ink, letterSpacing: -4, opacity: times, transform: `scale(${0.6 + 0.4 * times})`, display: 'inline-block', transformOrigin: '0 100%'}}>{n}</span>
					<span style={{fontSize: 38, color: P.muted, letterSpacing: 3, opacity: times}}>MONTHS</span>
				</div>
			</div>

			{/* twelve $500 blocks */}
			<div style={{position: 'absolute', left: L, top: GRID.y, width: W, transform: `scale(${1 - 0.03 * merge})`, transformOrigin: '50% 100%'}}>
				{Array.from({length: n}, (_, i) => {
					const p = Math.max(0, Math.min(1, filled - i));
					const show = sp(frame, fps, tEvery - 4 + i, 'snappy');
					const c = i % GRID.cols;
					const r = Math.floor(i / GRID.cols);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: c * (cellW + GRID.gap),
								top: r * (GRID.h + GRID.gap),
								width: cellW,
								height: GRID.h,
								borderRadius: 18,
								background: p > 0.5 ? P.accent : P.paper,
								border: `3px solid ${p > 0.5 ? P.accent : P.line}`,
								boxSizing: 'border-box',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 40,
								fontWeight: 900,
								color: p > 0.5 ? '#fff' : P.muted,
								opacity: show,
								transform: `scale(${(0.85 + 0.15 * show) * (p > 0.5 && p < 1 ? 1.06 : 1)})`,
							}}
						>
							{p > 0.5 ? usd(save) : `MO ${i + 1}`}
						</div>
					);
				})}
			</div>

			{/* = $6,000 — the payoff */}
			<div
				style={{
					position: 'absolute',
					left: L - 6,
					top: 935,
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					fontWeight: 900,
					lineHeight: 1,
					opacity: Math.min(1, six * 1.6),
					transform: `scale(${1 + (1 - six) * 0.35})`,
					transformOrigin: '0 50%',
				}}
			>
				<span style={{fontSize: 120, color: P.muted}}>=</span>
				<span style={{fontSize: 205, color: P.accent, letterSpacing: -8}}>{usd(FACTS.yearSaved.value)}</span>
			</div>
			<Kicker color={P.ink} size={32} style={{position: 'absolute', left: L, top: 1180, opacity: note}}>
				Saved, not invested · no returns
			</Kicker>

			{/* what $6,000 could do */}
			<div style={{position: 'absolute', left: L, top: 1250, display: 'flex', gap: 14}}>
				{['Save', 'Invest', 'Pay off debt'].map((t, i) => (
					<div
						key={t}
						style={{
							fontSize: 36,
							fontWeight: 900,
							color: P.accentDeep,
							background: P.accentSoft,
							border: `3px solid ${P.accent}`,
							borderRadius: 18,
							padding: '10px 22px',
							opacity: Math.min(1, chips[i] * 1.5),
							transform: `translateY(${(1 - chips[i]) * 30}px) scale(${0.8 + 0.2 * chips[i]})`,
						}}
					>
						{t}
					</div>
				))}
			</div>

			{walk < 1 && (
				<Marcus
					x={mix(880, 1260, walk)}
					y={story.ground}
					scale={0.95}
					facing={walk > 0 ? 1 : -1}
					seed={7}
					frontProp={<Coffee />}
					track={[
						{at: 0, pose: ['hold', {fs: 60, fe: 70, bs: -14, be: -10}], face: 'happy'},
						{at: tEnjoy, pose: ['hold', {fs: 64, fe: 78, bs: -14, be: -10, head: -6}], face: 'smug'},
						{at: tBut, pose: 'walk', face: 'happy', cycle: 'walk'},
					]}
				/>
			)}

			<Sfx at={tEnjoy} name="pop" volume={0.3} />
			<Sfx at={tBut - 2} name="card" volume={0.4} />
			<Sfx at={tSaving} name="coin" volume={0.35} />
			<Sfx at={tEvery} name="tick" volume={0.3} />
			<Sfx at={tMonth} name="tick" volume={0.3} />
			<Sfx at={tSix} name="cash" volume={0.45} />
			<Sfx at={tSave - 2} name="click" volume={0.3} />
			<Sfx at={tInvest - 2} name="click" volume={0.3} />
			<Sfx at={tPay - 2} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
