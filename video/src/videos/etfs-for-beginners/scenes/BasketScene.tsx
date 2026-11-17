import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {FundCard, StockTile} from '../../../story/components/FundCards';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {HEADER, US_TILE_BOXES, VOO_CARD} from '../layout';
import {C, Desc, FONT, Label} from './common';

/** Where each tile starts before it drops into the basket (off-card, around the frame). */
const STARTS: [number, number][] = [
	[-160, 260],
	[540, -200],
	[1240, 300],
	[-200, 820],
	[1280, 860],
	[-160, 1500],
	[540, 2100],
	[1240, 1520],
];

/** "1 ETF" header used by the basket card (and by the first frames of the US scene, for the match cut). */
export const EtfHeader: React.FC<{descAt: number}> = ({descAt}) => {
	const frame = useCurrentFrame();
	const d = prog(frame, descAt, 12);
	return (
		<>
			<div style={{fontSize: HEADER.ticker, fontWeight: 900, lineHeight: 1, letterSpacing: -4, color: C.ink, fontFamily: FONT}}>
				<span style={{color: C.accent}}>1</span> ETF
			</div>
			<div style={{marginTop: 14, height: 56, overflow: 'hidden'}}>
				<div style={{transform: `translateY(${(1 - d) * 100}%)`, opacity: d}}>
					<Desc text="Many stocks" hl={['Many']} />
				</div>
			</div>
		</>
	);
};

/** THE BASKET — one card, named stock tiles arc into it. "1 ETF · Many stocks". */
export const BasketScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEtf = cue('L3', 'ETF', -0.1);
	const tBasket = cue('L3', 'basket');
	const tBuy = cue('L4', 'buy');
	const tBunch = cue('L4', 'bunch');
	const tInside = cue('L5', 'inside');
	const card = sp(frame, fps, -4, 'smooth');
	const fill = prog(frame, tBasket, 14);
	const head = sp(frame, fps, tEtf, 'snappy');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={760} />
			<FundCard {...VOO_CARD} empty={1 - fill} glow={kf(frame, [tBuy, tBuy + 6, tBuy + 26], [0, 0.8, 0], E.out)} opacity={card} />
			<div style={{position: 'absolute', left: VOO_CARD.x + HEADER.padX, top: VOO_CARD.y + HEADER.padTop, opacity: head, transform: `translateY(${(1 - head) * 30}px)`}}>
				<EtfHeader descAt={tBunch} />
			</div>
			{US_TILE_BOXES.map((b, i) => {
				const t0 = tBuy + i * 4;
				const p = kf(frame, [t0, t0 + 18], [0, 1], E.inOut);
				const [x, y] = arc(p, STARTS[i], [b.x, b.y], 160);
				if (p <= 0) return null;
				const wave = kf(frame, [tInside + i * 2, tInside + i * 2 + 6, tInside + i * 2 + 18], [0, 0.6, 0]);
				return <StockTile key={b.label} x={x} y={y} w={b.w} h={b.h} label={b.label} fontSize={b.row === 'mid' ? 48 : 38} focus={wave} rot={(1 - p) * (i % 2 ? 12 : -12)} />;
			})}
			<Label style={{right: 1080 - VOO_CARD.x - VOO_CARD.w + HEADER.padX, top: VOO_CARD.y + 52, opacity: prog(frame, tBunch, 12)}}>Examples</Label>
			<Sfx at={tBasket} name="card" volume={0.25} />
			<Sfx at={tBuy + 16} name="pop" volume={0.18} />
		</AbsoluteFill>
	);
};
