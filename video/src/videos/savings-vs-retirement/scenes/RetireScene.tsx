import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, type CamKey} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {AccountCard, DebitCard, desk, paperShadow, Pen, PayStub, StoneDesk} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {type Box, CARD, CashGlyph, Chip, CONTENT_CX, GrowthGlyph, Kicker, lerpBox, OwnerTag, Reveal, scaledBox, Slot, TopTitle} from './parts';

// ---- layouts (world coordinates, 1080×1920)
const EQUAL_R: Box = {x: CARD.lx, y: CARD.y, w: CARD.w, h: CARD.h, s: 1, dim: 0};
const EQUAL_K: Box = {x: CARD.rx, y: CARD.y, w: CARD.w, h: CARD.h, s: 1, dim: 0};
const SMALL = 0.66;
// Roth in focus: Roth grows, 401(k) stays visible at the right
const ROTH_R: Box = {x: 72, y: 290, w: 590, h: 690, s: 1, dim: 0};
const ROTH_K: Box = scaledBox(960 - CARD.w * SMALL, 290, CARD.w, CARD.h, SMALL, 0.55);
// 401(k) in focus: 401(k) grows, Roth stays visible at the left
const K_R: Box = scaledBox(72, 250, CARD.w, CARD.h, SMALL, 0.55);
const K_K: Box = {x: 380, y: 250, w: 580, h: 590, s: 1, dim: 0};

const STUB = {x: 100, y: 892, w: 540, h: 470};
// world point of the "401(k) contribution" line on the stub (left part of the row)
const STUB_LINE = {x: STUB.x + 210, y: STUB.y + 296};
// docking rows inside the 401(k) card (K_K)
const ROW1 = {x: K_K.x + 36, y: K_K.y + 228};
const ROW2 = {x: K_K.x + 36, y: K_K.y + 398};
const ROW_W = K_K.w - 72;
const ROW_H = 152;
// Roth slots (ROTH_R)
const R_SLOT1 = {x: ROTH_R.x + 36, y: ROTH_R.y + 268};
const R_TILE = {x: ROTH_R.x + 36, y: ROTH_R.y + 458};

