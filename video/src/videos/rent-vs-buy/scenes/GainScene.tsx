import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS, usdK} from '../facts';
import {white as P} from './shared';

/**
 * L18–L19 — BUY $300K → SELL $400K = $100K PRICE INCREASE (hero), then
 * INTEREST, REPAIRS, FEES come off it as they're named, and on "profit" the
 * label makes the distinction explicit: price increase ≠ profit. No profit
 * figure is shown because the script gives none.
 */
export const GainScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBuy = cue('L18', 'three hundred grand');
	const tSell = cue('L18', 'four hundred,');
	const tSellEnd = cue('L18', 'hundred,', 0, 'end');
	const tInt = cue('L18', 'interest,');
	const tRep = cue('L19', 'repairs,');
	const tFees = cue('L19', 'fees');
	const tProfit = cue('L19', 'profit.');
	const buy = sp(frame, fps, tBuy - 3, 'snappy');
	const sell = sp(frame, fps, tSell - 3, 'snappy');
	const hero = sp(frame, fps, tSellEnd - 2, 'heavy');
	const count = prog(frame, tSellEnd - 2, 16, E.out);
	const kInc = FACTS.priceIncrease.value / 1000;
	const chips: [string, number][] = [
		['INTEREST', tInt],
		['REPAIRS', tRep],
		['FEES', tFees],
	];
	const notProfit = sp(frame, fps, tProfit - 3, 'bouncy');
	return (
		<AbsoluteFill style={{fontFamily: story.font, background: P.bg}}>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
				<div style={{opacity: buy, transform: `translateY(${(1 - buy) * 20}px)`, textAlign: 'center'}}>
					<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 5, color: P.muted}}>BUY</div>
					<div style={{fontSize: 96, fontWeight: 900, letterSpacing: -2, color: P.ink}}>{usdK(FACTS.buyPrice.value)}</div>
				</div>
				<div style={{fontSize: 80, fontWeight: 900, color: P.muted, opacity: sell}}>→</div>
				<div style={{opacity: sell, transform: `translateY(${(1 - sell) * 20}px)`, textAlign: 'center'}}>
					<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 5, color: P.muted}}>SELL</div>
					<div style={{fontSize: 96, fontWeight: 900, letterSpacing: -2, color: P.ink}}>{usdK(FACTS.sellPrice.value)}</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 5, color: P.muted, opacity: buy * 0.9}}>EXAMPLE</div>
			{frame >= tSellEnd - 4 && (
				<div style={{position: 'absolute', left: 0, right: story.safe.right - story.safe.left, top: 470, textAlign: 'center', transform: `scale(${1 + (1 - hero) * 0.4})`, opacity: Math.min(1, hero * 2)}}>
					<NumberCounter value={kInc * count} prefix="$" suffix="K" fontSize={230} color={P.accent} style={{letterSpacing: -6}} />
					<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 6}}>
						<div style={{fontSize: 64, fontWeight: 900, letterSpacing: 1, color: P.ink}}>PRICE INCREASE</div>
						<div style={{opacity: notProfit, transform: `scale(${0.5 + 0.5 * notProfit})`, background: P.danger, color: '#fff', borderRadius: 16, padding: '6px 18px', fontSize: 52, fontWeight: 900, letterSpacing: 1}}>≠ PROFIT</div>
					</div>
				</div>
			)}
			<div style={{position: 'absolute', left: 140, top: 920}}>
				{chips.map(([label, t], i) => {
					const p = sp(frame, fps, t - 3, 'snappy');
					return (
						<div key={label} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 26, opacity: p, transform: `translateX(${(1 - p) * -60}px)`}}>
							<div style={{width: 76, height: 76, borderRadius: 38, background: P.dangerSoft, color: P.danger, fontSize: 64, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>−</div>
							<div style={{fontSize: 72, fontWeight: 900, letterSpacing: 1, color: P.ink}}>{label}</div>
						</div>
					);
				})}
			</div>
			<Sfx at={tSellEnd} name="cash" volume={0.3} />
			{chips.map(([label, t]) => (
				<Sfx key={label} at={t - 3} name="tick" volume={0.25} />
			))}
			<Sfx at={tProfit - 3} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};
