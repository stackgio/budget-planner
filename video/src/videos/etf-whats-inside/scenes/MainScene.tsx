import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BasketCard, StockTile, hexA} from '../../../story/components/BasketCard';
import {Camera, type CamKey} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {
	BASKET_TOP,
	CARD_H,
	CARD_W,
	CARD_Y,
	COL_X,
	GRID_BASKET_TOP,
	GRID_H,
	GRID_Y,
	MID_X,
	TILE_H,
	TILE_W,
	TILE_X,
	slotY,
} from '../layout';

const font = story.font;

/** Text block in card-local coords. */
const Txt: React.FC<{y: number; size: number; children: React.ReactNode; color?: string; weight?: number; ls?: number; o?: number; s?: number; dy?: number}> = ({
	y,
	size,
	children,
	color = P.ink,
	weight = 900,
	ls = -1,
	o = 1,
	s = 1,
	dy = 0,
}) => (
	<div
		style={{
			position: 'absolute',
			left: -20,
			width: CARD_W + 40,
			top: y,
			textAlign: 'center',
			fontFamily: font,
			fontWeight: weight,
			fontSize: size,
			letterSpacing: ls,
			lineHeight: 1,
			color,
			opacity: o,
			transform: `translateY(${dy}px) scale(${s})`,
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</div>
);

const Building: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 48 48">
		<path d="M8 42 V14 L24 6 L40 14 V42 Z" fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
		{[18, 26, 34].map((y) => (
			<g key={y}>
				<rect x={15} y={y - 3} width={6} height={5} fill={color} />
				<rect x={27} y={y - 3} width={6} height={5} fill={color} />
			</g>
		))}
	</svg>
);

const Person: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 48 48">
		<circle cx={24} cy={15} r={9} fill={color} />
		<path d="M6 46 C6 32 14 27 24 27 C34 27 42 32 42 46 Z" fill={color} />
	</svg>
);

