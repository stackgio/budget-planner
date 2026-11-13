import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {StepHeader, white as P} from '../ui';

const FUNDS = [
	{tk: 'VOO', issuer: 'VANGUARD', er: FACTS.erVOO.value},
	{tk: 'SPY', issuer: 'STATE STREET', er: FACTS.erSPY.value},
	{tk: 'IVV', issuer: 'iSHARES', er: FACTS.erIVV.value},
	{tk: 'SPYM', issuer: 'STATE STREET', er: FACTS.erSPYM.value},
] as const;

const COLS = 25;
const ROWS = FACTS.sp500Companies.value / COLS; // 20
const CELL = 26;
const GAP = 7;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;
const GRID_X = (1080 - GRID_W) / 2 - 24;
const GRID_Y = 560;
const APPLE = {c: 3, r: 2};
const MSFT = {c: 20, r: 5};
const cellXY = (c: number, r: number) => ({x: GRID_X + c * (CELL + GAP), y: GRID_Y + r * (CELL + GAP)});
const ETF_CARD = {x: 540, y: 880};

const pct = (v: number) => `${v}%`;

/**
 * S&P 500 explainer in five distinct beats:
 * A tickers (2×2 cards) → B the index (≈500 companies, Apple + Microsoft)
 * → C one ETF = one purchase → D same index, different funds (expense ratios) → E VOO picked.
 */
