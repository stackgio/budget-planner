import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {FACTS, tenDollarFractionPct} from '../facts';
import {BrandBg, FONT, L, Label, Num, P, useIn} from '../ui';

/**
 * FRACTIONAL SHARES — one VOO share (at the price in my recording) split into
 * 100 pieces; $10 lights ≈1.5 of them. Computed, not typed.
 */
export const FractionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tCool = cue('L19', 'cool');
	const tNeed = cue('L19', 'need');
	const tDollars = cue('L19', 'dollars');
	const tHundreds = cue('L19', 'hundreds');
	const block = sp(frame, fps, 4, 'heavy');
	const price = kf(frame, [tCool, tCool + 10], [0, 1], E.out);
	const split = kf(frame, [tNeed, tNeed + 16], [0, 1], E.out);
	const fill = kf(frame, [tHundreds, tHundreds + 14], [0, 1], E.out) * tenDollarFractionPct; // cells (of 100)
	const S = 560;
	const cell = S / 10;
	const bx = (1080 - S) / 2;
	const by = 590;
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={850} />
			<div style={{position: 'absolute', left: L, top: 190, right: 120}}>
				<KineticText text="YOU DON'T NEED A FULL SHARE" at={tCool - 6} fontSize={90} color={P.ink} colors={{full: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: bx, width: S, top: by - 74, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...inn(6)}}>
				<Label color={P.body} size={28}>1 VOO share</Label>
				<Num value={FACTS.vooMarketPrice.value} p={1} decimals={2} prefix="$" size={44} color={P.ink} style={{opacity: price}} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: bx,
					top: by,
					width: S,
					height: S,
					borderRadius: 28,
					background: P.paper,
					border: `4px solid #2C3630`,
					overflow: 'hidden',
					transform: `scale(${0.8 + 0.2 * block})`,
					opacity: Math.min(1, block * 1.5),
				}}
			>
				<svg width={S} height={S} style={{position: 'absolute', inset: 0}}>
					{Array.from({length: 100}).map((_, i) => {
						const c = i % 10;
						const r = Math.floor(i / 10);
						const f = Math.max(0, Math.min(1, fill - i));
						return (
							<g key={i}>
								{f > 0 && <rect x={c * cell} y={r * cell} width={cell * f} height={cell} fill={P.accent} />}
							</g>
						);
					})}
					{Array.from({length: 9}).map((_, i) => (
						<g key={`l${i}`} opacity={split}>
							<line x1={(i + 1) * cell} y1={0} x2={(i + 1) * cell} y2={S * split} stroke="#2C3630" strokeWidth={2} />
							<line x1={0} y1={(i + 1) * cell} x2={S * split} y2={(i + 1) * cell} stroke="#2C3630" strokeWidth={2} />
						</g>
					))}
				</svg>
			</div>
			{/* callout for the lit sliver */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={`M ${bx + cell} ${by + cell + 6} C ${bx + cell + 10} ${by + S + 40}, ${bx + 40} ${by + S + 30}, ${bx + 30} ${by + S + 78}`} fill="none" stroke={P.accent} strokeWidth={4} strokeDasharray="600" strokeDashoffset={600 * (1 - kf(frame, [tHundreds + 8, tHundreds + 22], [0, 1]))} strokeLinecap="round" />
			</svg>
			<div style={{position: 'absolute', left: bx, top: by + S + 90, display: 'flex', alignItems: 'baseline', gap: 16, ...inn(tDollars - 4, 'bouncy')}}>
				<span style={{fontSize: 64, fontWeight: 900, color: P.accent}}>$10</span>
				<span style={{fontSize: 44, fontWeight: 900, color: P.ink}}>≈ {tenDollarFractionPct.toFixed(1)}% of a share</span>
			</div>
			<div style={{position: 'absolute', left: bx, right: 120, top: by + S + 178, fontSize: 25, fontWeight: 700, color: P.muted, ...inn(tDollars + 6, 'smooth', 10)}}>
				At the price in my recording — varies as price moves
			</div>
			<Sfx at={tNeed} name="tick" volume={0.2} />
			<Sfx at={tHundreds + 4} name="pop" volume={0.28} />
		</AbsoluteFill>
	);
};