export const MainScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	/** cue that may be absent from a re-recorded take: missing → never fires */
	const opt = (line: string, word?: string | number, off = 0) => {
		try {
			return cue(line, word, off);
		} catch {
			return 1e9;
		}
	};
	const S = (t: number, cfg: Parameters<typeof sp>[3] = 'snappy') => sp(frame, fps, t, cfg);

	// ---- cues (all from the voiceover's word timestamps) -------------------
	const tVOO = cue('L1', 'VOO', -0.1);
	const tSCHD = cue('L2', 'SCHD', -0.1);
	const tWhat = cue('L3', 0);
	const tThe = cue('L3', 1);
	const tDiff = cue('L3', 2);
	const tBasket = cue('L4', 'basket', -0.15);
	const tStocks = cue('L4', 'stocks', -0.1);
	const tWhatGoes = cue('L5', 'what');
	const tVOO2 = cue('L6', 'VOO', -0.1);
	const tAbout = cue('L6', 'about', -0.05);
	const tFive = cue('L6', 'five', -0.05);
	const tBig = cue('L6', 'big', -0.05);
	const tTech = cue('L6', 'tech', -0.12);
	const tBank = cue('L7', 'banking', -0.12);
	const tHealth = cue('L7', 'healthcare', -0.12);
	const tSCHD2 = cue('L8', 'SCHD', -0.1);
	const tHistory = cue('L8', 'history', -0.05);
	const tCash = cue('L9', 'cash', -0.1);
	const tPay = cue('L9', 'pay', -0.05);
	const tNow = cue('L10', 0, -0.12); // QQQM + VGT replace VOO + SCHD together on "Now,"
	const tQQQM = cue('L10', 'QQQM');
	const tVGT = cue('L11', 'VGT');
	const tBoth = cue('L12');
	const tLeanTech = cue('L12', 'tech', -0.12);
	const tCostco = opt('L13', 'Costco', -0.08);
	const tAns = cue('L14', 'QQQM', -0.05);
	const tList = cue('L14', 'list', -0.05);
	const tNasdaq = cue('L14', 'Nasdaq', -0.05);
	const tIncludes = cue('L15', 'includes', -0.05);
	const tCostco2 = opt('L15', 'Costco', -0.05);
	const tVGT2 = cue('L16', 'VGT', -0.1);
	const tInfo = cue('L16', 'information', -0.05);
	const tSoft = cue('L17', 'software', -0.12);
	const tChips = cue('L17', 'computer', -0.12);
	const tCostco3 = opt('L18', 'Costco', -0.05);
	const tOut = opt('L18', 'out', -0.05);
	const tTwo = cue('L19');
	const tEnd = cue('L20', 'difference', -0.1); // recap lands inside the final sentence

	// ---- focus (green is reserved for the fund being explained) -----------
	const level = (events: [number, number][]) => {
		let v = 0;
		for (const [t, target] of events) v = v + (target - v) * sp(frame, fps, t, {damping: 22, stiffness: 260, mass: 0.6});
		return v;
	};
	const activeL = level([
		[tVOO, 1],
		[tSCHD, 0],
		[tVOO2, 1],
		[tSCHD2, 0],
		[tQQQM - 3, 1],
		[tVGT - 3, 0],
		[tAns, 1],
		[tVGT2, 0],
	]);
	const activeR = level([
		[tSCHD, 1],
		[tWhat, 0],
		[tSCHD2, 1],
		[tNow - 10, 0],
		[tVGT - 3, 1],
		[tBoth, 0],
		[tVGT2, 1],
		[tTwo, 0],
	]);
	const pulse = (t: number, len = 14) => kf(frame, [t, t + 4, t + len], [0, 1, 0], E.out);
	const punchL = pulse(tVOO) + pulse(tVOO2) + pulse(tQQQM) + pulse(tAns);
	const punchR = pulse(tSCHD) + pulse(tSCHD2) + pulse(tVGT) + pulse(tVGT2);

	// ---- card morphs -------------------------------------------------------
	const basket = prog(frame, 10, 22, E.inOut); // opens in the first second
	// one beat: both cards flip together, no QQQM/SCHD in-between state
	const flip = prog(frame, tNow - 6, 12, E.inOut);
	const flipL = flip;
	const flipR = flip;
	const tickerL = flip < 0.5 ? 'VOO' : 'QQQM';
	const tickerR = flip < 0.5 ? 'SCHD' : 'VGT';
	const endP = prog(frame, tEnd, 15, E.inOut);
	const cardY = mix(CARD_Y, GRID_Y[1], endP);
	const cardH = mix(CARD_H, GRID_H, endP);
	const bTop = mix(BASKET_TOP, GRID_BASKET_TOP, endP);
	const tickerSize = mix(mix(120, 104, basket), 92, endP);
	const contentOut = 1 - prog(frame, tEnd - 2, 8);

	// Costco reveal dims both cards
	const costcoIn = S(tCostco, 'bouncy');
	const snap = S(tAns, {damping: 20, stiffness: 240, mass: 0.7});
	const dimCards = 0.45 * Math.min(1, prog(frame, tCostco, 6)) * (1 - prog(frame, tAns, 8));

	// ---- generic stock tiles (basket intro) --------------------------------
	const genericOut = prog(frame, tVOO2 - 8, 10, E.in);
	const genericTiles = (side: 0 | 1) =>
		[0, 1, 2, 3].map((i) => {
			const t = tStocks + i * 3 + side * 5;
			const d = S(t, 'bouncy');
			const x = TILE_X + (i % 2) * (TILE_W / 2 + 10);
			const y = slotY(Math.floor(i / 2));
			const q = prog(frame, tWhatGoes + i * 2, 6);
			return (
				<StockTile
					key={`g${i}`}
					x={x - 5}
					y={mix(-220, y, d) - genericOut * 140}
					w={TILE_W / 2 - 0}
					h={TILE_H}
					palette={P}
					opacity={Math.min(1, prog(frame, t, 3)) * (1 - genericOut)}
					fontSize={q > 0.5 ? 40 : 24}
					label={q > 0.5 ? '?' : 'STOCK'}
					scale={q > 0 && q < 1 ? 1 - 0.2 * Math.sin(Math.PI * q) : 1}
				/>
			);
		});

	const drop = (t: number, slot: number, label: string, outAt: number, extra?: Partial<React.ComponentProps<typeof StockTile>>) => {
		const d = S(t, 'bouncy');
		const out = prog(frame, outAt, 8, E.in);
		return (
			<StockTile
				key={label + slot}
				x={TILE_X}
				y={mix(-260, slotY(slot), d) + out * 60}
				w={TILE_W}
				h={TILE_H}
				label={label}
				palette={P}
				opacity={Math.min(1, prog(frame, t, 3)) * (1 - out)}
				{...extra}
			/>
		);
	};

	// ---- left card contents -------------------------------------------------
	const vooOut = prog(frame, tNow - 10, 8, E.in);
	const fiveS = S(tFive, 'bouncy');
	const leftContent = (
		<>
			{frame < tVOO2 + 2 && genericTiles(0)}
			{frame < tNow && (
				<>
					<Txt y={174} size={34} ls={8} weight={800} color={P.body} o={prog(frame, tAbout, 5) * (1 - vooOut)}>
						ABOUT
					</Txt>
					<Txt y={214} size={156} ls={-4} o={Math.min(1, fiveS * 1.5) * (1 - vooOut)} s={mix(0.55, 1, fiveS)}>
						{FACTS.vooHoldings.value}
					</Txt>
					<Txt y={370} size={27} ls={1.5} weight={800} color={P.body} o={prog(frame, tBig, 5) * (1 - vooOut)}>
						BIG U.S. COMPANIES
					</Txt>
					{drop(tTech, 0, 'TECH', tNow - 10)}
					{drop(tBank, 1, 'BANKING', tNow - 9)}
					{drop(tHealth, 2, 'HEALTHCARE', tNow - 8)}
				</>
			)}
			{frame >= tNow && (
				<>
					{drop(tLeanTech, 0, 'TECH', 99999)}
					{/* QQQM label: NASDAQ-100, big enough to read on a phone */}
					<Txt y={172} size={80} ls={-3} o={Math.min(1, S(tList, 'bouncy') * 1.5)} s={mix(0.7, 1, S(tList, 'bouncy'))}>
						NASDAQ-
					</Txt>
					<Txt y={252} size={124} ls={-4} o={Math.min(1, S(tList + 4, 'bouncy') * 1.5)} s={mix(0.6, 1, S(tList + 4, 'bouncy'))}>
						{FACTS.nasdaq100.value}
					</Txt>
				</>
			)}
		</>
	);

	// ---- right card contents ------------------------------------------------
	const schdOut = prog(frame, tNow - 10, 8, E.in);
	const coS = S(tCash - 8, 'bouncy');
	const ghostIn = S(tCostco3, 'snappy');
	const strike = prog(frame, tOut, 6);
	const ghostOut = prog(frame, tOut + 8, 14, E.in);
	const rightContent = (
		<>
			{frame < tVOO2 + 2 && genericTiles(1)}
			{frame < tNow && (
				<>
					{[0, 1].map((i) => (
						<Txt key={i} y={174 + i * 62} size={60} ls={-2} o={prog(frame, tHistory + i * 3, 5) * (1 - schdOut)} s={mix(0.8, 1, S(tHistory + i * 3, 'bouncy'))}>
							{i === 0 ? 'DIVIDEND-' : 'PAYING'}
						</Txt>
					))}
					<Txt y={314} size={34} ls={6} weight={800} color={P.body} o={prog(frame, tHistory + 8, 5) * (1 - schdOut)}>
						STOCKS
					</Txt>
					<StockTile
						x={(CARD_W - 230) / 2}
						y={mix(-200, 560, coS)}
						w={230}
						h={150}
						palette={P}
						opacity={Math.min(1, prog(frame, tCash - 8, 3)) * (1 - schdOut)}
						fontSize={26}
					>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
							<Building size={64} color={P.ink} />
							COMPANY
						</div>
					</StockTile>
				</>
			)}
			{frame >= tNow && (
				<>
					{drop(tLeanTech + 3, 0, 'TECH', 99999)}
					{/* VGT label: U.S. TECH SECTOR, same scale as QQQM's */}
					{(['U.S.', 'TECH', 'SECTOR'] as const).map((w, i) => (
						<Txt key={w} y={[172, 252, 330][i]} size={i === 2 ? 66 : 80} ls={-3} o={Math.min(1, S(tInfo - 4 + i * 4, 'bouncy') * 1.5)} s={mix(0.7, 1, S(tInfo - 4 + i * 4, 'bouncy'))}>
							{w}
						</Txt>
					))}
					{drop(tSoft, 1, 'SOFTWARE', 99999)}
					{drop(tChips, 2, 'COMPUTER CHIPS', 99999, {fontSize: 29, accent: 0})}
					{frame >= tCostco3 - 2 && (
						<div
							style={{
								position: 'absolute',
								left: (CARD_W - 270) / 2,
								top: 424,
								width: 270,
								height: 52,
								opacity: Math.min(1, ghostIn * 1.4) * (1 - ghostOut),
								transform: `translate(${shake(frame, tOut, 10, 10).x}px, ${ghostOut * 90}px) rotate(${ghostOut * 9}deg) scale(${mix(0.7, 1, ghostIn)})`,
							}}
						>
							<StockTile x={0} y={0} w={270} h={52} tone="ghost" label="COSTCO" fontSize={28} palette={P} />
							<svg width={270} height={52} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
								<line x1={-10} y1={26} x2={-10 + 290 * strike} y2={26} stroke={P.ink} strokeWidth={6} strokeLinecap="round" />
							</svg>
						</div>
					)}
				</>
			)}
		</>
	);

	// ---- stage-level positions ---------------------------------------------
	const cardCenter = (side: 0 | 1, active: number, punch: number) => ({
		cx: COL_X[side] + CARD_W / 2,
		cy: cardY + cardH / 2 - 14 * active,
		s: 1 + 0.035 * punch,
	});
	const toStage = (side: 0 | 1, lx: number, ly: number, active: number, punch: number) => {
		const c = cardCenter(side, active, punch);
		return [c.cx + (COL_X[side] + lx - c.cx) * c.s, c.cy + (cardY + ly - 14 * active - c.cy) * c.s] as const;
	};

	// Costco: pops between the cards, holds for the question, snaps into QQQM
	const costcoBigW = 452;
	const costcoBigH = 156;
	const [slotX, slotYs] = toStage(0, TILE_X, slotY(1), activeL, punchL);
	const cx = mix(MID_X - costcoBigW / 2, slotX, snap);
	const cy = mix(760 - costcoBigH / 2, slotYs, snap) - Math.sin(Math.PI * snap) * 90;
	const cw = mix(costcoBigW, TILE_W, snap);
	const ch = mix(costcoBigH, TILE_H, snap);
	const cfs = mix(96, 34, snap);
	const costcoPulse = pulse(tCostco2, 22) + pulse(tCostco3, 18) * 0.6;
	const costcoAccent = frame >= tAns + 6 && frame < tVGT2 ? Math.min(1, activeL) : 0;

	// SCHD: cash from the company to an investor icon (illustrative, no amounts)
	const youX = COL_X[1] + CARD_W / 2;
	const youY = 1180;
	const youIn = S(tCash, 'bouncy');
	const youOut = schdOut;
	const [compX, compY] = toStage(1, CARD_W / 2, 600, activeR, punchR);
	const mv = prog(frame, tPay, 16, E.inOut);
	const cashIn = S(tCash, 'snappy');
	const cashX = mix(compX, youX + 112, mv) + Math.sin(Math.PI * mv) * 50;
	const cashY = mix(compY, youY + 34, mv);
	const landed = pulse(tPay + 16, 14);

	// pointer — the "point left / point right" beat
	const side = activeL + activeR > 0.01 ? activeR / (activeL + activeR) : 0.5;
	const ptrX = mix(COL_X[0] + CARD_W / 2, COL_X[1] + CARD_W / 2, side);
	const ptrO = Math.min(1, Math.max(activeL, activeR)) * (1 - endP);
	const ptrBob = Math.sin(frame / 5) * 4;

	// "WHAT'S THE DIFFERENCE?" directly below the cards, word by word
	const qOut = prog(frame, tBasket - 6, 10, E.in);
	const qPulse = pulse(tDiff, 16);
	const word = (t: number) => ({o: 1, s: 1 + 0.06 * pulse(t, 12)});
	const w1 = word(tWhat);
	const w2 = word(tThe);
	const w3 = word(tDiff);

	// end grid: VOO + SCHD return on the top row
	const topIn = (i: number) => S(tEnd + 4 + i * 3, {damping: 20, stiffness: 170, mass: 0.9});
	const header = S(tEnd + 2, 'snappy');
	const endLabel = (i: number) => prog(frame, tEnd + 12 + i * 2, 8);
	const END_LABELS: [string, string?][] = [['BIG U.S.', 'COMPANIES'], ['DIVIDEND', 'STOCKS'], ['NASDAQ-100'], ['TECH', 'SECTOR']];
	const endText = (i: number) => {
		const [a, b] = END_LABELS[i];
		const o = endLabel(i);
		const mid = GRID_BASKET_TOP + (GRID_H - 22 - GRID_BASKET_TOP) / 2;
		return b ? (
			<>
				<Txt y={mid - 46} size={42} ls={0} o={o} dy={(1 - o) * 14}>
					{a}
				</Txt>
				<Txt y={mid + 4} size={42} ls={0} o={o} dy={(1 - o) * 14}>
					{b}
				</Txt>
			</>
		) : (
			<Txt y={mid - 22} size={44} ls={-1} o={o} dy={(1 - o) * 14}>
				{a}
			</Txt>
		);
	};

	// camera: tiny lateral "point" nudges, one push-in on the Costco question
	const cam: CamKey[] = [{at: 0, zoom: 1, x: 540, y: 960}];
	const move = (at: number, dur: number, k: Omit<CamKey, 'at'>) => {
		const last = cam[cam.length - 1];
		cam.push({...last, at, ease: undefined});
		cam.push({...last, ...k, at: at + dur});
	};
	move(tVOO, 8, {x: 528});
	move(tSCHD, 8, {x: 552});
	move(tWhat, 10, {x: 540});
	move(tQQQM - 4, 8, {x: 530});
	move(tVGT - 4, 8, {x: 550});
	move(tBoth, 10, {x: 540});
	move(tCostco, 9, {zoom: 1.05, y: 820, ease: E.out});
	move(tAns + 2, 14, {zoom: 1, y: 960});
	const sh = shake(frame, tCostco + 3, 9, 12);

	return (
		<AbsoluteFill style={{background: P.bg}}>
			{/* subtle floor glow */}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 50% 42%, ${P.bg2} 0%, ${P.bg} 70%)`}} />
			<Camera keys={cam} shakeX={sh.x} shakeY={sh.y}>
				{/* pointer */}
				<svg width={60} height={40} style={{position: 'absolute', left: ptrX - 30, top: CARD_Y - 58 + ptrBob, opacity: ptrO}}>
					<path d="M6 6 L54 6 L30 34 Z" fill={P.accent} stroke={P.accent} strokeWidth={6} strokeLinejoin="round" />
				</svg>

				{/* end grid top row (VOO, SCHD) */}
				{frame >= tEnd &&
					([0, 1] as const).map((i) => {
						const p = topIn(i);
						return (
							<BasketCard
								key={`top${i}`}
								x={COL_X[i]}
								y={mix(GRID_Y[0] - 140, GRID_Y[0], p)}
								w={CARD_W}
								h={GRID_H}
								ticker={i === 0 ? 'VOO' : 'SCHD'}
								tickerSize={92}
								basketTop={GRID_BASKET_TOP}
								basket={1}
								active={0}
								palette={P}
								opacity={Math.min(1, p * 1.6)}
							>
								{endText(i)}
							</BasketCard>
						);
					})}

				{/* the two main cards / baskets */}
				{([0, 1] as const).map((i) => (
					<BasketCard
						key={`card${i}`}
						x={COL_X[i]}
						y={cardY}
						w={CARD_W}
						h={cardH}
						ticker={i === 0 ? tickerL : tickerR}
						tickerSize={tickerSize}
						basketTop={bTop}
						basket={basket}
						active={(i === 0 ? activeL : activeR) * (1 - endP)}
						punch={i === 0 ? punchL : punchR}
						flip={i === 0 ? flipL : flipR}
						dim={dimCards}
						palette={P}
					>
						<div style={{position: 'absolute', inset: 0, opacity: contentOut}}>{i === 0 ? leftContent : rightContent}</div>
						{frame >= tEnd && endText(i + 2)}
					</BasketCard>
				))}

				{/* SCHD payout illustration */}
				{frame >= tCash - 2 && frame < tNow + 12 && (
					<>
						<div
							style={{
								position: 'absolute',
								left: youX - 70,
								top: youY,
								width: 140,
								textAlign: 'center',
								opacity: Math.min(1, youIn * 1.5) * (1 - youOut),
								transform: `scale(${mix(0.6, 1, youIn) + 0.08 * landed})`,
							}}
						>
							<Person size={110} color={P.ink} />
							<div style={{fontFamily: font, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: P.body, marginTop: 4}}>YOU</div>
						</div>
						<div
							style={{
								position: 'absolute',
								left: cashX - 46,
								top: cashY - 28,
								width: 92,
								height: 56,
								borderRadius: 10,
								background: P.accent,
								border: `3px solid ${P.accentDeep}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: font,
								fontWeight: 900,
								fontSize: 34,
								color: P.bg,
								opacity: Math.min(1, cashIn * 2) * (1 - youOut),
								transform: `scale(${mix(0.3, 1, cashIn)}) rotate(${Math.sin(Math.PI * mv) * -10}deg)`,
								boxShadow: `0 10px 30px ${hexA('#000000', 0.5)}`,
							}}
						>
							$
						</div>
					</>
				)}

				{/* COSTCO */}
				{frame >= tCostco - 1 && (
					<div
						style={{
							position: 'absolute',
							left: cx,
							top: cy,
							width: cw,
							height: ch,
							opacity: Math.min(1, costcoIn * 2) * contentOut,
							transform: `scale(${mix(0.4, 1, costcoIn) * (1 + 0.07 * costcoPulse)})`,
							transformOrigin: '50% 50%',
						}}
					>
						<StockTile x={0} y={0} w={cw} h={ch} tone="light" label="COSTCO" fontSize={cfs} palette={P} accent={costcoAccent} />
					</div>
				)}

				{/* question below the cards */}
				{frame < tBasket + 6 && (
					<div style={{position: 'absolute', left: COL_X[0] - 20, width: CARD_W * 2 + 84, top: 180, textAlign: 'center', fontFamily: font, fontWeight: 900, color: P.ink, lineHeight: 1.0, opacity: 1 - qOut, transform: `translateY(${-qOut * 40}px) scale(${1 + 0.03 * qPulse})`}}>
						<div style={{fontSize: 74, letterSpacing: -2}}>
							<span style={{display: 'inline-block', opacity: w1.o, transform: `scale(${w1.s})`}}>WHAT&apos;S</span>{' '}
							<span style={{display: 'inline-block', opacity: w2.o, transform: `scale(${w2.s})`}}>THE</span>
						</div>
						<div style={{fontSize: 92, letterSpacing: -3, opacity: w3.o, transform: `scale(${w3.s})`}}>DIFFERENCE?</div>
					</div>
				)}

				{/* end header */}
				{frame >= tEnd && (
					<div
						style={{
							position: 'absolute',
							left: COL_X[0] - 20,
							width: CARD_W * 2 + 84,
							top: 196,
							textAlign: 'center',
							fontFamily: font,
							fontWeight: 900,
							fontSize: 66,
							letterSpacing: -1.5,
							color: P.ink,
							opacity: header,
							transform: `translateY(${(1 - header) * -30}px)`,
							whiteSpace: 'nowrap',
						}}
					>
						CHECK <span style={{color: P.accent}}>WHAT&apos;S INSIDE</span>
					</div>
				)}
			</Camera>

			{/* sound: light hits only */}
			<Sfx at={tVOO + 2} name="pop" volume={0.32} />
			<Sfx at={tSCHD + 2} name="pop" volume={0.32} />
			<Sfx at={tBasket} name="whoosh-soft" volume={0.18} />
			<Sfx at={tStocks + 6} name="tick" volume={0.2} />
			<Sfx at={tPay + 15} name="coin" volume={0.22} />
			<Sfx at={tNow - 6} name="card" volume={0.26} />
			<Sfx at={tCostco} name="thud" volume={0.38} />
			<Sfx at={tCostco + 1} name="pop" volume={0.3} />
			<Sfx at={tAns + 6} name="click" volume={0.32} />
			<Sfx at={tEnd} name="whoosh-soft" volume={0.2} />
		</AbsoluteFill>
	);
};
