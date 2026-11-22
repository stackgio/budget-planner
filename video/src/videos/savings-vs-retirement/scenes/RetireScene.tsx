import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {AccountCard, desk, DeskSurface, PayStub} from '../../../story/components/Desk';
import {Bill} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, mix, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {BELOW, C, CARD} from '../layout';

const Title: React.FC<{text: string; p: number}> = ({text, p}) => (
	<div style={{position: 'absolute', left: 40, top: 44, right: 30, height: 72, overflow: 'hidden'}}>
		<div style={{fontSize: 66, fontWeight: 900, letterSpacing: -1.5, lineHeight: '72px', color: C.ink, transform: `translateY(${(1 - E.out(p)) * 76}px)`}}>{text}</div>
	</div>
);

const Sub: React.FC<{text: string; p: number}> = ({text, p}) => (
	<>
		<div style={{position: 'absolute', left: 40, top: 134, fontSize: 40, fontWeight: 800, letterSpacing: -0.5, color: C.greenDeep, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>{text}</div>
		<div style={{position: 'absolute', left: 40, right: 30, top: 206, height: 2, background: desk.hair}} />
	</>
);

/** Card-local layout of the contribution blocks / holding tile. */
const IN = {left: 24, w: CARD.w - 48, top1: 232, top2: 412};

/** Mini rising line for the investment holding; `draw` 0..1. */
const MiniChart: React.FC<{draw: number; w?: number; h?: number}> = ({draw, w = 112, h = 74}) => {
	const pts: [number, number][] = [
		[0, 60], [18, 52], [34, 56], [52, 38], [68, 42], [86, 22], [112, 8],
	];
	const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
	return (
		<svg width={w} height={h} viewBox="0 0 112 74" style={{overflow: 'visible'}}>
			<line x1={0} y1={70} x2={112} y2={70} stroke="rgba(18,19,22,0.18)" strokeWidth={3} />
			<polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.green} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
		</svg>
	);
};

/** "Employer" source badge (a separate place the money comes from). */
const EmployerBadge: React.FC<{x: number; y: number; p: number; style?: React.CSSProperties}> = ({x, y, p, style}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: 280,
			height: 300,
			borderRadius: 24,
			background: '#fff',
			boxShadow: desk.shadow(0.2),
			opacity: p,
			transform: `scale(${mix(0.85, 1, p)}) rotate(2deg)`,
			...style,
		}}
	>
		<svg width={130} height={120} viewBox="0 0 130 120" style={{position: 'absolute', left: 75, top: 34}}>
			<rect x={22} y={18} width={86} height={96} rx={6} fill={C.goldSoft} stroke={C.gold} strokeWidth={6} />
			{[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={40 + c * 32} y={34 + r * 22} width={18} height={12} rx={2} fill={C.gold} />))}
			<rect x={54} y={90} width={22} height={24} fill={C.gold} />
			<line x1={6} y1={114} x2={124} y2={114} stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
		</svg>
		<div style={{position: 'absolute', left: 0, right: 0, top: 172, textAlign: 'center', fontSize: 44, fontWeight: 900, letterSpacing: -1, color: C.ink}}>Employer</div>
		<div style={{position: 'absolute', left: 0, right: 0, top: 228, textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 3, color: C.muted}}>IF OFFERED</div>
	</div>
);

/**
 * RETIREMENT — same two card slots, now Roth IRA / 401(k). Viewer learns:
 * Roth = you open it, deposit already-taxed money, then buy investments;
 * 401(k) = through your job, from your paycheck, plus an employer match if offered.
 */
