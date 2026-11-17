import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {FundCard, StockTile, Swap, TickerWord} from '../../../story/components/FundCards';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {ASSETS, FACTS} from '../facts';
import {HEADER, US_TILE_BOXES, VOO_CARD, VTI_CARD, VTI_SMALL} from '../layout';
import {C, Desc, FONT, Label} from './common';

/** VOO → VTI — the same card: VOO, "one I own", Apple + Microsoft in focus, then the card grows into VTI around them. */
export const UsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tVoo = cue('L6', 'VOO', -0.05);
	const tOwn = cue('L7', 'This');
	const t500 = cue('L8', 'five');
	const t500End = cue('L8', 'hundred', 0, 'end');
	const tApple = cue('L9', 'Apple');
	const tMsft = cue('L9', 'Microsoft');
	const tVti = cue('L10', 'VTI', -0.05);
	const tStill = cue('L11', 'Apple');
	const tSmaller = cue('L11', 'smaller', -0.1);
	const tAlmost = cue('L12', 'almost');

	const e = sp(frame, fps, tVti - 2, 'smooth');
	const card = {x: mix(VOO_CARD.x, VTI_CARD.x, e), y: mix(VOO_CARD.y, VTI_CARD.y, e), w: mix(VOO_CARD.w, VTI_CARD.w, e), h: mix(VOO_CARD.h, VTI_CARD.h, e)};
	const count = Math.round(FACTS.vooHoldings.value * prog(frame, t500, Math.max(8, t500End - t500), E.soft));

	const focusApple = sp(frame, fps, tApple, 'snappy');
	const focusMsft = sp(frame, fps, tMsft, 'snappy');
	const settleAll = prog(frame, tAlmost, 18);
	const othersDim = kf(frame, [tApple, tApple + 10], [0, 1]) * (1 - 0.5 * prog(frame, tVti, 14)) * (1 - settleAll);
	const owned = sp(frame, fps, tOwn, 'bouncy') * (1 - prog(frame, tVti - 6, 10));
	const shot = ASSETS.vooScreenshot;
	const shotIn = shot ? kf(frame, [tOwn - 4, tOwn + 6, t500 - 6, t500 + 4], [0, 1, 1, 0]) : 0;

	const ticker = [
		{at: -100, node: <div style={{fontSize: HEADER.ticker, fontWeight: 900, lineHeight: 1, letterSpacing: -4, color: C.ink}}><span style={{color: C.accent}}>1</span> ETF</div>},
		{at: tVoo, node: <TickerWord text="VOO" fontSize={HEADER.ticker} />},
		{at: tVti, node: <TickerWord text="VTI" prev="VOO" at={tVti} hold={60} fontSize={HEADER.ticker} />},
	];
	const desc = [
		{at: -100, node: <Desc text="Many stocks" hl={['Many']} />},
		{at: tVoo, node: <div />},
		{at: t500, node: <Desc text={`~${count} large U.S. companies`} hl={['large']} />},
		{at: tVti, node: <div />},
		{at: tSmaller, node: <Desc text="+ smaller companies" hl={['smaller']} />},
		{at: tAlmost, node: <Desc text="Almost the whole U.S. market" hl={['whole']} />},
	];

	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={mix(760, 800, e)} />
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tApple - 2, zoom: 1},
					{at: tApple + 22, zoom: 1.07, x: 540, y: 900},
					{at: tVti - 10, zoom: 1.07, x: 540, y: 900},
					{at: tVti + 12, zoom: 1, x: 540, y: 960},
				]}
			>
				<FundCard {...card} glow={kf(frame, [tVti, tVti + 8, tVti + 40], [0, 0.9, 0.25], E.out)} />
				<div style={{position: 'absolute', left: card.x + HEADER.padX, top: card.y + HEADER.padTop, width: card.w - 2 * HEADER.padX}}>
					<Swap steps={ticker} height={HEADER.ticker + 6} dur={10} />
					<Swap steps={desc} height={58} dur={10} style={{marginTop: 10}} />
				</div>
				<Label style={{right: 1080 - card.x - card.w + HEADER.padX, top: card.y + 52}}>Examples</Label>
				{US_TILE_BOXES.map((b) => {
					const isA = b.label === 'Apple';
					const isM = b.label === 'Microsoft';
					const focus = isA ? focusApple : isM ? focusMsft : 0;
					return (
						<StockTile
							key={b.label}
							{...b}
							fontSize={b.row === 'mid' ? 48 : 38}
							focus={Math.min(1, focus * (1 - 0.45 * settleAll) + (isA || isM ? kf(frame, [tStill, tStill + 6, tStill + 30], [0, 0.35, 0]) : 0))}
							dim={isA || isM ? 0 : othersDim}
						/>
					);
				})}
				{VTI_SMALL.map((s, i) => (
					<StockTile key={i} x={s.x} y={s.y} w={s.s} h={s.s} radius={12} enter={sp(frame, fps, tSmaller + s.d / 28, 'snappy')} dim={0.25} />
				))}
				{/* "one I own": clean tag on the real fund card (no brokerage screen is simulated) */}
				{owned > 0.01 && (
					<div
						style={{
							position: 'absolute',
							right: 1080 - card.x - card.w + 24,
							top: card.y - 34,
							padding: '14px 24px',
							borderRadius: 18,
							background: C.accent,
							color: '#0B0C0E',
							fontSize: 34,
							fontWeight: 900,
							letterSpacing: 1,
							transform: `scale(${owned}) rotate(${(1 - owned) * -14 + 3}deg)`,
							transformOrigin: '80% 50%',
							boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
							whiteSpace: 'nowrap',
						}}
					>
						✓ ONE I OWN
					</div>
				)}
			</Camera>
			{shot && shotIn > 0 && (
				<AbsoluteFill style={{opacity: shotIn, background: 'rgba(11,12,14,0.75)'}}>
					<Screenshot src={shot.src} natural={shot.natural} redact={shot.redact} w={780} palette={C} style={{left: 150, top: 380, transform: `scale(${0.94 + 0.06 * shotIn})`}} />
				</AbsoluteFill>
			)}
			<Sfx at={tOwn + 2} name="stamp" volume={0.22} />
			<Sfx at={tApple} name="click" volume={0.2} />
			<Sfx at={tVti} name="whoosh-soft" volume={0.25} />
			<Sfx at={tSmaller + 4} name="pop" volume={0.15} />
		</AbsoluteFill>
	);
};
