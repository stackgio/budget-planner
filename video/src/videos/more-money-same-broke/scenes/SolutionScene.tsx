import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleTag, Kicker} from '../props';
import {KineticText} from '../../../story/components/KineticText';

const L = story.safe.left;
const W = 1080 - story.safe.left - story.safe.right;
const RAISE = {y: 270, h: 72};
const SAVE_BAR = {y: 935, w: 690, h: 40};

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
 * The raise is one bar ("enjoy it ✓"); $500 of it splits off, turns green and
 * becomes a 12-month savings bar: $500 × 12 = $6,000 (plain savings, no returns).
 */
export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEnjoy = cue('L11', 'enjoying');
	const tSaving = cue('L12', 'saving');
	const tFive = cue('L12', 'five');
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

	const raiseIn = sp(frame, fps, 2, 'smooth');
	const enjoy = sp(frame, fps, tEnjoy - 4, 'bouncy');
	const split = sp(frame, fps, tSaving - 2, 'smooth');
	const gap = 16 * split;
	const five = sp(frame, fps, tFive - 2, 'bouncy');
	const times = sp(frame, fps, tEvery, 'snappy');
	const twelve = sp(frame, fps, tMonth, 'bouncy');
	const six = sp(frame, fps, tSix - 2, 'heavy');
	const months = prog(frame, tMonth + 4, tSix + 6 - (tMonth + 4), E.soft);
	const filled = Math.floor(months * 12 + 1e-6);
	const chips = [tSave, tInvest, tPay].map((t) => sp(frame, fps, t - 2, 'bouncy'));
	const note = sp(frame, fps, tYear, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ExampleTag style={{right: story.safe.right, top: story.safe.top + 8}} text="EXAMPLE · NOT INVESTED" />
			<Camera keys={[{at: 0, zoom: 1}]}>
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
							transform: `translateY(${-14 * kf(frame, [tSaving, tSaving + 8, tSaving + 22], [0, 1, 0])}px)`,
						}}
					/>
					<div style={{position: 'absolute', left: W * share + gap / 2, top: 0, height: RAISE.h, right: 0, borderRadius: `${split > 0.5 ? 18 : 0}px ${RAISE.h / 2}px ${RAISE.h / 2}px ${split > 0.5 ? 18 : 0}px`, background: P.gold}} />
					{/* enjoy-it badge */}
					<div style={{position: 'absolute', right: 26, top: 0, height: RAISE.h, display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 900, color: P.ink, letterSpacing: 2, opacity: Math.min(1, enjoy * 1.5), transform: `scale(${enjoy})`}}>
						✓ ENJOY IT
					</div>
				</div>
				{/* split labels */}
				<div style={{position: 'absolute', left: L, top: RAISE.y + RAISE.h + 18, width: W, display: 'flex', justifyContent: 'space-between', opacity: split}}>
					<Kicker color={P.accentDeep}>Save {usd(save)}</Kicker>
					<Kicker color={P.muted}>Spend {usd(rest)}</Kicker>
				</div>

				{/* L11: permission first */}
				<div style={{position: 'absolute', left: L, top: 520, opacity: 1 - prog(frame, tSaving - 8, 10, E.in)}}>
					<KineticText text="Enjoy it." at={tEnjoy - 8} exitAt={tSaving - 8} fontSize={150} color={P.ink} marker={{words: ['Enjoy'], color: 'rgba(226,167,46,0.35)', at: tEnjoy + 4}} />
				</div>
				{/* $500 × 12 */}
				<div style={{position: 'absolute', left: L, top: 470, display: 'flex', alignItems: 'baseline', gap: 26, fontWeight: 900, lineHeight: 1}}>
					<div style={{fontSize: 120, color: P.accent, letterSpacing: -4, opacity: Math.min(1, five * 1.4), transform: `scale(${0.7 + 0.3 * five})`, transformOrigin: '0 100%'}}>{usd(save)}</div>
					<div style={{fontSize: 40, color: P.muted, letterSpacing: 3, opacity: five * (1 - times)}}>/MONTH</div>
					<div style={{position: 'absolute', left: 330, bottom: 6, display: 'flex', alignItems: 'baseline', gap: 22, whiteSpace: 'nowrap'}}>
						<span style={{fontSize: 96, color: P.ink, opacity: times, transform: `translateY(${(1 - times) * 20}px)`, display: 'inline-block'}}>×</span>
						<span style={{fontSize: 120, color: P.ink, letterSpacing: -4, opacity: Math.min(1, twelve * 1.4), transform: `scale(${0.6 + 0.4 * twelve})`, display: 'inline-block', transformOrigin: '0 100%'}}>
							{FACTS.months.value}
						</span>
						<span style={{fontSize: 30, color: P.muted, letterSpacing: 3, opacity: twelve}}>MONTHS</span>
					</div>
				</div>
				{/* = $6,000 */}
				<div
					style={{
						position: 'absolute',
						left: L - 8,
						top: 610,
						display: 'flex',
						alignItems: 'center',
						gap: 20,
						fontWeight: 900,
						lineHeight: 1,
						opacity: Math.min(1, six * 1.6),
						transform: `scale(${1 + (1 - six) * 0.35})`,
						transformOrigin: '0 50%',
					}}
				>
					<span style={{fontSize: 120, color: P.muted}}>=</span>
					<span style={{fontSize: 210, color: P.accent, letterSpacing: -8}}>{usd(FACTS.yearSaved.value)}</span>
				</div>
				<Kicker color={P.muted} size={26} style={{position: 'absolute', left: L, top: 862, opacity: note}}>
					In one year · just saved, no returns
				</Kicker>

				{/* 12-month savings bar */}
				<div style={{position: 'absolute', left: L, top: SAVE_BAR.y, width: SAVE_BAR.w, height: SAVE_BAR.h, display: 'flex', gap: 6, opacity: twelve}}>
					{Array.from({length: 12}, (_, i) => (
						<div
							key={i}
							style={{
								flex: 1,
								borderRadius: 8,
								background: i < filled ? P.accent : P.line,
								transform: `scaleY(${i === filled - 1 ? 1 + 0.25 * kf(months * 12 - i, [0, 0.4, 1], [1, 1, 0]) : 1})`,
							}}
						/>
					))}
				</div>

				{/* what $6,000 could do */}
				<div style={{position: 'absolute', left: L, top: 1010, display: 'flex', gap: 14}}>
					{['Save', 'Invest', 'Pay off debt'].map((t, i) => (
						<div
							key={t}
							style={{
								fontSize: 34,
								fontWeight: 900,
								color: P.accentDeep,
								background: P.accentSoft,
								border: `3px solid ${P.accent}`,
								borderRadius: 18,
								padding: '12px 22px',
								opacity: Math.min(1, chips[i] * 1.5),
								transform: `translateY(${(1 - chips[i]) * 30}px) scale(${0.8 + 0.2 * chips[i]})`,
							}}
						>
							{t}
						</div>
					))}
				</div>

				<Marcus
					x={900}
					y={story.ground}
					scale={0.95}
					facing={-1}
					seed={7}
					frontProp={frame < tSaving + 6 ? <Coffee /> : undefined}
					track={[
						{at: 0, pose: ['hold', {fs: 60, fe: 70, bs: -14, be: -10}], face: 'happy'},
						{at: tEnjoy, pose: ['hold', {fs: 64, fe: 78, bs: -14, be: -10, head: -6}], face: 'smug'},
						{at: tSaving, pose: ['point', {fs: 140, head: -16}], face: 'curious', spring: 'snappy'},
						{at: tSix, pose: 'celebrate', face: 'joy', spring: 'bouncy'},
						{at: tSave - 4, pose: 'fist', face: 'determined'},
						{at: tPay, pose: ['point', {fs: 96, head: 4}], face: 'happy'},
					]}
				/>
			</Camera>
			<Sfx at={tEnjoy} name="pop" volume={0.3} />
			<Sfx at={tSaving} name="card" volume={0.4} />
			<Sfx at={tFive} name="coin" volume={0.35} />
			<Sfx at={tMonth} name="pop" volume={0.3} />
			<Sfx at={tSix} name="cash" volume={0.45} />
			<Sfx at={tSave - 2} name="click" volume={0.3} />
			<Sfx at={tInvest - 2} name="click" volume={0.3} />
			<Sfx at={tPay - 2} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