export const RetireScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	const tRoth = cue('L10', 'Roth', -0.05);
	const t401 = cue('L10', '401k', -0.05);
	const tBoth = cue('L12', 'Both', -0.05);
	const tRothFocus = cue('L13', undefined, -0.05);
	const tOpen = cue('L13', 'open', -0.05);
	const tPut = cue('L14', 'put', -0.1);
	const tBuy = cue('L14', 'buy', -0.05);
	const tWithdraw = cue('L15', 'withdrawal', -0.05);
	const tEarned = cue('L15', 'earned', -0.05);
	const tTaxFree = cue('L15', 'tax-free', -0.05);
	const t401Focus = cue('L16', undefined, -0.05);
	const tThrough = cue('L16', 'through', -0.05);
	const tStub = cue('L17', undefined, -0.1);
	const tChoose = cue('L17', 'choose', -0.05);
	const tStraight = cue('L17', 'straight', -0.05);
	const tMatch = cue('L18', 'match', -0.12);
	const tEnd = cue('L19', undefined, -0.05);
	const tHaveBoth = cue('L19', 'you', -0.05);

	// titles
	const rothT = prog(frame, tRoth, 12);
	const k401T = prog(frame, t401, 12);

	// "both are for retirement"
	const both = sp(frame, fps, tBoth, 'snappy') * (1 - prog(frame, tRothFocus + 6, 10));

	// focus
	const fL = sp(frame, fps, tRothFocus, 'smooth') * (1 - sp(frame, fps, t401Focus, 'smooth'));
	const fR = sp(frame, fps, t401Focus, 'smooth') * (1 - sp(frame, fps, tEnd, 'smooth'));
	const endLift = sp(frame, fps, tEnd, 'smooth');

	// ROTH: deposit (already taxed) → purchase (investments)
	const open = sp(frame, fps, tOpen, 'snappy');
	const dep = prog(frame, tPut, 22, E.inOut);
	const depLanded = frame >= tPut + 22;
	const buy = sp(frame, fps, tBuy, 'snappy');
	const chartDraw = mix(0, 0.62, prog(frame, tBuy + 4, 14)) + 0.38 * prog(frame, tEarned, 20);
	const note = sp(frame, fps, tWithdraw, 'snappy') * (1 - prog(frame, t401Focus, 10));
	const taxFreeMark = prog(frame, tTaxFree, 10);

	// 401(k): paycheck slice → employer piece
	const through = sp(frame, fps, tThrough, 'snappy');
	const stubIn = sp(frame, fps, tStub, 'smooth');
	const sliceShow = prog(frame, tChoose, 10);
	const pay = prog(frame, tStraight, 26, E.inOut);
	const payLanded = frame >= tStraight + 26;
	const emp = sp(frame, fps, tMatch - 4, 'snappy');
	const empFly = prog(frame, tMatch + 6, 22, E.inOut);
	const empLanded = frame >= tMatch + 28;
	const propsOut = prog(frame, tEnd, 14, E.in);
	const haveBoth = sp(frame, fps, tHaveBoth, 'bouncy');

	// absolute geometry
	const rothX = CARD.lx;
	const k401X = CARD.rx;
	const stub = {x: 72, y: 1040};
	const sliceFrom = {x: stub.x + 48 + 464 * 0.86, y: stub.y + 188, w: 464 * 0.14, h: 56};
	const block1 = {x: k401X + IN.left, y: CARD.y + IN.top1, w: IN.w, h: 156};
	const badge = {x: 680, y: 1040};
	const empFrom = {x: badge.x + 95, y: badge.y + 40, w: 90, h: 60};
	const block2 = {x: k401X + IN.left, y: CARD.y + IN.top2, w: IN.w, h: 196};

	const flyRect = (t: number, a: {x: number; y: number; w: number; h: number}, b: typeof a, lift: number) => {
		const [cx, cy] = arc(t, [a.x + a.w / 2, a.y + a.h / 2], [b.x + b.w / 2, b.y + b.h / 2], lift);
		const w = mix(a.w, b.w, E.inOut(t));
		const h = mix(a.h, b.h, E.inOut(t));
		return {left: cx - w / 2, top: cy - h / 2, width: w, height: h};
	};

	const billFrom: [number, number] = [-120, 1260];
	const billTo: [number, number] = [rothX + CARD.w / 2, CARD.y + 330];
	const [bx, by] = arc(dep, billFrom, billTo, 260);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />

			{/* "Both are for retirement" */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 186, opacity: both, transform: `translateY(${(1 - both) * -16}px)`}}>
				<div style={{textAlign: 'center', fontSize: 52, fontWeight: 900, letterSpacing: -1, color: C.ink}}>
					Both are for <span style={{color: C.greenDeep}}>retirement</span>
				</div>
				<div style={{position: 'absolute', top: 76, left: CARD.lx + CARD.w / 2, width: CARD.rx - CARD.lx, height: 40, borderTop: `4px solid ${C.ink}`, borderLeft: `4px solid ${C.ink}`, borderRight: `4px solid ${C.ink}`, borderRadius: '8px 8px 0 0', opacity: 0.85}} />
			</div>

			{/* LEFT — Roth IRA */}
			<AccountCard x={rothX} y={CARD.y} w={CARD.w} h={CARD.h} lift={Math.max(fL, endLift * 0.35)} highlight={fL} dim={fR}>
				<Title text="Roth IRA" p={rothT} />
				<Sub text="You open it" p={open} />
				{/* investment holding (after the purchase) */}
				<div
					style={{
						position: 'absolute',
						left: IN.left,
						width: IN.w,
						top: IN.top1 + 20,
						height: 220,
						borderRadius: 20,
						background: C.greenSoft,
						border: `3px solid ${C.green}`,
						boxSizing: 'border-box',
						opacity: buy,
						transform: `scale(${mix(0.7, 1, buy)})`,
					}}
				>
					<div style={{position: 'absolute', left: 26, top: 24, fontSize: 26, fontWeight: 800, letterSpacing: 4, color: C.greenDeep}}>YOU BOUGHT</div>
					<div style={{position: 'absolute', left: 26, top: 62, fontSize: 48, fontWeight: 900, letterSpacing: -1, color: C.ink}}>Investments</div>
					<div style={{position: 'absolute', left: 26, top: 130}}>
						<MiniChart draw={chartDraw} w={150} h={70} />
					</div>
				</div>
			</AccountCard>

			{/* RIGHT — 401(k) */}
			<AccountCard x={k401X} y={CARD.y} w={CARD.w} h={CARD.h} lift={Math.max(fR, endLift * 0.35)} highlight={fR} dim={fL}>
				<Title text="401(k)" p={k401T} />
				<Sub text="Through your job" p={through} />
				{payLanded && (
					<div style={{position: 'absolute', left: IN.left, width: IN.w, top: IN.top1, height: block1.h, borderRadius: 18, background: C.green, color: '#fff', padding: '18px 22px', boxSizing: 'border-box'}}>
						<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 4, opacity: 0.85}}>CONTRIBUTION 1</div>
						<div style={{fontSize: 38, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.05, marginTop: 6, opacity: prog(frame, tStraight + 26, 8)}}>From your paycheck</div>
					</div>
				)}
				{empLanded && (
					<div style={{position: 'absolute', left: IN.left, width: IN.w, top: IN.top2, height: block2.h, borderRadius: 18, background: C.goldSoft, border: `4px solid ${C.gold}`, color: C.ink, padding: '16px 20px', boxSizing: 'border-box'}}>
						<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 4, color: '#8A5E0B'}}>CONTRIBUTION 2</div>
						<div style={{fontSize: 36, fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.08, marginTop: 6, opacity: prog(frame, tMatch + 28, 8)}}>From your employer,<br />if offered</div>
					</div>
				)}
			</AccountCard>

			{/* Roth deposit: money labelled "Already taxed" moves into the account */}
			{frame >= tPut && frame < tBuy + 10 && (
				<div style={{position: 'absolute', left: bx, top: by, opacity: 1 - prog(frame, tBuy, 8), transform: `scale(${(depLanded ? 1 : mix(1.15, 1, dep)) * mix(1, 0.6, buy)}) rotate(${mix(-14, -3, dep)}deg)`}}>
					<Bill w={290} value="" style={{left: 0, top: 0}} />
					<div
						style={{
							position: 'absolute',
							left: -118,
							top: 58,
							padding: '8px 16px',
							background: '#fff',
							border: `4px solid ${C.ink}`,
							borderRadius: 12,
							fontSize: 28,
							fontWeight: 900,
							letterSpacing: 2,
							color: C.ink,
							whiteSpace: 'nowrap',
							boxShadow: desk.shadow(0.1),
							
						}}
					>
						ALREADY TAXED
					</div>
				</div>
			)}

			{/* Roth: tax-free note */}
			<div style={{position: 'absolute', left: BELOW.left, top: BELOW.top + 30, opacity: note, transform: `translateY(${(1 - note) * 24}px)`, borderLeft: `10px solid ${C.green}`, paddingLeft: 30}}>
				<div style={{fontSize: 62, fontWeight: 900, letterSpacing: -1.5, color: C.ink, lineHeight: 1.08}}>
					<span style={{position: 'relative'}}>
						<span style={{position: 'absolute', left: -6, right: -6, bottom: 6, height: 20, background: C.green, opacity: 0.3, transform: `scaleX(${taxFreeMark})`, transformOrigin: 'left'}} />
						<span style={{position: 'relative', color: C.greenDeep}}>Tax-free</span>
					</span>{' '}
					withdrawals
				</div>
				<div style={{fontSize: 50, fontWeight: 800, letterSpacing: -1, color: C.ink, lineHeight: 1.15}}>if you meet the rules</div>
			</div>

			{/* 401(k): pay stub + employer source */}
			<div style={{position: 'absolute', inset: 0, opacity: 1 - propsOut, transform: `translateY(${propsOut * 80}px)`}}>
				{frame >= tStub && <PayStub x={stub.x} y={mix(1960, stub.y, stubIn)} w={560} rot={-1.5} sliceShow={sliceShow} gone={pay > 0 ? 1 : 0} />}
				{frame >= tStub && sliceShow > 0 && pay === 0 && (
					<div style={{position: 'absolute', left: sliceFrom.x - 120, top: sliceFrom.y + 70, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: C.greenDeep, opacity: sliceShow}}>
						YOU CHOOSE
					</div>
				)}
				{frame >= tMatch - 4 && <EmployerBadge x={badge.x} y={badge.y} p={emp} />}
			</div>
			{pay > 0 && !payLanded && <div style={{position: 'absolute', ...flyRect(pay, sliceFrom, block1, 220), borderRadius: 14, background: C.green, boxShadow: desk.shadow(0.6)}} />}
			{empFly > 0 && !empLanded && (
				<div style={{position: 'absolute', ...flyRect(empFly, empFrom, block2, 200), borderRadius: 14, background: C.goldSoft, border: `4px solid ${C.gold}`, boxSizing: 'border-box', boxShadow: desk.shadow(0.6)}} />
			)}

			{/* ending */}
			<div style={{position: 'absolute', left: 0, right: 0, top: BELOW.top + 10, opacity: haveBoth}}>
				<div style={{position: 'absolute', top: 0, left: CARD.lx + CARD.w / 2, width: CARD.rx - CARD.lx, height: 44, borderBottom: `4px solid ${C.ink}`, borderLeft: `4px solid ${C.ink}`, borderRight: `4px solid ${C.ink}`, borderRadius: '0 0 8px 8px', opacity: 0.85}} />
				<div style={{position: 'absolute', left: 0, right: 0, top: 92, textAlign: 'center', fontSize: 96, fontWeight: 900, letterSpacing: -3, color: C.ink, transform: `scale(${mix(0.9, 1, haveBoth)})`}}>
					You can have <span style={{color: C.greenDeep}}>both</span>
				</div>
			</div>

			<Sfx at={tPut + 20} name="cash" volume={0.32} />
			<Sfx at={tBuy + 2} name="click" volume={0.4} />
			<Sfx at={tStub} name="paper" volume={0.45} />
			<Sfx at={tStraight + 24} name="card" volume={0.4} />
			<Sfx at={tMatch + 26} name="coin" volume={0.3} />
			<Sfx at={tHaveBoth} name="chime" volume={0.22} />
		</AbsoluteFill>
	);
};