export const Sp500Scene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tT = [cue('L11', 'VOO'), cue('L11', 'SPY'), cue('L11', 'IVV'), cue('L11', 'SPYM')];
	const tTrack = cue('L11', 'track');
	const t12 = cue('L12');
	const tList = cue('L12', 'list');
	const tAbout = cue('L12', 'about');
	const tApple = cue('L12', 'Apple');
	const tMsft = cue('L12', 'Microsoft');
	const t13 = cue('L13');
	const tSingle = cue('L13', 'single');
	const t14 = cue('L14');
	const tSame = cue('L14', 'same');
	const tVoo = cue('L15', 'VOO');

	// phase envelopes
	const aOut = kf(frame, [t12 - 8, t12 + 6], [0, 1], E.inOut);
	const bIn = kf(frame, [t12 - 4, t12 + 10], [0, 1], E.out);
	const collapse = kf(frame, [t13 - 2, t13 + 26], [0, 1], E.inOut);
	const cIn = sp(frame, fps, t13 + 4, 'bouncy');
	const cOut = kf(frame, [t14 - 8, t14 + 4], [0, 1]);
	const dIn = sp(frame, fps, t14 - 2, 'snappy');
	const pick = sp(frame, fps, tVoo, 'bouncy');

	// A — 2×2 ticker cards
	const cardsA = FUNDS.map((f, i) => {
		const p = sp(frame, fps, tT[i] - 3, 'bouncy');
		const col = i % 2;
		const row = Math.floor(i / 2);
		return {f, p, x: 120 + col * 440, y: 330 + row * 300};
	});
	const trackP = sp(frame, fps, tTrack - 2, 'snappy');

	const gridIn = kf(frame, [t12 - 2, t12 + 44], [0, 1], (t) => t);
	void tList;
	// slow continuous drift so no beat sits still
	const drift = 1 + 0.03 * Math.min(1, frame / 750);
	const count = Math.round(FACTS.sp500Companies.value * kf(collapse, [0.05, 0.95], [0, 1]));

	return (
		<AbsoluteFill style={{fontFamily: story.font, background: P.bg}}>
			<StepHeader palette={P} steps={[{at: -30, n: '05', label: 'PICK AN S&P 500 ETF'}, {at: t14 - 2, n: '05', label: 'SAME INDEX · DIFFERENT FUNDS'}]} />

			<div style={{position: 'absolute', inset: 0, transform: `scale(${drift})`, transformOrigin: '50% 45%'}}>
			{/* ───── A · four ticker cards ───── */}
			{aOut < 1 && (
				<div style={{position: 'absolute', inset: 0, opacity: 1 - aOut, transform: `translateY(${-aOut * 60}px)`}}>
					{cardsA.map(({f, p, x, y}) => (
						<div
							key={f.tk}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								width: 400,
								height: 260,
								borderRadius: 32,
								background: P.ink,
								color: '#FFF',
								opacity: Math.min(1, p * 1.5),
								transform: `translateY(${(1 - p) * 50}px) scale(${0.85 + 0.15 * p})`,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								paddingLeft: 40,
								boxSizing: 'border-box',
								boxShadow: '0 24px 50px rgba(0,0,0,0.18)',
							}}
						>
							<div style={{fontSize: 108, fontWeight: 900, letterSpacing: -1, lineHeight: 1}}>{f.tk}</div>
							<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: '#9AA0A8', marginTop: 14}}>{f.issuer}</div>
						</div>
					))}
					{/* converge on the index */}
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						{cardsA.map(({x, y}, i) => {
							const sx = x + 200;
							const sy = y + 260;
							const ex = 540;
							const ey = 1070;
							const d = kf(trackP, [i * 0.08, 0.6 + i * 0.08], [0, 1]);
							return <line key={i} x1={sx} y1={sy} x2={mix(sx, ex, d)} y2={mix(sy, ey, d)} stroke={P.accent} strokeWidth={6} strokeLinecap="round" opacity={trackP} />;
						})}
					</svg>
					<div style={{position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', justifyContent: 'center', opacity: trackP, transform: `scale(${0.7 + 0.3 * trackP})`}}>
						<div style={{padding: '22px 44px', borderRadius: 999, background: P.accent, color: '#FFF', fontSize: 52, fontWeight: 900, letterSpacing: 1}}>ALL TRACK THE S&amp;P 500</div>
					</div>
				</div>
			)}

			{/* ───── B · the index: ≈500 leading companies ───── */}
			{bIn > 0 && cOut < 1 && (
				<div style={{position: 'absolute', inset: 0, opacity: bIn * (1 - cOut)}}>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 320, opacity: 1 - collapse}}>
						<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -2, color: P.ink, lineHeight: 1}}>
							S&amp;P <span style={{color: P.accent}}>500</span>
						</div>
						<div style={{fontSize: 38, fontWeight: 800, color: P.body, marginTop: 14, opacity: kf(frame, [tAbout - 4, tAbout + 8], [0, 1])}}>≈500 LEADING U.S. COMPANIES</div>
					</div>
					{Array.from({length: ROWS * COLS}).map((_, i) => {
						const c = i % COLS;
						const r = Math.floor(i / COLS);
						const order = ((r * 7 + c * 3) % 50) / 50;
						const vis = kf(gridIn, [order * 0.7, order * 0.7 + 0.3], [0, 1], (t) => t);
						const {x, y} = cellXY(c, r);
						const isA = c === APPLE.c && r === APPLE.r;
						const isM = c === MSFT.c && r === MSFT.r;
						const lit = (isA && frame >= tApple - 2) || (isM && frame >= tMsft - 2);
						// C: every company flies into the single ETF card
						const delay = (order * 0.5 + (r / ROWS) * 0.3) * 0.6;
						const cp = kf(collapse, [delay, delay + 0.4], [0, 1], E.inOut);
						const px = mix(x, ETF_CARD.x - CELL / 2, cp);
						const py = mix(y, ETF_CARD.y - CELL / 2, cp);
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: px,
									top: py,
									width: CELL,
									height: CELL,
									borderRadius: 7,
									background: lit || cp > 0 ? P.accent : '#CDD1D6',
									opacity: vis * (1 - kf(cp, [0.85, 1], [0, 1])),
									transform: `scale(${(0.3 + 0.7 * vis) * (lit && cp === 0 ? 1.45 : 1) * (1 - 0.5 * cp)})`,
								}}
							/>
						);
					})}
					{[
						{t: tApple, label: 'APPLE', cell: APPLE, dx: -8, dy: -84},
						{t: tMsft, label: 'MICROSOFT', cell: MSFT, dx: -190, dy: -84},
					].map((k) => {
						const p = sp(frame, fps, k.t - 2, 'bouncy');
						if (p <= 0.01) return null;
						const {x, y} = cellXY(k.cell.c, k.cell.r);
						return (
							<div key={k.label} style={{position: 'absolute', left: x + k.dx, top: y + k.dy, opacity: Math.min(1, p * 1.5) * (1 - collapse), transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: '20% 100%'}}>
								<div style={{padding: '10px 24px', borderRadius: 16, background: P.ink, color: '#FFF', fontSize: 42, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap'}}>{k.label}</div>
							</div>
						);
					})}
					<div style={{position: 'absolute', left: 0, right: 0, top: GRID_Y + ROWS * (CELL + GAP) + 18, textAlign: 'center', fontSize: 26, fontWeight: 700, letterSpacing: 2, color: P.muted, opacity: gridIn * (1 - collapse)}}>
						1 SQUARE = 1 COMPANY
					</div>
					{/* C — one ETF, one purchase */}
					{cIn > 0.01 && (
						<div style={{position: 'absolute', left: ETF_CARD.x - 300, top: ETF_CARD.y - 190, width: 600, height: 380, borderRadius: 40, background: P.ink, color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.5 + 0.5 * cIn})`, opacity: Math.min(1, cIn * 1.4), boxShadow: '0 30px 60px rgba(0,0,0,0.25)'}}>
							<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 4, color: '#9AA0A8'}}>ONE S&amp;P 500 ETF</div>
							<div style={{fontSize: 120, fontWeight: 900, color: P.accent, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>≈{count}</div>
							<div style={{fontSize: 34, fontWeight: 800, letterSpacing: 2}}>COMPANIES</div>
						</div>
					)}
					<div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontSize: 58, fontWeight: 900, color: P.ink, opacity: kf(frame, [tSingle - 4, tSingle + 6], [0, 1])}}>
						ONE <span style={{color: P.accent}}>PURCHASE</span>
					</div>
				</div>
			)}

			{/* ───── D · same index, different funds ───── */}
			{dIn > 0.01 && (
				<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, dIn * 1.3)}}>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 330, display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 800, letterSpacing: 3, color: P.muted}}>
						<span>FUND</span>
						<span>EXPENSE RATIO</span>
					</div>
					{FUNDS.map((f, i) => {
						const p = sp(frame, fps, t14 - 2 + i * 4, 'snappy');
						const isVoo = f.tk === 'VOO';
						const dim = isVoo ? 1 : 1 - 0.6 * pick;
						return (
							<div
								key={f.tk}
								style={{
									position: 'absolute',
									left: story.safe.left,
									right: story.safe.right - 40,
									top: 390 + i * 172,
									height: 148,
									borderRadius: 28,
									background: isVoo && pick > 0.01 ? P.accent : P.ink,
									color: '#FFF',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0 38px',
									boxSizing: 'border-box',
									opacity: Math.min(1, p * 1.4) * dim,
									transform: `translateX(${(1 - p) * 80}px) scale(${isVoo ? 1 + 0.04 * pick : 1})`,
								}}
							>
								<div>
									<div style={{fontSize: 76, fontWeight: 900, lineHeight: 1}}>{f.tk}</div>
									<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 3, color: isVoo && pick > 0.01 ? '#0B3D1E' : '#9AA0A8', marginTop: 6}}>{isVoo && pick > 0.5 ? 'GIO’S EXAMPLE' : f.issuer}</div>
								</div>
								<div style={{fontSize: 60, fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>{pct(f.er)}</div>
							</div>
						);
					})}
					<div style={{position: 'absolute', left: 664, width: 330, top: 374, height: 700, borderRadius: 30, border: `7px solid ${P.accent}`, opacity: kf(frame, [tSame - 6, tSame + 4], [0, 1]) * (1 - pick), transform: `scale(${1.04 - 0.04 * kf(frame, [tSame - 6, tSame + 4], [0, 1])})`}} />
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1094, fontSize: 40, fontWeight: 900, color: P.ink, lineHeight: 1.15, opacity: kf(frame, [tSame - 4, tSame + 8], [0, 1])}}>
						SAME INDEX — <span style={{color: P.accent}}>FEES & RETURNS CAN DIFFER</span>
					</div>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1250, fontSize: 24, fontWeight: 700, color: P.muted, lineHeight: 1.3}}>
						Source: fund issuers, Nov 2026. SPY and SPYM: gross expense ratio.
					</div>
				</div>
			)}

			</div>
			{tT.map((t, i) => (
				<Sfx key={i} at={t} name="pop" volume={0.22} />
			))}
			<Sfx at={tApple} name="tick" volume={0.3} />
			<Sfx at={tMsft} name="tick" volume={0.3} />
			<Sfx at={t13 + 14} name="thud" volume={0.3} />
			<Sfx at={t14} name="whoosh-soft" volume={0.25} />
			<Sfx at={tVoo} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
