import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {BrandBg, FONT, L, P, Pill, useIn} from '../ui';

const COLS = 25;
const ROWS = 20; // 25 × 20 = 500 dots, one per (approximate) company

/** VOO — what I personally own; ~500 large U.S. companies (not the whole world). */
export const VooScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tVoo = cue('L17', 'VOO', -0.15);
	const tTracks = cue('L18', 'tracks');
	const tExposure = cue('L18', 'exposure');
	const tCompanies = cue('L18', 'companies', 0, 'end');
	const tAround = cue('L18', 'around');
	const vooP = sp(frame, fps, tVoo, 'heavy');
	const gridIn = kf(frame, [tTracks, tTracks + 20], [0, 1], E.out);
	const fill = kf(frame, [tAround - 4, tCompanies], [0, 1], E.inOut);
	const n = Math.round(fill * FACTS.sp500Companies.value);
	const pitch = 26;
	const gx = (1080 - COLS * pitch) / 2;
	const gy = 735;
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={380} glow={0.6 + vooP * 0.8} />
			<div style={{position: 'absolute', left: L, top: 190, ...inn(4)}}>
				<Pill size={26}>
					<span style={{color: P.accent}}>●</span> My holding · not a recommendation
				</Pill>
			</div>
			<div
				style={{
					position: 'absolute',
					left: L - 8,
					top: 270,
					fontSize: 250,
					fontWeight: 900,
					letterSpacing: -10,
					lineHeight: 1,
					color: P.accent,
					opacity: Math.min(1, vooP * 1.6),
					transform: `scale(${1.25 - 0.25 * vooP})`,
					transformOrigin: '0% 60%',
					filter: vooP < 0.6 ? `blur(${(0.6 - vooP) * 16}px)` : undefined,
				}}
			>
				VOO
			</div>
			<div style={{position: 'absolute', left: L, top: 540, fontSize: 56, fontWeight: 900, color: P.ink, letterSpacing: -1, ...inn(tVoo + 8)}}>Vanguard S&amp;P 500 ETF</div>
			<div style={{position: 'absolute', left: L, top: 622, fontSize: 36, fontWeight: 700, color: P.body, ...inn(tTracks)}}>
				Tracks the <span style={{color: P.accent, fontWeight: 900}}>S&amp;P 500</span> index
			</div>
			{/* 500 dots */}
			<svg width={1080} height={700} style={{position: 'absolute', left: 0, top: gy}}>
				{Array.from({length: COLS * ROWS}).map((_, i) => {
					const c = i % COLS;
					const r = Math.floor(i / COLS);
					const order = r * COLS + c;
					const appear = kf(frame - (c + r) * 0.35, [tTracks, tTracks + 10], [0, 1]);
					const lit = order < n;
					return <circle key={i} cx={gx + c * pitch + pitch / 2} cy={r * pitch + pitch / 2} r={lit ? 9 : 6} fill={lit ? P.accent : '#26302A'} opacity={appear * gridIn} />;
				})}
			</svg>
			<div style={{position: 'absolute', left: L, right: 120, top: 1270, display: 'flex', alignItems: 'baseline', gap: 18, ...inn(tExposure)}}>
				<span style={{fontSize: 36, fontWeight: 800, color: P.body, letterSpacing: 2}}>EXPOSURE TO ~</span>
				<NumberCounter value={n} prefix="" fontSize={64} color={P.accent} roll={false} />
				<span style={{fontSize: 36, fontWeight: 800, color: P.body, letterSpacing: 2}}>COMPANIES</span>
			</div>
			<div style={{position: 'absolute', left: L, right: 120, top: 1360, fontSize: 26, fontWeight: 700, color: P.body, opacity: kf(frame, [tCompanies, tCompanies + 12], [0, 1])}}>
				Large U.S. companies — not the whole global market
			</div>
			<Sfx at={tVoo} name="thud" volume={0.25} />
			<Sfx at={tAround} name="tick" volume={0.2} />
		</AbsoluteFill>
	);
};
