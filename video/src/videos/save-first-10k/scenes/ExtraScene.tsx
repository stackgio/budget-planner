import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, arc, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {BAL_AFTER_EXTRA, EXTRA_SPEND, FACTS} from '../facts';
import {C, DepositChip, ExampleTag, GoalBar, L, Panel, StepTag, VaultBg, fmt} from '../ui';

const SOURCES = ['OVERTIME', 'SIDE HUSTLE', 'BONUS'];
const SRC = {y: 486, h: 104, w: (L.w - 40) / 3};
const ACCT = {y: 640, h: 180};
const SPLIT = {y: 860, h: 170, w: (L.w - 24) / 2};
export const EXTRA_BAR_Y = 1190;

/**
 * STEP 04 — "Give your extra income a purpose. Overtime, side hustles, bonuses, before you
 * spend it all, put some toward your $10,000 goal."
 * Three sources feed an incoming account; an example $200 splits 50/50; the saved half
 * arcs into the same $10,000 goal bar from the hook.
 */
export const ExtraScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tNum = cue('L16', 'Number');
	const tGive = cue('L16', 'give');
	const tPurpose = cue('L16', 'purpose');
	const tSrc = [cue('L17', 'Overtime'), cue('L17', 'side'), cue('L17', 'bonuses')];
	const tBefore = cue('L18', 'before');
	const tSpend = cue('L18', 'spend');
	const tPut = cue('L18', 'put');
	const tToward = cue('L18', 'toward');
	const tGoal = cue('L18', 'goal');

	const head = sp(frame, fps, tGive - 2, 'snappy');
	const purpose = kf(frame, [tPurpose, tPurpose + 8], [0, 1], E.out);
	const acct = sp(frame, fps, tSrc[0] - 6, 'smooth');
	const pay = sp(frame, fps, tBefore, 'bouncy');
	const split = sp(frame, fps, tSpend, 'smooth');
	const goalIn = sp(frame, fps, tPut - 4, 'smooth');
	const tLand = cue('L18', '$10,000', 0.25);
	const fly = kf(frame, [tToward - 4, tLand], [0, 1], E.inOut);
	const landed = frame >= tLand;
	const land = sp(frame, fps, tLand, 'snappy');
	const bal = landed ? mix(FACTS.exampleBalance.value, BAL_AFTER_EXTRA, land) : FACTS.exampleBalance.value;

	const from: [number, number] = [L.x + SPLIT.w / 2, SPLIT.y + 60];
	const to: [number, number] = [L.x + L.w * (BAL_AFTER_EXTRA / FACTS.goal.value), EXTRA_BAR_Y + 15];
	const [fx, fy] = arc(fly, from, to, 60);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.8} gy={760} />
			<StepTag n="04" label="EXTRA INCOME" at={tNum - 2} />
			<div style={{position: 'absolute', left: L.x, top: 284, opacity: head, transform: `translateY(${(1 - head) * 24}px)`, fontSize: 72, fontWeight: 900, letterSpacing: -2, lineHeight: 1.04, color: C.white}}>
				GIVE EXTRA INCOME
				<br />
				<span style={{color: purpose > 0.5 ? C.green : C.white}}>A PURPOSE</span>
				<span style={{display: 'inline-block', width: 300 * purpose, height: 6, marginLeft: -300 * purpose, verticalAlign: 'bottom', background: C.green, borderRadius: 3, transform: 'translateY(-6px)'}} />
			</div>

			{/* sources */}
			{SOURCES.map((s, i) => {
				const p = sp(frame, fps, tSrc[i] - 2, 'bouncy');
				const x = L.x + i * (SRC.w + 20);
				const tok = kf(frame, [tSrc[i] + 4, tSrc[i] + 18], [0, 1], E.inOut);
				return (
					<React.Fragment key={s}>
						<Panel style={{left: x, top: SRC.y, width: SRC.w, height: SRC.h, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 24}}>
							<div style={{fontSize: 27, fontWeight: 900, letterSpacing: 2, color: C.white, whiteSpace: 'nowrap'}}>{s}</div>
						</Panel>
						{tok > 0 && tok < 1 && (
							<div style={{position: 'absolute', left: mix(x + SRC.w / 2, L.cx, tok) - 14, top: mix(SRC.y + SRC.h, ACCT.y + 40, tok) - 14, width: 28, height: 28, borderRadius: '50%', background: C.green, boxShadow: '0 0 20px rgba(57,255,136,0.6)'}} />
						)}
					</React.Fragment>
				);
			})}

			{/* incoming account */}
			<Panel glow={pay * (1 - split)} style={{left: L.x, top: ACCT.y, width: L.w, height: ACCT.h, opacity: acct, transform: `translateY(${(1 - acct) * 40}px)`}}>
				<div style={{position: 'absolute', left: 36, top: 36, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.gray}}>INCOMING</div>
				<div style={{position: 'absolute', left: 36, top: 80, fontSize: 40, fontWeight: 800, color: C.white}}>Extra income</div>
				<div style={{position: 'absolute', right: 36, top: 44, fontSize: 84, fontWeight: 900, color: C.green, letterSpacing: -2, opacity: pay, transform: `scale(${0.8 + 0.2 * pay})`, transformOrigin: '100% 50%'}}>+{fmt(FACTS.extra.value)}</div>
				<ExampleTag style={{right: 36, top: 134, opacity: pay, padding: '2px 12px'}} />
			</Panel>

			{/* the split */}
			{[0, 1].map((i) => {
				const save = i === 0;
				const x = L.x + i * (SPLIT.w + 24);
				const y = mix(ACCT.y + 20, SPLIT.y, split);
				return (
					<Panel key={i} glow={save ? kf(frame, [tPut, tPut + 8], [0, 0.8], E.out) * (landed ? 0.4 : 1) : 0} style={{left: x, top: y, width: SPLIT.w, height: SPLIT.h, opacity: split}}>
						<div style={{position: 'absolute', left: 30, top: 26, fontSize: 64, fontWeight: 900, letterSpacing: -2, color: save ? C.green : C.white, opacity: save && fly > 0 ? 0.35 : 1}}>{fmt(save ? FACTS.extraSave.value : EXTRA_SPEND)}</div>
						<div style={{position: 'absolute', left: 30, top: 112, fontSize: 24, fontWeight: 800, letterSpacing: 2, color: save ? C.green : C.gray, whiteSpace: 'nowrap'}}>{save ? '→ SAVINGS' : '→ AVAILABLE TO SPEND'}</div>
					</Panel>
				);
			})}

			{/* the $10,000 goal bar returns */}
			<div style={{opacity: goalIn, transform: `translateY(${(1 - goalIn) * 30}px)`}}>
				<div style={{position: 'absolute', left: L.x, top: EXTRA_BAR_Y - 112, fontSize: 28, fontWeight: 800, letterSpacing: 3, color: C.gray}}>$10,000 GOAL</div>
				<div style={{position: 'absolute', right: story.safe.right, top: EXTRA_BAR_Y - 124}}>
					<NumberCounter value={bal} fontSize={56} color={landed ? C.green : C.white} roll={false} />
				</div>
				<GoalBar y={EXTRA_BAR_Y} fill={bal / FACTS.goal.value} mile={1} labels={1} done={0} />
				<ExampleTag style={{left: L.cx - 160, top: EXTRA_BAR_Y + 54, padding: '2px 12px'}} text="EXAMPLE BALANCE" />
			</div>
			{fly > 0 && fly < 1 && <DepositChip text={`+${fmt(FACTS.extraSave.value)}`} style={{left: fx, top: fy, transform: 'translate(-50%,-50%)'}} />}

			<Sfx at={tSrc[0] + 16} name="coin" volume={0.22} />
			<Sfx at={tSrc[1] + 16} name="coin" volume={0.22} />
			<Sfx at={tSrc[2] + 16} name="coin" volume={0.22} />
			<Sfx at={tSpend + 2} name="card" volume={0.28} />
			<Sfx at={tGoal + 2} name="cash" volume={0.3} />
		</AbsoluteFill>
	);
};