/** A deposit chip (owner tag + label). */
const Deposit: React.FC<{tone: 'you' | 'employer'; label: React.ReactNode; w: number; h: number; lift?: number}> = ({tone, label, w, h, lift = 0}) => {
	const you = tone === 'you';
	return (
		<div
			style={{
				width: w,
				height: h,
				borderRadius: 20,
				background: you ? desk.green : desk.gold,
				boxShadow: paperShadow(lift),
				padding: '18px 24px',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				gap: 10,
				fontFamily: story.font,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
				<OwnerTag bg={you ? '#FFFFFF' : '#1B1407'} fg={you ? desk.greenDeep : desk.gold}>
					{you ? 'YOU' : 'EMPLOYER'}
				</OwnerTag>
				<CashGlyph size={26} color={you ? '#FFFFFF' : '#1B1407'} bg={you ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'} />
			</div>
			<div style={{fontSize: 36, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.04, color: you ? '#FFFFFF' : '#1B1407'}}>{label}</div>
		</div>
	);
};

/**
 * RETIRE (L10–L20) — match cut from the savings cards to two retirement cards in
 * the same positions. Roth IRA gets focus (after-tax deposit, then investments,
 * then tax-free withdrawals). Hard cut to a sample pay stub: the 401(k) line lifts
 * into the 401(k); the employer match arrives as a separate gold deposit.
 * Ending: both cards equal, "Roth IRA + 401(k)".
 */
export const RetireScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	const tRoth = cue('L10', 'Roth');
	const tAndThis = cue('L11', 'And');
	const t401 = cue('L11', '401(k)');
	const tDiff = cue('L12', 'difference');
	const tInvestRet = cue('L13', 'invest');
	const tRothFocus = cue('L14', 'A', -0.32);
	const tOpen = cue('L14', 'open');
	const tPutIn = cue('L15', 'put');
	const tTaxes = cue('L15', 'taxes');
	const tBuy = cue('L15', 'buy');
	const tWithdraw = cue('L16', 'withdrawal');
	const tTaxFree = cue('L16', 'tax-free');
	const tCutK = cue('L17', 'A', -0.14);
	const tOffered = cue('L17', 'offered');
	const tThrough = cue('L17', 'through');
	const tChoose = cue('L18', 'choose');
	const tComes = cue('L18', 'comes');
	const tPaycheck = cue('L18', 'paycheck');
	const tMatch = cue('L19', 'match');
	const tAdds = cue('L19', 'adds');
	const tEnd = cue('L20', 'And', -0.16);
	const tBoth = cue('L20', 'both');

	// ---- card layout
	const pB = sp(frame, fps, tRothFocus, 'smooth');
	const pD = sp(frame, fps, tEnd, 'smooth');
	const phaseK = frame >= tCutK;
	const rBox = phaseK ? lerpBox(K_R, EQUAL_R, pD) : lerpBox(EQUAL_R, ROTH_R, pB);
	const kBox = phaseK ? lerpBox(K_K, EQUAL_K, pD) : lerpBox(EQUAL_K, ROTH_K, pB);
	// before "and this is", the second card waits a little dimmer
	const kWait = 1 - sp(frame, fps, tAndThis, 'smooth');
	const kWaitDim = frame < tRothFocus ? kWait * 0.5 : 0;

	// ---- Roth: after-tax deposit from the debit card, then investments
	const depFrom: [number, number] = [790, 1190];
	const depTo: [number, number] = [R_SLOT1.x + (ROTH_R.w - 72) / 2, R_SLOT1.y + 50];
	const depP = prog(frame, tPutIn + 3, Math.max(14, tTaxes - tPutIn - 4), E.inOut);
	const [dx, dy] = arc(depP, depFrom, depTo, 160);
	const tileP = sp(frame, fps, tBuy, 'bouncy');
	const stepArrow = prog(frame, tBuy - 6, 10);
	const tfMarker = prog(frame, tTaxFree, 10);

	// ---- 401(k): paycheck line → card, then employer match
	const lineHi = sp(frame, fps, tChoose, 'snappy');
	const payP = prog(frame, tComes, Math.max(18, tPaycheck - tComes + 6), E.inOut);
	const payFrom: [number, number] = [STUB_LINE.x + ROW_W / 2 - 120, STUB_LINE.y];
	const payTo: [number, number] = [ROW1.x + ROW_W / 2, ROW1.y + ROW_H / 2];
	const [px, py] = arc(payP, payFrom, payTo, 120);
	const matchP = prog(frame, tMatch, Math.max(20, tAdds - tMatch + 4), E.inOut);
	const matchFrom: [number, number] = [1260, 60];
	const matchTo: [number, number] = [ROW2.x + ROW_W / 2, ROW2.y + ROW_H / 2];
	const [mx, my] = arc(matchP, matchFrom, matchTo, 60);
	const endFade = 1 - prog(frame, tEnd, 10);
	const stubOut = prog(frame, tEnd, 16, E.in);

	// ---- camera
	const overhead = {zoom: 1, x: 540, y: 960};
	const keys: CamKey[] = [
		{at: 0, ...overhead},
		{at: tDiff - 4, ...overhead},
		{at: tDiff + 20, zoom: 1.03, x: CONTENT_CX + 16, y: 800},
		{at: tInvestRet - 14, zoom: 1.03, x: CONTENT_CX + 16, y: 800},
		{at: tInvestRet + 6, ...overhead},
		{at: tCutK - 1, ...overhead},
		{at: tCutK, zoom: 1.6, x: 380, y: 1110, ease: () => 1}, // hard cut: pay stub close-up
		{at: tOffered - 4, zoom: 1.6, x: 380, y: 1110},
		{at: tOffered + 16, ...overhead},
	];

	const kTitleAt = t401 - 3;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<Camera keys={keys}>
				<StoneDesk seed={5} />

				{/* desk props */}
				{!phaseK && (
					<>
						<Pen x={120} y={1300} rot={-16} len={330} />
						<DebitCard x={640} y={1120} w={300} rot={7} />
					</>
				)}
				{phaseK && stubOut < 1 && <PayStub x={STUB.x} y={STUB.y + stubOut * 1200} w={STUB.w} h={STUB.h} rot={-1.5} lineHighlight={lineHi} lineLifted={payP > 0 ? 1 : 0} />}

				{/* "Retirement investing" above both */}
				<div style={{position: 'absolute', left: CARD.lx, width: CARD.rx + CARD.w - CARD.lx, top: 186, textAlign: 'center'}}>
					<Reveal at={tInvestRet} exitAt={tRothFocus - 4}>
						<div style={{fontSize: 40, fontWeight: 900, letterSpacing: 5, color: desk.ink}}>RETIREMENT INVESTING</div>
						<svg width={CARD.rx + CARD.w - CARD.lx} height={46} style={{display: 'block', marginTop: 8}}>
							<path
								d={`M ${CARD.w / 2} 44 L ${CARD.w / 2} 14 L ${CARD.rx - CARD.lx + CARD.w / 2} 14 L ${CARD.rx - CARD.lx + CARD.w / 2} 44`}
								fill="none"
								stroke={desk.green}
								strokeWidth={5}
								strokeLinejoin="round"
							/>
						</svg>
					</Reveal>
				</div>

				{/* ROTH IRA card */}
				<AccountCard x={rBox.x} y={rBox.y} w={rBox.w} h={rBox.h} scale={rBox.s} dim={rBox.dim} highlight={phaseK ? 0 : pB}>
					<div style={{position: 'absolute', inset: 0, padding: '34px 36px 0'}}>
						<Kicker>Account</Kicker>
						<Reveal at={tRoth - 3}>
							<div style={{marginTop: 12, fontSize: 64, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1, color: desk.ink}}>ROTH IRA</div>
						</Reveal>
						<div style={{marginTop: 22, height: 64}}>
							<Reveal at={tOpen}>
								<Chip tone="greenOutline" size={30}>
									You open it
								</Chip>
							</Reveal>
						</div>
						{/* steps — only while the card is large */}
						<div style={{opacity: phaseK ? 0 : pB}}>
							<div style={{position: 'absolute', left: 36, top: 224}}>
								<Kicker color={desk.body}>1 · Put money in</Kicker>
							</div>
							{depP < 1 && <Slot w={ROTH_R.w - 72} h={100} style={{position: 'absolute', left: 36, top: 268}} />}
							<div style={{position: 'absolute', left: 36, top: 414}}>
								<Kicker color={frame >= tBuy ? desk.body : desk.muted}>2 · Buy investments</Kicker>
							</div>
							{/* step arrow */}
							<svg width={40} height={46} style={{position: 'absolute', right: 52, top: 372, opacity: stepArrow}}>
								<path d="M20 2 L20 38 M8 27 L20 40 L32 27" stroke={desk.ink} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{frame < tBuy && <Slot w={ROTH_R.w - 72} h={180} style={{position: 'absolute', left: 36, top: 458}} />}
							{frame >= tBuy && (
								<div
									style={{
										position: 'absolute',
										left: 36,
										top: 458,
										width: ROTH_R.w - 72,
										height: 180,
										borderRadius: 20,
										background: '#FFFFFF',
										border: `4px solid ${desk.green}`,
										boxSizing: 'border-box',
										display: 'flex',
										alignItems: 'center',
										gap: 26,
										padding: '0 30px',
										transform: `scale(${0.85 + 0.15 * tileP})`,
										opacity: Math.min(1, tileP * 2),
									}}
								>
									<div style={{width: 120, height: 120, borderRadius: 18, background: desk.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
										<GrowthGlyph w={92} h={52} draw={prog(frame, tBuy + 4, 16)} />
									</div>
									<div>
										<div style={{fontSize: 42, fontWeight: 900, letterSpacing: -0.8, color: desk.ink, lineHeight: 1}}>Investments</div>
										<div style={{fontSize: 26, fontWeight: 700, color: desk.muted, marginTop: 8}}>bought with that money</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</AccountCard>

				{/* 401(k) card */}
				<AccountCard x={kBox.x} y={kBox.y} w={kBox.w} h={kBox.h} scale={kBox.s} dim={Math.max(kBox.dim, kWaitDim)} highlight={phaseK ? 1 - pD : 0}>
					<div style={{position: 'absolute', inset: 0, padding: '34px 36px 0'}}>
						<Kicker>Account</Kicker>
						<Reveal at={kTitleAt}>
							<div style={{marginTop: 12, fontSize: 64, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1, color: desk.ink}}>401(k)</div>
						</Reveal>
						<div style={{marginTop: 22, height: 64}}>
							<Reveal at={tThrough - 2}>
								<Chip tone="greenOutline" size={30}>
									Through your job
								</Chip>
							</Reveal>
						</div>
						{phaseK && (
							<div style={{opacity: endFade}}>
								{payP < 1 && <Slot w={ROW_W} h={ROW_H} style={{position: 'absolute', left: 36, top: 228}} />}
								{matchP < 1 && <Slot w={ROW_W} h={ROW_H} style={{position: 'absolute', left: 36, top: 398}} />}
							</div>
						)}
					</div>
				</AccountCard>

				{/* After-tax deposit (debit card → Roth) */}
				{!phaseK && frame >= tPutIn && (
					<div style={{position: 'absolute', left: dx - (ROTH_R.w - 72) / 2, top: dy - 50, opacity: kf(frame, [tPutIn, tPutIn + 4], [0, 1])}}>
						<div style={{transform: `scale(${mix(0.8, 1, depP)}) rotate(${mix(-6, 0, depP)}deg)`}}>
							<Chip tone="ink" size={38} style={{width: ROTH_R.w - 72, height: 100, boxSizing: 'border-box', justifyContent: 'center', borderRadius: 20, boxShadow: paperShadow(depP < 1 ? 0.8 : 0)}}>
								<CashGlyph size={30} color={desk.green} bg="rgba(30,158,87,0.18)" />
								After-tax money
							</Chip>
						</div>
					</div>
				)}

				{/* Tax-free withdrawals (out of the Roth) */}
				{!phaseK && (
					<div style={{position: 'absolute', left: ROTH_R.x, top: ROTH_R.y + ROTH_R.h + 18, width: ROTH_R.w}}>
						<Reveal at={tWithdraw}>
							<svg width={ROTH_R.w} height={40} style={{display: 'block'}}>
								<path d={`M ${ROTH_R.w / 2} 0 L ${ROTH_R.w / 2} 32 M ${ROTH_R.w / 2 - 13} 20 L ${ROTH_R.w / 2} 34 L ${ROTH_R.w / 2 + 13} 20`} stroke={desk.ink} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<div style={{marginTop: 8, padding: '20px 26px', borderRadius: 22, background: '#FFFFFF', boxShadow: paperShadow(0), textAlign: 'center'}}>
								<div style={{fontSize: 46, fontWeight: 900, letterSpacing: -1, color: desk.ink, lineHeight: 1.05}}>
									<span style={{position: 'relative', display: 'inline-block'}}>
										<span style={{position: 'absolute', left: -6, right: -6, top: '12%', bottom: '6%', background: desk.green, borderRadius: 8, transformOrigin: '0 50%', transform: `scaleX(${tfMarker})`, opacity: 0.95}} />
										<span style={{position: 'relative', color: tfMarker > 0.5 ? '#FFFFFF' : desk.ink}}>Tax-free</span>
									</span>{' '}
									withdrawals
								</div>
								<div style={{fontSize: 34, fontWeight: 700, color: desk.body, marginTop: 8}}>if rules are met</div>
							</div>
						</Reveal>
					</div>
				)}

				{/* Paycheck deposit (stub → 401(k) row 1) */}
				{phaseK && frame >= tComes && (
					<div style={{position: 'absolute', left: px - ROW_W / 2, top: py - ROW_H / 2, opacity: endFade}}>
						<div style={{transform: `scale(${mix(0.72, 1, payP)}) rotate(${mix(-4, 0, payP)}deg)`}}>
							<Deposit tone="you" label="From your paycheck" w={ROW_W} h={ROW_H} lift={payP < 1 ? 0.8 : 0} />
						</div>
					</div>
				)}
				{/* Employer match (separate deposit → row 2) */}
				{phaseK && frame >= tMatch && (
					<div style={{position: 'absolute', left: mx - ROW_W / 2, top: my - ROW_H / 2, opacity: endFade}}>
						<div style={{transform: `scale(${mix(0.85, 1, matchP)}) rotate(${mix(8, 0, matchP)}deg)`}}>
							<Deposit tone="employer" label={<>Employer match,<br />if offered</>} w={ROW_W} h={ROW_H} lift={matchP < 1 ? 0.8 : 0} />
						</div>
					</div>
				)}

				{/* Ending: equal prominence, Roth IRA + 401(k) */}
				{frame >= tEnd && (
					<>
						<div
							style={{
								position: 'absolute',
								left: CARD.lx + CARD.w + (CARD.rx - CARD.lx - CARD.w) / 2 - 42,
								top: CARD.y + CARD.h / 2 - 42,
								width: 84,
								height: 84,
								borderRadius: 42,
								background: desk.green,
								color: '#FFFFFF',
								fontSize: 64,
								fontWeight: 900,
								lineHeight: '80px',
								textAlign: 'center',
								boxShadow: paperShadow(0),
								transform: `scale(${sp(frame, fps, tBoth, 'bouncy')})`,
							}}
						>
							+
						</div>
						<div style={{position: 'absolute', left: CARD.lx, width: CARD.rx + CARD.w - CARD.lx, top: CARD.y + CARD.h + 56, textAlign: 'center'}}>
							<Reveal at={tBoth}>
								<div style={{fontSize: 84, fontWeight: 900, letterSpacing: -2.5, color: desk.ink, lineHeight: 1}}>
									ROTH IRA <span style={{color: desk.green}}>+</span> 401(k)
								</div>
							</Reveal>
						</div>
					</>
				)}
			</Camera>
			<TopTitle hidden={kf(frame, [tInvestRet - 8, tInvestRet, tRothFocus + 4, tRothFocus + 14], [0, 1, 1, 0])} />

			<Sfx at={tRoth - 2} name="pop" volume={0.2} />
			<Sfx at={t401 - 2} name="pop" volume={0.2} />
			<Sfx at={tOpen} name="click" volume={0.25} />
			<Sfx at={tPutIn + 3} name="whoosh-soft" volume={0.25} />
			<Sfx at={tTaxes} name="card" volume={0.25} />
			<Sfx at={tBuy} name="tick" volume={0.3} />
			<Sfx at={tCutK} name="paper" volume={0.35} />
			<Sfx at={tComes} name="paper" volume={0.2} />
			<Sfx at={tPaycheck + 4} name="cash" volume={0.25} />
			<Sfx at={tAdds} name="coin" volume={0.25} />
		</AbsoluteFill>
	);
};
