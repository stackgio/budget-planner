import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, Check, DepositChip, ExampleTag, L, Panel, StepTag, VaultBg, fmt} from '../ui';

type Box = {x: number; y: number; w: number; h: number};
const lerpBox = (a: Box, b: Box, t: number): Box => ({x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t)});

const AccountCard: React.FC<{box: Box; compact: number; kind: 'checking' | 'savings'; badge?: number; glow?: number; opacity?: number; dy?: number}> = ({box, compact, kind, badge = 0, glow = 0, opacity = 1, dy = 0}) => {
	const savings = kind === 'savings';
	const title = savings ? 'High-Yield Savings' : 'Checking';
	const sub = savings ? 'SAVINGS ONLY' : 'SPENDING MONEY';
	const ts = mix(40, 28, compact);
	return (
		<Panel glow={glow} style={{left: box.x, top: box.y + dy, width: box.w, height: box.h, opacity}}>
			<div style={{position: 'absolute', left: mix(36, 28, compact), top: mix(40, 28, compact), width: 72, height: 72, borderRadius: 20, background: savings ? C.greenSoft : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - compact}}>
				<svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke={savings ? C.green : C.gray} strokeWidth={3.5} strokeLinejoin="round">
					{savings ? (
						<g>
							<rect x={5} y={9} width={30} height={25} rx={5} />
							<circle cx={20} cy={21.5} r={6} />
							<path d="M20 15.5 V13 M20 30 V27.5" />
						</g>
					) : (
						<g>
							<rect x={4} y={10} width={32} height={22} rx={4} />
							<path d="M4 17 H36" />
						</g>
					)}
				</svg>
			</div>
			<div style={{position: 'absolute', left: mix(132, 28, compact), top: mix(42, 30, compact), fontSize: ts, fontWeight: 800, color: C.white, whiteSpace: 'nowrap'}}>{title}</div>
			<div style={{position: 'absolute', left: mix(132, 28, compact), top: mix(94, 74, compact), fontSize: 24, fontWeight: 700, letterSpacing: 2, color: savings ? C.green : C.gray, whiteSpace: 'nowrap'}}>{sub}</div>
			{savings && (
				<div style={{position: 'absolute', right: 28, top: mix(42, 120, compact), padding: '6px 14px', borderRadius: 10, background: C.green, color: C.bg, fontSize: 24, fontWeight: 900, letterSpacing: 2, transform: `scale(${badge})`, transformOrigin: '100% 50%'}}>HIGH-YIELD</div>
			)}
			{!savings && (
				<div style={{position: 'absolute', left: mix(132, 28, compact), top: mix(150, 120, compact), fontSize: 24, fontWeight: 600, color: C.gray, opacity: 1}}>Bills · groceries · fun</div>
			)}
		</Panel>
	);
};

const ROWS: [string, string, boolean][] = [
	['TRANSFER', fmt(FACTS.transfer.value), true],
	['FREQUENCY', 'EVERY PAYDAY', false],
	['DESTINATION', 'SAVINGS', true],
];
const PAYDAYS = [6, 20];

/**
 * STEP 02 — "Open a high-yield savings account. Keep your savings separate from your
 * spending money, and set up automatic transfers every payday."
 * A savings account opens beside checking, money moves across, the cards dock and an
 * auto-transfer sheet confirms; an example calendar marks every payday.
 */
