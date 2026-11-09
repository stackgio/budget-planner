import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp, wobble} from '../../../story/lib/motion';
import {BrandBg, FONT, L, P, StepTag} from '../ui';
import {CLUSTER, SCATTER, TICKERS, TickerTile} from './tickers';

/**
 * 04 · WHAT TO BUY — the curiosity beat. Single-stock tickers drift in around
 * the question; Apple / NVIDIA light up when named; on "ETFs" they snap into
 * a tidy cluster that the next scene drops into the basket.
 */
export const StuckScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhat = cue('L14', 'What');
	const tApple = cue('L15', 'Apple');
	const tNvda = cue('L15', 'NVIDIA');
	const tEtf = cue('L15', 'ETFs', -0.25);
	const gather = kf(frame, [tEtf, tEtf + 18], [0, 1], E.inOut);
	const qOut = tEtf - 4;
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={700} />
			<StepTag n="04" label="WHAT TO BUY" at={2} style={{left: L, top: 190}} />
			{/* the question */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center'}}>
				<KineticText text="WHAT DO I BUY?" at={8} mode="pop" exitAt={qOut} fontSize={150} color={P.ink} colors={{'buy?': P.accent, buy: P.accent}} align="center" stagger={4} style={{width: 900}} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center'}}>
				<KineticText text="START WITH ETFs" at={tEtf + 6} fontSize={118} color={P.ink} colors={{etfs: P.accent}} align="center" style={{width: 900}} />
			</div>
			{/* tickers */}
			{TICKERS.map((t, i) => {
				const appear = sp(frame, fps, tWhat - 4 + i * 3, 'bouncy');
				const [sx, sy, sr] = SCATTER[t];
				const [cx, cy] = CLUSTER[t];
				const fx = sx + wobble(frame, i * 7, 0.6, 8) * (1 - gather);
				const fy = sy + wobble(frame, i * 13 + 3, 0.5, 10) * (1 - gather) + (1 - appear) * 80;
				const hiA = t === 'AAPL' ? kf(frame, [tApple - 3, tApple + 4, tNvda, tNvda + 6], [0, 1, 1, 0.25]) : 0;
				const hiN = t === 'NVDA' ? kf(frame, [tNvda - 3, tNvda + 4, tEtf - 6, tEtf], [0, 1, 1, 0]) : 0;
				const hi = (hiA + hiN) * (1 - gather);
				const dim = kf(frame, [tApple - 3, tApple + 4], [0, 1]) * (t === 'AAPL' || t === 'NVDA' ? 0 : 1) * (1 - gather);
				return <TickerTile key={t} t={t} x={mix(fx, cx, gather)} y={mix(fy, cy, gather)} rot={sr * (1 - gather)} hi={hi} dim={dim} opacity={Math.min(1, appear * 1.5)} />;
			})}
			<Sfx at={tWhat} name="pop" volume={0.28} />
			<Sfx at={tApple} name="tick" volume={0.22} />
			<Sfx at={tNvda} name="tick" volume={0.22} />
			<Sfx at={tEtf} name="whoosh-soft" volume={0.25} />
		</AbsoluteFill>
	);
};
