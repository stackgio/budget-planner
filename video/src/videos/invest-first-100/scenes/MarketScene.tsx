import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {DotField, dotCenter} from '../../../story/components/DotField';
import {SourceTag} from '../../../story/components/Evidence';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SOURCES, VTI} from '../facts';
import {BARS, FUND, white as P} from '../look';
import {asset} from '../ui';

// 69 × 51 = 3,519 dots — one per stock VTI holds (as of 09/30/2026)
const COLS = 69;
const ROWS = 51;
const GAP = 12.5;
const FIELD = {x: 109, y: 500};
const PICK = 25 * COLS + 40; // the "one winner" dot
const LOGO_DOTS = [3 * COLS + 5, 3 * COLS + 9, 3 * COLS + 13];

/**
 * MARKET — "So instead of trying to pick the next winning stock, I'm investing
 * in almost the entire U.S. stock market."
 * The three logos drop into a field of 3,519 dots; one dot gets the spotlight
 * (the stock-picker's bet), then the whole field lights up green.
 */
export const MarketScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPick = cue('L4', 'pick');
	const tWin = cue('L4', 'winning');
	const tIm = cue('L4', "I'm");
	const tEntire = cue('L4', 'entire');
	const tMarket = cue('L4', 'market.');
	if (VTI.stocks.value !== COLS * ROWS) throw new Error('dot field must equal VTI stock count');

	const reveal = kf(frame, [2, 20], [0, 1], E.out);
	const fly = kf(frame, [0, 18], [0, 1], E.inOut);
	const spot = sp(frame, fps, tPick - 2, 'bouncy');
	const spotOut = kf(frame, [tIm, tIm + 10], [0, 1], E.in);
	const lit = kf(frame, [tEntire - 10, tEntire + 18], [0, 1], E.inOut);
	const dim = 0.55 * spot * (1 - spotOut);
	const banner = sp(frame, fps, tMarket - 8, 'snappy');
	const [px, py] = dotCenter(PICK, COLS, GAP);

	const marks: Record<number, {color: string; scale?: number}> = {};
	if (spot > 0.02 && spotOut < 1) marks[PICK] = {color: FUND.schd.light, scale: 1 + 1.8 * spot * (1 - spotOut)};
	LOGO_DOTS.forEach((d) => {
		if (fly >= 1) marks[d] = {color: lit > 0.3 ? FUND.vti.light : P.ink, scale: 1.3};
	});

	return (
		<AbsoluteFill style={{fontFamily: story.font, background: P.bg}}>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 30, top: story.safe.top + 20, height: 230}}>
				{frame < tIm + 4 && <KineticText text="PICK ONE WINNER?" at={-12} fontSize={100} color={P.ink} colors={{one: FUND.schd.light}} exitAt={tIm - 6} />}
				{frame >= tIm - 2 && <KineticText text="OR OWN ALMOST ALL OF IT" at={tIm} fontSize={100} color={P.ink} colors={{all: FUND.vti.light}} />}
			</div>
			<div style={{position: 'absolute', left: FIELD.x, top: FIELD.y - 52, fontSize: 30, fontWeight: 900, letterSpacing: 3, color: P.muted, opacity: reveal}}>
				VTI · 1 DOT = 1 STOCK
			</div>
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tPick, zoom: 1},
					{at: tPick + 18, zoom: 1.12, x: FIELD.x + px, y: FIELD.y + py},
					{at: tIm, zoom: 1.12, x: FIELD.x + px, y: FIELD.y + py},
					{at: tIm + 16, zoom: 1, x: 540, y: 960},
				]}
			>
				<div style={{position: 'absolute', left: FIELD.x - 22, top: FIELD.y - 22, width: COLS * GAP + 44, height: ROWS * GAP + 44, borderRadius: 28, border: `3px solid ${lit > 0.5 ? FUND.vti.light : P.line}`, background: '#FAFBFA'}} />
				<DotField cols={COLS} rows={ROWS} gap={GAP} r={4.1} reveal={reveal} lit={lit} baseColor="#C9CDD3" litColor={FUND.vti.light} dim={dim} marks={marks} style={{left: FIELD.x, top: FIELD.y}} />
				{/* the stock-picker's single bet */}
				{spot > 0.02 && spotOut < 1 && (
					<div style={{position: 'absolute', left: FIELD.x + px - 48, top: FIELD.y + py - 48, width: 96, height: 96, borderRadius: 48, border: `4px solid ${FUND.schd.light}`, transform: `scale(${spot})`, opacity: 1 - spotOut}} />
				)}
				{frame >= tWin && spotOut < 1 && (
					<div style={{position: 'absolute', left: FIELD.x + px + 60, top: FIELD.y + py - 40, fontSize: 40, fontWeight: 900, color: FUND.schd.light, opacity: kf(frame, [tWin, tWin + 6], [0, 1]) * (1 - spotOut), background: '#fff', padding: '4px 14px', borderRadius: 12, boxShadow: `0 10px 24px ${P.shadow}`}}>
						THE ONE?
					</div>
				)}
				{/* logo tiles from the previous shot fly into their dots */}
				{fly < 1 &&
					['AAPL.svg', 'MSFT.png', 'AMZN.png'].map((src, i) => {
						const [dx, dy] = dotCenter(LOGO_DOTS[i], COLS, GAP);
						const from: [number, number] = [BARS.x + BARS.logoW / 2, BARS.ys[i] + BARS.h / 2];
						const [x, y] = arc(fly, from, [FIELD.x + dx, FIELD.y + dy], 160);
						const s = 1 - 0.92 * fly;
						return (
							<div key={src} style={{position: 'absolute', left: x - (BARS.logoW * s) / 2, top: y - (BARS.h * s) / 2, width: BARS.logoW * s, height: BARS.h * s, background: '#fff', borderRadius: 26 * s + 4, border: `2px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 18px 40px ${P.shadow}`}}>
								<Img src={staticFile(asset(src))} style={{height: 60 * s, width: 'auto', maxWidth: '80%', objectFit: 'contain'}} />
							</div>
						);
					})}
			</Camera>
			<SourceTag size={28} text={`${SOURCES.vti} · ${VTI.stocks.value.toLocaleString('en-US')} stocks`} asOf={VTI.asOf} palette={P} style={{left: FIELD.x - 10, top: FIELD.y + ROWS * GAP + 40, opacity: reveal}} />

			{/* the takeaway for this $70 */}
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					right: story.safe.right - 40,
					top: 1222,
					height: 140,
					borderRadius: 30,
					background: P.ink,
					display: 'flex',
					alignItems: 'center',
					gap: 26,
					padding: '0 36px',
					opacity: Math.min(1, banner * 1.4),
					transform: `translateY(${(1 - banner) * 40}px)`,
				}}
			>
				<span style={{fontSize: 72, fontWeight: 900, color: FUND.vti.dark, letterSpacing: -2}}>${PLAN.vti.value}</span>
				<span style={{fontSize: 52, fontWeight: 900, color: '#8A9099'}}>→</span>
				<span style={{fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: -0.5}}>BROAD U.S. STOCK MARKET</span>
			</div>

			<Sfx at={8} name="pop" volume={0.25} />
			<Sfx at={tPick} name="click" volume={0.35} />
			<Sfx at={tEntire - 8} name="whoosh" volume={0.4} />
			<Sfx at={tMarket - 8} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