export const HysaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tNum = cue('L11', 'Number');
	const tOpen = cue('L11', 'open');
	const tHY = cue('L11', 'high-yield');
	const tSep = cue('L12', 'separate');
	const tMoney = cue('L12', 'money');
	const tSet = cue('L12', 'set');
	const tAuto = cue('L12', 'automatic');
	const tTransE = cue('L12', 'transfers', 0, 'end');
	const tEvery = cue('L12', 'every');
	const tPayday = cue('L12', 'payday');

	const chkIn = sp(frame, fps, 0, 'smooth');
	const savIn = sp(frame, fps, tOpen, 'bouncy');
	const badge = sp(frame, fps, tHY, 'snappy');
	const tKeepL = cue('L12', 'Keep');
	const sep = kf(frame, [tKeepL, tSep + 6], [0, 1], E.inOut);
	const dock = sp(frame, fps, tSet - 4, 'smooth');

	const chkA: Box = {x: L.x, y: 300, w: L.w, h: 230};
	const savA: Box = {x: L.x, y: mix(570, 700, sep), w: L.w, h: 230};
	const chkB: Box = {x: L.x, y: 290, w: (L.w - 24) / 2, h: 180};
	const savB: Box = {x: L.x + (L.w + 24) / 2, y: 290, w: (L.w - 24) / 2, h: 180};
	const chk = lerpBox(chkA, chkB, dock);
	const sav = lerpBox(savA, savB, dock);

	// money moves checking → savings
	const PIPE_X = L.x + L.w - 150;
	const pipe = kf(frame, [tSep - 8, tSep + 6], [0, 1], E.out) * (1 - kf(frame, [tSet - 6, tSet + 2], [0, 1], E.in));
	const mt = kf(frame, [tSep + 2, tMoney + 8], [0, 1], E.inOut);
	const mx = PIPE_X;
	const my = mix(chkA.y + 150, savA.y + 112, mt);
	const mOp = mt > 0 && mt < 1 ? 1 : 0;
	const arrived = sp(frame, fps, tMoney + 8, 'bouncy') * (1 - dock);
	// paydays on the calendar send their transfer up to the docked savings card
	const payAt = PAYDAYS.map((_, i) => tPayday - 6 + i * 7);
	const flights = PAYDAYS.map((d, i) => {
		const t = kf(frame, [payAt[i] + 2, payAt[i] + 14], [0, 1], E.inOut);
		const col = (d - 1) % 7;
		const row = Math.floor((d - 1) / 7);
		const from: [number, number] = [L.x + 30 + col * 118.3 + 59, 902 + 128 + row * 64 + 27];
		const to: [number, number] = [savB.x + savB.w / 2, savB.y + savB.h / 2];
		return {t, x: mix(from[0], to[0], t), y: mix(from[1], to[1], t) - Math.sin(t * Math.PI) * 40};
	});
	const autoGlow = Math.max(0, ...payAt.map((a) => kf(frame, [a + 14, a + 16, a + 26], [0, 1, 0.35], E.out)));
	const savGlow = Math.max(kf(frame, [tMoney + 6, tMoney + 12, tSet - 4], [0, 1, 0.3], E.out) * (1 - dock), autoGlow);
	const sepLabel = kf(sep, [0.55, 1], [0, 1]) * (1 - dock);

	const sheet = sp(frame, fps, tSet, 'smooth');
	const conf = kf(frame, [tTransE - 2, tTransE + 14], [0, 1], E.out);
	const toggle = sp(frame, fps, tTransE - 4, 'snappy');
	const cal = sp(frame, fps, tEvery - 4, 'smooth');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.8} gy={700} />
			<StepTag n="02" label="AUTOMATE" at={tNum - 2} />

			<Camera
				keys={[
					{at: 0, zoom: 1, x: 540, y: 960},
					{at: tOpen - 2, zoom: 1, x: 540, y: 960},
					{at: tHY + 6, zoom: 1.08, x: 530, y: 820, ease: E.inOut},
					{at: tMoney + 10, zoom: 1.08, x: 530, y: 870, ease: E.soft},
					{at: tSet + 4, zoom: 1, x: 540, y: 960, ease: E.inOut},
				]}
			>
			<AccountCard box={chk} compact={dock} kind="checking" opacity={chkIn} dy={(1 - chkIn) * 40} />
			<AccountCard box={sav} compact={dock} kind="savings" badge={badge} glow={savGlow} opacity={Math.min(1, savIn * 1.4)} dy={(1 - savIn) * 120} />
			<div style={{position: 'absolute', left: L.x, width: L.w, top: (chkA.y + chkA.h + savA.y) / 2 - 16, display: 'flex', alignItems: 'center', gap: 20, opacity: sepLabel}}>
				<div style={{flex: 1, borderTop: `2px dashed ${C.grayDim}`}} />
				<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 4, color: C.gray}}>KEEP SEPARATE</div>
				<div style={{flex: 1, borderTop: `2px dashed ${C.grayDim}`}} />
			</div>
			{/* the transfer travels through a pipe between the two accounts */}
			<div
				style={{
					position: 'absolute',
					left: PIPE_X - 4,
					top: chkA.y + chkA.h,
					width: 8,
					height: Math.max(0, (savA.y - chkA.y - chkA.h) * pipe),
					borderRadius: 4,
					background: `repeating-linear-gradient(180deg, ${C.green} 0px, ${C.green} 10px, transparent 10px, transparent 20px)`,
					backgroundPositionY: frame * 2.5,
					opacity: 0.85 * pipe,
				}}
			/>
			<DepositChip text={fmt(FACTS.transfer.value)} style={{left: mx, top: my, transform: 'translate(-50%,-50%)', opacity: mOp}} />
			<div style={{position: 'absolute', left: savA.x + savA.w - 260, width: 232, textAlign: 'right', top: savA.y + 150, fontSize: 40, fontWeight: 900, color: C.green, opacity: arrived, transform: `scale(${0.7 + 0.3 * arrived})`, transformOrigin: '100% 50%'}}>
				+{fmt(FACTS.transfer.value)}
			</div>
			<ExampleTag style={{left: L.x, top: 960, opacity: savIn * (1 - dock)}} text="EXAMPLE · RATES VARY BY BANK" />
			</Camera>

			{/* auto-transfer sheet */}
			<div style={{position: 'absolute', left: L.x, top: 500, width: L.w, height: 370, borderRadius: 34, background: '#FFFFFF', boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${50 * conf}px rgba(57,255,136,${0.35 * conf})`, opacity: sheet, transform: `translateY(${(1 - sheet) * 120}px)`}}>
				<div style={{position: 'absolute', left: 36, top: 34, fontSize: 34, fontWeight: 900, letterSpacing: 2, color: C.bg}}>AUTOMATIC TRANSFER</div>
				<div style={{position: 'absolute', right: 120, top: 26}}>
					<Check size={52} p={conf} color="#12A150" />
				</div>
				<div style={{position: 'absolute', right: 32, top: 34, width: 72, height: 40, borderRadius: 20, background: toggle > 0.5 ? '#12A150' : 'rgba(11,15,13,0.15)'}}>
					<div style={{position: 'absolute', top: 4, left: 4 + 32 * toggle, width: 32, height: 32, borderRadius: '50%', background: C.white}} />
				</div>
				{ROWS.map(([k, v, green], i) => {
					const r = sp(frame, fps, tAuto + i * 5, 'snappy');
					return (
						<div key={k} style={{position: 'absolute', left: 36, right: 36, top: 112 + i * 84, height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px solid rgba(11,15,13,0.10)', opacity: r, transform: `translateX(${(1 - r) * 40}px)`}}>
							<div style={{fontSize: 26, fontWeight: 700, letterSpacing: 3, color: '#5F6068'}}>{k}</div>
							<div style={{fontSize: 34, fontWeight: 900, color: C.bg, background: green ? C.green : 'transparent', padding: green ? '4px 16px' : 0, borderRadius: 12}}>{v}</div>
						</div>
					);
				})}
			</div>

			{/* example payday calendar */}
			<Panel style={{left: L.x, top: 902, width: L.w, height: 460, opacity: cal, transform: `translateY(${(1 - cal) * 60}px)`}}>
				<div style={{position: 'absolute', left: 30, top: 28, fontSize: 28, fontWeight: 900, letterSpacing: 3, color: C.white}}>EVERY PAYDAY</div>
				<ExampleTag style={{right: 30, top: 22}} text="EXAMPLE SCHEDULE" />
				{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
					<div key={i} style={{position: 'absolute', left: 30 + i * 118.3, width: 118.3, top: 88, textAlign: 'center', fontSize: 24, fontWeight: 700, color: C.gray}}>{d}</div>
				))}
				{Array.from({length: 30}, (_, i) => {
					const day = i + 1;
					const col = i % 7;
					const row = Math.floor(i / 7);
					const pi = PAYDAYS.indexOf(day);
					const lit = pi >= 0 ? sp(frame, fps, tPayday - 6 + pi * 7, 'bouncy') : 0;
					return (
						<div key={day} style={{position: 'absolute', left: 30 + col * 118.3 + 14, top: 128 + row * 64, width: 90, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 26, fontWeight: 800, color: lit > 0.5 ? C.bg : 'rgba(255,255,255,0.55)', background: lit > 0 ? `rgba(57,255,136,${lit})` : 'transparent', transform: `scale(${0.85 + 0.15 * (pi >= 0 ? lit : 1)})`}}>
							{day}
						</div>
					);
				})}
			</Panel>

			{flights.map((f, i) => (f.t > 0 && f.t < 1 ? <div key={i} style={{position: 'absolute', left: f.x - 16, top: f.y - 16, width: 32, height: 32, borderRadius: '50%', background: C.green, boxShadow: '0 0 22px rgba(57,255,136,0.7)'}} /> : null))}

			<Sfx at={tOpen + 2} name="card" volume={0.3} />
			<Sfx at={payAt[0] + 14} name="coin" volume={0.2} />
			<Sfx at={payAt[1] + 14} name="coin" volume={0.2} />
			<Sfx at={tMoney + 8} name="coin" volume={0.32} />
			<Sfx at={tTransE + 4} name="click" volume={0.3} />
			<Sfx at={tPayday - 4} name="pop" volume={0.22} />
		</AbsoluteFill>
	);
};
