import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {StepHeader, white as P} from '../ui';

const TICKERS = ['VOO', 'SPY', 'IVV', 'SPYM'] as const;
const COLS = 25;
const ROWS = FACTS.sp500Companies.value / COLS; // 20
const CELL = 24;
const GAP = 8;
const GRID_W = COLS * CELL + (COLS - 1) * GAP; // 800
const GRID_X = (1080 - GRID_W) / 2 - 24;
const GRID_Y = 640;
const APPLE = {c: 4, r: 3};
const MSFT = {c: 19, r: 6};
const cellXY = (c: number, r: number) => ({x: GRID_X + c * (CELL + GAP), y: GRID_Y + r * (CELL + GAP)});

/** S&P 500 explainer — four tickers, one index, ~500 companies in one purchase. */
export const Sp500Scene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tT = [cue('L11', 'VOO'), cue('L11', 'SPY'), cue('L11', 'IVV'), cue('L11', 'SPYM')];
	const tTrack = cue('L11', 'track');
	const t12 = cue('L12');
	const tList = cue('L12', 'list');
	const t500 = cue('L12', 'about');
	const tApple = cue('L12', 'Apple');
	const tMsft = cue('L12', 'Microsoft');
	const tOne = cue('L13', 'One');
	const tSingle = cue('L13', 'single');
	const t14 = cue('L14');
	const tFour = cue('L14', 'four');
	const tSame = cue('L14', 'same');
	const tVoo = cue('L15', 'VOO');

	const gridIn = kf(frame, [tList - 4, tList + 40], [0, 1], (t) => t);
	const basket = sp(frame, fps, tOne, 'heavy');
	const pick = sp(frame, fps, tVoo, 'bouncy');
	const allFour = sp(frame, fps, tTrack, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font, background: P.bg}}>
			<StepHeader palette={P} steps={[{at: -30, n: '05', label: 'PICK AN S&P 500 ETF'}]} />

			{/* ticker row */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: 300, display: 'flex', justifyContent: 'space-between'}}>
				{TICKERS.map((tk, i) => {
					const p = sp(frame, fps, tT[i] - 2, 'bouncy');
					const isVoo = tk === 'VOO';
					const pulse = frame >= tFour && frame < tVoo ? 1 + 0.06 * Math.max(0, Math.sin(((frame - tFour - i * 4) / 10) * Math.PI)) * (frame - tFour - i * 4 > 0 && frame - tFour - i * 4 < 10 ? 1 : 0) : 1;
					const dim = isVoo ? 1 : 1 - 0.65 * pick;
					return (
						<div key={tk} style={{position: 'relative', width: 196, opacity: Math.min(1, p * 1.5) * dim, transform: `translateY(${(1 - p) * 40}px) scale(${pulse * (isVoo ? 1 + 0.1 * pick : 1)})`}}>
							<div
								style={{
									height: 112,
									borderRadius: 24,
									background: isVoo && pick > 0.01 ? P.accent : P.ink,
									color: '#FFFFFF',
									fontSize: 54,
									fontWeight: 900,
									letterSpacing: 1,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{tk}
							</div>
							{isVoo && pick > 0.01 && (
								<div style={{position: 'absolute', left: 0, top: 124, whiteSpace: 'nowrap', fontSize: 26, fontWeight: 900, letterSpacing: 2, color: P.accentDeep, opacity: pick}}>GIO’S EXAMPLE</div>
							)}
						</div>
					);
				})}
			</div>

			{/* ALL FOUR TRACK THE S&P 500 */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 492, textAlign: 'center', fontSize: 44, fontWeight: 900, color: P.ink, opacity: allFour * (1 - 0.0 * pick), transform: `translateY(${(1 - allFour) * 20}px)`}}>
				ALL FOUR TRACK THE <span style={{color: P.accent}}>S&amp;P 500</span>
			</div>

			{/* 500-company grid */}
			<div style={{position: 'absolute', inset: 0, opacity: kf(frame, [t12 - 6, t12 + 6], [0, 1]) * (1 - 0.6 * pick)}}>
				{Array.from({length: ROWS * COLS}).map((_, i) => {
					const c = i % COLS;
					const r = Math.floor(i / COLS);
					const order = (r * 7 + c * 3) % 50 / 50;
					const vis = kf(gridIn, [order * 0.7, order * 0.7 + 0.3], [0, 1], (t) => t);
					const {x, y} = cellXY(c, r);
					const isA = c === APPLE.c && r === APPLE.r;
					const isM = c === MSFT.c && r === MSFT.r;
					const lit = (isA && frame >= tApple) || (isM && frame >= tMsft);
					const green = basket;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								width: CELL,
								height: CELL,
								borderRadius: 6,
								background: lit ? P.accent : green > 0.02 ? `rgba(22,163,74,${0.25 + 0.55 * green})` : '#C9CDD2',
								opacity: vis,
								transform: `scale(${(0.3 + 0.7 * vis) * (lit ? 1.5 : 1)})`,
							}}
						/>
					);
				})}
				{/* callouts: names only, no logos */}
				{[
					{t: tApple, label: 'APPLE', cell: APPLE, dx: -10, dy: -96},
					{t: tMsft, label: 'MICROSOFT', cell: MSFT, dx: -160, dy: -96},
				].map((k) => {
					const p = sp(frame, fps, k.t - 2, 'bouncy');
					if (p <= 0.01) return null;
					const {x, y} = cellXY(k.cell.c, k.cell.r);
					return (
						<div key={k.label} style={{position: 'absolute', left: x + k.dx, top: y + k.dy, opacity: Math.min(1, p * 1.5), transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: '20% 100%'}}>
							<div style={{padding: '10px 22px', borderRadius: 14, background: P.ink, color: '#FFF', fontSize: 38, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap'}}>{k.label}</div>
						</div>
					);
				})}
				{/* bracket: one ETF = one purchase */}
				<div
					style={{
						position: 'absolute',
						left: GRID_X - 24,
						top: GRID_Y - 24,
						width: GRID_W + 48,
						height: ROWS * (CELL + GAP) - GAP + 48,
						border: `8px solid ${P.accent}`,
						borderRadius: 28,
						opacity: basket,
						transform: `scale(${1.08 - 0.08 * basket})`,
					}}
				/>
			</div>

			{/* caption-free label under the grid */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1318, textAlign: 'center', fontSize: 40, fontWeight: 900, color: P.ink}}>
				<span style={{opacity: kf(frame, [t500, t500 + 8], [0, 1]) * (1 - kf(frame, [tOne - 6, tOne], [0, 1]))}}>
					<span style={{position: 'absolute', left: 0, right: 0}}>≈500 LARGE U.S. COMPANIES</span>
				</span>
				<span style={{opacity: kf(frame, [tSingle - 4, tSingle + 6], [0, 1]) * (1 - kf(frame, [t14 - 6, t14], [0, 1]))}}>
					<span style={{position: 'absolute', left: 0, right: 0, color: P.accentDeep}}>1 ETF · 1 PURCHASE</span>
				</span>
				<span style={{opacity: kf(frame, [tSame - 4, tSame + 6], [0, 1]) * (1 - pick)}}>
					<span style={{position: 'absolute', left: 0, right: 0}}>SAME INDEX · PICK ANY ONE</span>
				</span>
			</div>

			{tT.map((t, i) => (
				<Sfx key={i} at={t} name="pop" volume={0.22} />
			))}
			<Sfx at={tApple} name="tick" volume={0.3} />
			<Sfx at={tMsft} name="tick" volume={0.3} />
			<Sfx at={tOne} name="thud" volume={0.3} />
			<Sfx at={tVoo} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
